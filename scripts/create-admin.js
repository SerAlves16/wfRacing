const { createInterface } = require('node:readline/promises');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const config = require('../server/src/config/env');
const User = require('../server/src/models/models');
// Explicit local bootstrap; never create a default account on application startup.
async function main() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const username = (process.env.ADMIN_USERNAME || await rl.question('Admin username: ')).trim();
    const password = process.env.ADMIN_PASSWORD || await rl.question('Admin password (visible input): ');
    if (!username || username.length > 100 || password.length < 8 || Buffer.byteLength(password) > 72) throw new Error('Invalid username or password');
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 5000 });
    if (await User.exists({ username })) throw new Error('Username already exists; existing accounts are preserved');
    await User.create({ username, password: await bcrypt.hash(password, 10), usertype: 'admin' });
    console.log('Administrator created');
  } finally { rl.close(); await mongoose.disconnect(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });


