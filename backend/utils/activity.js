const ActivityLog = require('../models/ActivityLog');

const getClientIp = (req) => {
  const forwarded = req?.headers?.['x-forwarded-for'];
  if (forwarded) return String(forwarded).split(',')[0].trim();
  return req?.ip || req?.connection?.remoteAddress || '';
};

const logActivity = async ({
  req,
  actor,
  action,
  entity,
  entityId,
  message,
  metadata
}) => {
  try {
    await ActivityLog.create({
      actor: actor || req?.user?._id || req?.user?.id,
      action,
      entity,
      entityId,
      message,
      metadata,
      ipAddress: getClientIp(req),
      userAgent: req?.headers?.['user-agent'] || ''
    });
  } catch (error) {
    console.warn('[Activity] Failed to log activity:', error.message);
  }
};

module.exports = {
  getClientIp,
  logActivity
};
