const path = require('path');
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const args = process.argv.slice(2);

function getArg(name, fallback) {
  const index = args.indexOf(`--${name}`);
  if (index === -1) return fallback;
  return args[index + 1] || fallback;
}

function hasFlag(name) {
  return args.includes(`--${name}`);
}

function withoutIndexRuntimeFields(index) {
  const { key, ns, v, ...options } = index;
  return options;
}

function isLocalUri(uri) {
  return /mongodb(?:\+srv)?:\/\/(?:[^@/]+@)?(?:localhost|127\.0\.0\.1|\[::1\])/i.test(uri);
}

async function ensureCollection(targetDb, collectionInfo, existingTargetCollections) {
  if (existingTargetCollections.has(collectionInfo.name)) {
    return targetDb.collection(collectionInfo.name);
  }

  const options = collectionInfo.options || {};
  await targetDb.createCollection(collectionInfo.name, options);
  existingTargetCollections.add(collectionInfo.name);
  return targetDb.collection(collectionInfo.name);
}

async function copyCollection(sourceDb, targetDb, collectionInfo, existingTargetCollections, batchSize) {
  const sourceCollection = sourceDb.collection(collectionInfo.name);
  const targetCollection = await ensureCollection(targetDb, collectionInfo, existingTargetCollections);
  const estimatedCount = await sourceCollection.estimatedDocumentCount();
  let copiedCount = 0;
  let batch = [];

  console.log(`Copying ${collectionInfo.name} (${estimatedCount} estimated document(s))`);

  const cursor = sourceCollection.find({}, { batchSize });
  for await (const document of cursor) {
    batch.push({
      replaceOne: {
        filter: { _id: document._id },
        replacement: document,
        upsert: true,
      },
    });

    if (batch.length >= batchSize) {
      await targetCollection.bulkWrite(batch, { ordered: false });
      copiedCount += batch.length;
      batch = [];
    }
  }

  if (batch.length > 0) {
    await targetCollection.bulkWrite(batch, { ordered: false });
    copiedCount += batch.length;
  }

  const indexes = await sourceCollection.indexes();
  for (const index of indexes) {
    if (index.name === '_id_') continue;
    await targetCollection.createIndex(index.key, withoutIndexRuntimeFields(index));
  }

  console.log(`Copied ${collectionInfo.name}: ${copiedCount} document operation(s)`);
}

async function createView(targetDb, collectionInfo, existingTargetCollections) {
  if (existingTargetCollections.has(collectionInfo.name)) return;

  const { viewOn, pipeline = [], collation } = collectionInfo.options || {};
  if (!viewOn) {
    console.warn(`Skipping view ${collectionInfo.name}: missing viewOn option`);
    return;
  }

  const options = { viewOn, pipeline };
  if (collation) options.collation = collation;
  await targetDb.createCollection(collectionInfo.name, options);
  existingTargetCollections.add(collectionInfo.name);
  console.log(`Created view ${collectionInfo.name}`);
}

async function main() {
  const uri = getArg('uri', process.env.MONGODB_URI);
  const sourceDbName = getArg('from', process.env.MONGODB_SOURCE_DB || 'test');
  const targetDbName = getArg('to', process.env.MONGODB_TARGET_DB || 'evento');
  const batchSize = Number(getArg('batch-size', '500'));
  const dropTarget = hasFlag('drop-target');
  const allowLocal = hasFlag('allow-local');

  if (!uri) {
    throw new Error('Missing MongoDB URI. Pass --uri or set MONGODB_URI.');
  }

  if (sourceDbName === targetDbName) {
    throw new Error('Source and target database names must be different.');
  }

  if (!Number.isInteger(batchSize) || batchSize < 1) {
    throw new Error('--batch-size must be a positive integer.');
  }

  if (isLocalUri(uri) && !allowLocal) {
    throw new Error('Refusing to run against localhost without --allow-local.');
  }

  const client = new MongoClient(uri);
  await client.connect();

  try {
    const sourceDb = client.db(sourceDbName);
    const targetDb = client.db(targetDbName);
    const collections = await sourceDb.listCollections().toArray();
    const userCollections = collections.filter(({ name }) => !name.startsWith('system.'));
    const concreteCollections = userCollections.filter(({ type }) => type !== 'view');
    const views = userCollections.filter(({ type }) => type === 'view');

    if (userCollections.length === 0) {
      throw new Error(`Source database "${sourceDbName}" has no user collections.`);
    }

    if (dropTarget) {
      console.log(`Dropping target database "${targetDbName}" before copy`);
      await targetDb.dropDatabase();
    }

    const targetCollectionInfos = await targetDb.listCollections().toArray();
    const existingTargetCollections = new Set(targetCollectionInfos.map(({ name }) => name));

    console.log(`Copying database "${sourceDbName}" to "${targetDbName}"`);
    for (const collectionInfo of concreteCollections) {
      await copyCollection(sourceDb, targetDb, collectionInfo, existingTargetCollections, batchSize);
    }

    for (const collectionInfo of views) {
      await createView(targetDb, collectionInfo, existingTargetCollections);
    }

    console.log(`Done. "${targetDbName}" now contains copied data from "${sourceDbName}".`);
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
