// Load local configuration without putting credentials in source control.
const fs = require('node:fs');
const path = require('node:path');
const envFile = path.join(__dirname, '../../..', '.env');
if (fs.existsSync(envFile)) process.loadEnvFile(envFile);
const secret = process.env.JWT_SECRET;
if (!secret || secret.length < 32) throw new Error('Set JWT_SECRET with at least 32 characters in .env');
module.exports = { secret, mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/local', port: Number(process.env.PORT || 3000) };


