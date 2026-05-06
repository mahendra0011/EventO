const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

async function setupEthereal() {
  console.log('Creating Ethereal test email account...');
  
  try {
    // Create a test account
    const testAccount = await nodemailer.createTestAccount();
    
    console.log('✅ Ethereal account created successfully!');
    console.log('Email:', testAccount.user);
    console.log('Password:', testAccount.pass);
    console.log('');
    console.log('Follow these steps:');
    console.log('1. Update your .env file with these credentials:');
    console.log('');
    console.log(`   EMAIL_PROVIDER=ethereal`);
    console.log(`   EMAIL_USER=${testAccount.user}`);
    console.log(`   EMAIL_PASS=${testAccount.pass}`);
    console.log('');
    console.log('2. Restart your server');
    console.log('');
    console.log('You can also view sent emails at:');
    console.log(`https://ethereal.email/messages/?tab=inbox&id=${testAccount.user}`);
    
    // Optionally update .env automatically
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      envContent = envContent.replace(/EMAIL_PROVIDER=.*/, `EMAIL_PROVIDER=ethereal`);
      envContent = envContent.replace(/EMAIL_USER=.*/, `EMAIL_USER=${testAccount.user}`);
      envContent = envContent.replace(/EMAIL_PASS=.*/, `EMAIL_PASS=${testAccount.pass}`);
      fs.writeFileSync(envPath, envContent);
      console.log('');
      console.log('✅ .env file updated automatically!');
    }
  } catch (error) {
    console.error('Failed to create Ethereal account:', error.message);
    console.error('');
    console.error('Alternative: Create account manually at https://ethereal.email/');
    console.error('Then update .env with the credentials from that site.');
  }
}

setupEthereal();
