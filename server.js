// // === BACKEND (server.js) ===
// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const requestIp = require('request-ip');
// const uaParser = require('ua-parser-js');
// const axios = require('axios');
// require('dotenv').config();

// const app = express();
// app.use(cors());
// app.use(express.json());

// mongoose.connect(process.env.MONGO_URI)
//   .then(() => console.log('✅ MongoDB connected'))
//   .catch(err => console.error('❌ MongoDB error:', err));

// const logSchema = new mongoose.Schema({
//   emailId: String,
//   recipientId: String,
//   type: String,           // 'open' or 'click'
//   count: { type: Number, default: 1 },
//   timestamp: Date,
//   ip: String,
//   city: String,
//   region: String,
//   country: String,
//   device: String,
//   browser: String,
//   os: String,
// });
// logSchema.index({ emailId: 1, recipientId: 1, type: 1 }, { unique: true });
// const Log = mongoose.model('Log', logSchema);

// const isBot = ua => /google|bot|crawler|preview|headless|gmail|outlook/i.test(ua);

// async function logEvent(req, type) {
//   const ip = requestIp.getClientIp(req) || '';
//   const ua = req.headers['user-agent'] || '';
//   const { emailId, recipientId } = req.query;
//   if (!emailId || !recipientId || isBot(ua)) return;

//   const { device, browser, os } = uaParser(ua);
//   let geo = {};
//   try {
//     geo = (await axios.get(`https://ipinfo.io/${ip}?token=${process.env.IPINFO_TOKEN}`)).data;
//   } catch {}

//   await Log.updateOne(
//     { emailId, recipientId, type },
//     {
//       $inc: { count: 1 },
//       $set: {
//         timestamp: new Date(),
//         ip,
//         city: geo.city || '',
//         region: geo.region || '',
//         country: geo.country || '',
//         device: device.type || 'desktop',
//         browser: browser.name || '',
//         os: os.name || '',
//       },
//     },
//     { upsert: true }
//   );
// }

// app.get('/track-pixel', async (req, res) => {
//   await logEvent(req, 'open');
//   const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64');
//   res.writeHead(200, {
//     'Content-Type': 'image/gif',
//     'Content-Length': pixel.length,
//     'Cache-Control': 'no-cache, no-store, must-revalidate',
//   });
//   res.end(pixel);
// });

// app.get('/track-click', async (req, res) => {
//   await logEvent(req, 'click');
//   res.redirect('https://demandmediabpm.com/');
// });

// app.get('/send-email', async (req, res) => {
//   const to = req.query.to;
//   const emailId = 'campaign-lite';
//   if (!to) return res.status(400).json({ error: 'Missing email' });

//   const pixelUrl = `https://email-tracker-api-um5p.onrender.com/track-pixel?emailId=${emailId}&recipientId=${encodeURIComponent(to)}&t=${Date.now()}`;
//   const clickUrl = `https://email-tracker-api-um5p.onrender.com/track-click?emailId=${emailId}&recipientId=${encodeURIComponent(to)}`;

//   const html = `
//     <p>Hello 👋<p>
//     <p><a href="${clickUrl}">Click here</a></p>
//     <img src="${pixelUrl}" width="1" height="1" style="display:none;" />
//   `;

//   const transporter = require('nodemailer').createTransport({
//     service: 'gmail',
//     auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS }
//   });
//   await transporter.sendMail({ from: process.env.MAIL_USER, to, subject: 'Tracked Email', html });
//   res.json({ message: 'Email sent' });
// });

// app.get('/campaign-analytics', async (req, res) => {
//   const emailId = req.query.emailId || 'campaign-lite';
//   const [opens, clicks, recipients] = await Promise.all([
//     Log.find({ emailId, type: 'open' }),
//     Log.find({ emailId, type: 'click' }),
//     Log.distinct('recipientId', { emailId })
//   ]);

//   const uniqueOpens = opens.length;
//   const totalOpens = opens.reduce((s,o) => s + o.count, 0);
//   const uniqueClicks = clicks.length;
//   const totalClicks = clicks.reduce((s,c) => s + c.count, 0);
//   const totalSent = recipients.length;
//   const openRate = totalSent ? (uniqueOpens/totalSent)*100 : 0;
//   const clickRate = totalSent ? (uniqueClicks/totalSent)*100 : 0;
//   const lastActivity = Math.max(
//     ...[...opens, ...clicks].map(l => l.timestamp.getTime()),
//     0
//   );

//   res.json([{
//     emailId, totalSent, uniqueOpens, totalOpens,
//     uniqueClicks, totalClicks, openRate, clickRate,
//     lastActivity: lastActivity ? new Date(lastActivity) : null
//   }]);
// });

// app.get('/opens-summary', async (_, res) => {
//   const data = await Log.find({ type: 'open' }, {
//     _id: 0, emailId:1, recipientId:1, count:1, timestamp:1
//   });
//   res.json(data);
// });

// app.get('/clicks', async (_, res) => {
//   const data = await Log.find({ type: 'click' }, {
//     _id: 0, emailId:1, recipientId:1, ip:1, city:1, region:1, country:1, device:1, browser:1, os:1, timestamp:1
//   });
//   res.json(data);
// });

// app.listen(process.env.PORT || 3000, () => console.log('🚀 Server running'));


// === BACKEND (server.js) ===
// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const requestIp = require('request-ip');
// const uaParser = require('ua-parser-js');
// const axios = require('axios');
// require('dotenv').config();

// const app = express();
// app.use(cors());
// app.use(express.json());

// mongoose.connect(process.env.MONGO_URI)
//   .then(() => console.log('✅ MongoDB connected'))
//   .catch(err => console.error('❌ MongoDB error:', err));

// const logSchema = new mongoose.Schema({
//   emailId: String,
//   recipientId: String,
//   type: String,           // 'open' or 'click'
//   count: { type: Number, default: 1 },
//   timestamp: Date,
//   ip: String,
//   city: String,
//   region: String,
//   country: String,
//   device: String,
//   browser: String,
//   os: String,
// });
// logSchema.index({ emailId: 1, recipientId: 1, type: 1 }, { unique: true });
// const Log = mongoose.model('Log', logSchema);

// const isBot = ua => /google|bot|crawler|preview|headless|gmail|outlook/i.test(ua);

// async function logEvent(req, type) {
//   const ip = requestIp.getClientIp(req) || '';
//   const ua = req.headers['user-agent'] || '';
//   const { emailId, recipientId } = req.query;
//   if (!emailId || !recipientId || isBot(ua)) return;

//   const { device, browser, os } = uaParser(ua);
//   let geo = {};
//   try {
//     geo = (await axios.get(`https://ipinfo.io/${ip}?token=${process.env.IPINFO_TOKEN}`)).data;
//   } catch {}

//   await Log.updateOne(
//     { emailId, recipientId, type },
//     {
//       $inc: { count: 1 },
//       $set: {
//         timestamp: new Date(),
//         ip,
//         city: geo.city || '',
//         region: geo.region || '',
//         country: geo.country || '',
//         device: device.type || 'desktop',
//         browser: browser.name || '',
//         os: os.name || '',
//       },
//     },
//     { upsert: true }
//   );
// }

// app.get('/track-pixel', async (req, res) => {
//   await logEvent(req, 'open');
//   const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64');
//   res.writeHead(200, {
//     'Content-Type': 'image/gif',
//     'Content-Length': pixel.length,
//     'Cache-Control': 'no-cache, no-store, must-revalidate',
//   });
//   res.end(pixel);
// });

//...................................................................................................
// === BACKEND (server.js) ===
// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const requestIp = require('request-ip');
// const uaParser = require('ua-parser-js');
// const axios = require('axios');
// require('dotenv').config();

// const app = express();
// app.use(cors());
// app.use(express.json());

// mongoose.connect(process.env.MONGO_URI)
//   .then(() => console.log('✅ MongoDB connected'))
//   .catch(err => console.error('❌ MongoDB error:', err));

// const logSchema = new mongoose.Schema({
//   emailId: String,
//   recipientId: String,
//   type: String,           // 'open' or 'click'
//   count: { type: Number, default: 1 },
//   timestamp: Date,
//   ip: String,
//   city: String,
//   region: String,
//   country: String,
//   device: String,
//   browser: String,
//   os: String,
// });
// logSchema.index({ emailId: 1, recipientId: 1, type: 1 }, { unique: true });
// const Log = mongoose.model('Log', logSchema);

// // ✅ UPDATED: Relaxed bot detection to allow Gmail/Outlook
// const isBot = ua => /bot|crawler|preview|headless/i.test(ua); // Removed "gmail|outlook"

// async function logEvent(req, type) {
//   const ip = requestIp.getClientIp(req) || '';
//   const ua = req.headers['user-agent'] || '';
//   const { emailId, recipientId } = req.query;

//   // ✅ NEW: Added log to check if route is hit
//   console.log(`📩 ${type.toUpperCase()} pixel requested from UA:`, ua, 'IP:', ip, 'Recipient:', recipientId);

//   if (!emailId || !recipientId || isBot(ua)) {
//     console.log('⚠️ Skipped logging due to missing data or bot UA');
//     return;
//   }

//   const { device, browser, os } = uaParser(ua);
//   let geo = {};
//   try {
//     geo = (await axios.get(`https://ipinfo.io/${ip}?token=${process.env.IPINFO_TOKEN}`)).data;
//   } catch {}

//   await Log.updateOne(
//     { emailId, recipientId, type },
//     {
//       $inc: { count: 1 },
//       $set: {
//         timestamp: new Date(),
//         ip,
//         city: geo.city || '',
//         region: geo.region || '',
//         country: geo.country || '',
//         device: device.type || 'desktop',
//         browser: browser.name || '',
//         os: os.name || '',
//       },
//     },
//     { upsert: true }
//   );
// }
//......................................................................

// async function logEvent(req, type) {
//   const ip = requestIp.getClientIp(req) || '';
//   const ua = req.headers['user-agent'] || '';
//   const { emailId, recipientId } = req.query;

//   console.log(`📩 ${type.toUpperCase()} pixel requested from UA:`, ua, 'IP:', ip, 'Recipient:', recipientId);

//   if (!emailId || !recipientId) {
//     console.log('⚠️ Skipped logging: missing emailId or recipientId');
//     return;
//   }

//   const { device, browser, os } = uaParser(ua);
//   let geo = {};
//   try {
//     geo = (await axios.get(`https://ipinfo.io/${ip}?token=${process.env.IPINFO_TOKEN}`)).data;
//   } catch {}

//   const existingLog = await Log.findOne({ emailId, recipientId, type });

//   if (!existingLog) {
//     // 🟡 NEW ENTRY: Create with count 0
//     await Log.create({
//       emailId,
//       recipientId,
//       type,
//       count: 0,
//       timestamp: new Date(),
//       ip,
//       city: geo.city || '',
//       region: geo.region || '',
//       country: geo.country || '',
//       device: device.type || 'desktop',
//       browser: browser.name || '',
//       os: os.name || '',
//     });
//     console.log(`🟨 Created new log for ${type} with count 0`);
//   } else {
//     // 🟢 EXISTING: Increment only if not a preload
//     if (!isBot(ua)) {
//       await Log.updateOne(
//         { emailId, recipientId, type },
//         {
//           $inc: { count: 1 },
//           $set: {
//             timestamp: new Date(),
//             ip,
//             city: geo.city || '',
//             region: geo.region || '',
//             country: geo.country || '',
//             device: device.type || 'desktop',
//             browser: browser.name || '',
//             os: os.name || '',
//           },
//         }
//       );
//       console.log(`✅ Count incremented for ${type}`);
//     } else {
//       console.log(`❌ Skipped count increment (preload/bot): ${ua}`);
//     }
//   }
// }

// working 2
//........................................................................

// async function logEvent(req, type) {
//   const ip = requestIp.getClientIp(req) || '';
//   const ua = req.headers['user-agent'] || '';
//   const { emailId, recipientId } = req.query;

//   console.log(`📩 ${type.toUpperCase()} hit:`, ua, 'IP:', ip, 'Recipient:', recipientId);

//   if (!emailId || !recipientId || isBot(ua)) {
//     console.log('⚠️ Skipped logging due to bot or missing data');
//     return;
//   }

//   const { device, browser, os } = uaParser(ua);
//   let geo = {};
//   try {
//     geo = (await axios.get(`https://ipinfo.io/${ip}?token=${process.env.IPINFO_TOKEN}`)).data;
//   } catch {}

//   const log = await Log.findOne({ emailId, recipientId, type });

//   if (!log) {
//     // First-time creation (likely prefetch)
//     await Log.create({
//       emailId,
//       recipientId,
//       type,
//       count: 1, // ✅ Directly count = 1 on first real open/click
//       timestamp: new Date(),
//       ip,
//       city: geo.city || '',
//       region: geo.region || '',
//       country: geo.country || '',
//       device: device.type || 'desktop',
//       browser: browser.name || '',
//       os: os.name || ''
//     });
//     console.log('✅ First real interaction — created with count = 1');
//   } else {
//     // Increment count
//     await Log.updateOne(
//       { emailId, recipientId, type },
//       {
//         $inc: { count: 1 },
//         $set: {
//           timestamp: new Date(),
//           ip,
//           city: geo.city || '',
//           region: geo.region || '',
//           country: geo.country || '',
//           device: device.type || 'desktop',
//           browser: browser.name || '',
//           os: os.name || ''
//         }
//       }
//     );
//     console.log('🔁 Subsequent interaction — incremented count');
//   }
// }

// app.get('/track-pixel', async (req, res) => {
//   await logEvent(req, 'open');

//   const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64');
//   res.writeHead(200, {
//     'Content-Type': 'image/gif',
//     'Content-Length': pixel.length,
//     'Cache-Control': 'no-cache, no-store, must-revalidate',
//   });
//   res.end(pixel);
// });

// app.get('/track-click', async (req, res) => {
//   await logEvent(req, 'click');
//   res.redirect('https://demandmediabpm.com/');
// });

// app.get('/send-email', async (req, res) => {
//   const to = req.query.to;
//   const emailId = 'campaign-lite';
//   if (!to) return res.status(400).json({ error: 'Missing email' });

//   const pixelUrl = `https://email-tracker-api-um5p.onrender.com/track-pixel?emailId=${emailId}&recipientId=${encodeURIComponent(to)}&t=${Date.now()}`;
//   const clickUrl = `https://email-tracker-api-um5p.onrender.com/track-click?emailId=${emailId}&recipientId=${encodeURIComponent(to)}`;

//   // Segment pixel payload base64 encoding
//   const segmentPayload = {
//     writeKey: process.env.SEGMENT_WRITE_KEY,
//     userId: encodeURIComponent(to),
//     event: "Email Opened",
//     properties: {
//       subject: "Tracked Email",
//       email: to
//     }
//   };
//   const segmentBase64 = Buffer.from(JSON.stringify(segmentPayload)).toString('base64');
//   const segmentPixelUrl = `https://api.segment.io/v1/pixel/track?data=${segmentBase64}`;

//   const html = `
//     <p>Hello 👋<p>
//     <p><a href="${clickUrl}">Click here</a></p>
//     <img src="${pixelUrl}" width="1" height="1" style="display:none;" />
//     <img src="${segmentPixelUrl}" width="1" height="1" style="display:none;" />
//   `;

//   const transporter = require('nodemailer').createTransport({
//     service: 'gmail',
//     auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS }
//   });
//   await transporter.sendMail({ from: process.env.MAIL_USER, to, subject: 'Tracked Email', html });
//   res.json({ message: 'Email sent' });
// });

// app.get('/campaign-analytics', async (req, res) => {
//   const emailId = req.query.emailId || 'campaign-lite';
//   const [opens, clicks, recipients] = await Promise.all([
//     Log.find({ emailId, type: 'open' }),
//     Log.find({ emailId, type: 'click' }),
//     Log.distinct('recipientId', { emailId })
//   ]);

//   const uniqueOpens = opens.length;
//   const totalOpens = opens.reduce((s,o) => s + o.count, 0);
//   const uniqueClicks = clicks.length;
//   const totalClicks = clicks.reduce((s,c) => s + c.count, 0);
//   const totalSent = recipients.length;
//   const openRate = totalSent ? (uniqueOpens/totalSent)*100 : 0;
//   const clickRate = totalSent ? (uniqueClicks/totalSent)*100 : 0;
//   const lastActivity = Math.max(
//     ...[...opens, ...clicks].map(l => l.timestamp.getTime()),
//     0
//   );

//   res.json([{
//     emailId, totalSent, uniqueOpens, totalOpens,
//     uniqueClicks, totalClicks, openRate, clickRate,
//     lastActivity: lastActivity ? new Date(lastActivity) : null
//   }]);
// });

// app.get('/opens-summary', async (_, res) => {
//   const data = await Log.find({ type: 'open' }, {
//     _id: 0, emailId:1, recipientId:1, count:1, timestamp:1
//   });
//   res.json(data);
// });

// app.get('/clicks', async (_, res) => {
//   const data = await Log.find({ type: 'click' }, {
//     _id: 0, emailId:1, recipientId:1, ip:1, city:1, region:1, country:1, device:1, browser:1, os:1, timestamp:1
//   });
//   res.json(data);
// });

// app.listen(process.env.PORT || 3000, () => console.log('🚀 Server running'));


// working 3
// ..............................................................................................

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const requestIp = require('request-ip');
const uaParser = require('ua-parser-js');
const axios = require('axios');
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

const logSchema = new mongoose.Schema({
  emailId: String,
  recipientId: String,
  type: String,
  count: { type: Number, default: 1 },
  timestamp: Date,
  ip: String,
  city: String,
  region: String,
  country: String,
  device: String,
  browser: String,
  os: String,
});
logSchema.index({ emailId: 1, recipientId: 1, type: 1 }, { unique: true });
const Log = mongoose.model('Log', logSchema);

const sesClient = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const isBot = ua => /bot|crawler|preview|headless/i.test(ua);

async function logEvent(req, type) {
  const ip = requestIp.getClientIp(req) || '';
  const ua = req.headers['user-agent'] || '';
  const { emailId, recipientId } = req.query;

  if (!emailId || !recipientId || isBot(ua)) {
    console.log('⚠️ Skipped bot or missing data');
    return;
  }

  const { device, browser, os } = uaParser(ua);
  let geo = {};
  try {
    geo = (await axios.get(`https://ipinfo.io/${ip}?token=${process.env.IPINFO_TOKEN}`)).data;
  } catch {}

  const log = await Log.findOne({ emailId, recipientId, type });

  if (!log) {
    await Log.create({
      emailId,
      recipientId,
      type,
      count: 1,
      timestamp: new Date(),
      ip,
      city: geo.city || '',
      region: geo.region || '',
      country: geo.country || '',
      device: device.type || 'desktop',
      browser: browser.name || '',
      os: os.name || ''
    });
  } else {
    await Log.updateOne(
      { emailId, recipientId, type },
      {
        $inc: { count: 1 },
        $set: {
          timestamp: new Date(),
          ip,
          city: geo.city || '',
          region: geo.region || '',
          country: geo.country || '',
          device: device.type || 'desktop',
          browser: browser.name || '',
          os: os.name || ''
        }
      }
    );
  }
}

app.get('/track-pixel', async (req, res) => {
  await logEvent(req, 'open');
  const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64');
  res.writeHead(200, {
    'Content-Type': 'image/gif',
    'Content-Length': pixel.length,
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  });
  res.end(pixel);
});

app.get('/track-click', async (req, res) => {
  await logEvent(req, 'click');
  res.redirect('https://demandmediabpm.com/');
});

// app.get('/send-email', async (req, res) => {
//   const { to, subject, body, campaignId } = req.query;
//   const emailId = campaignId || 'campaign-lite';
//   if (!to || !subject || !body || !emailId) return res.status(400).json({ error: 'Missing fields' });

//   const pixelUrl = `https://email-tracker-api-um5p.onrender.com/track-pixel?emailId=${emailId}&recipientId=${encodeURIComponent(to)}&t=${Date.now()}`;
//   const clickUrl = `https://email-tracker-api-um5p.onrender.com/track-click?emailId=${emailId}&recipientId=${encodeURIComponent(to)}`;

//   const html = `
//     <p>${body}</p>
//     <p><a href="${clickUrl}">Click here</a></p>
//     <img src="${pixelUrl}" width="1" height="1" style="display:none;" />
//   `;

//   const transporter = require('nodemailer').createTransport({
//     service: 'gmail',
//     auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS }
//   });

//   await transporter.sendMail({ from: process.env.MAIL_USER, to, subject, html });
//   res.json({ message: 'Email sent' });
// });

// app.get('/send-email', async (req, res) => {
//   const { to, subject, body, campaignId } = req.query;
//   const emailId = campaignId || 'campaign-lite';
//   if (!to || !subject || !body || !emailId)
//     return res.status(400).json({ error: 'Missing fields' });

//   const pixelUrl = `https://email-tracker-api-um5p.onrender.com/track-pixel?emailId=${emailId}&recipientId=${encodeURIComponent(to)}&t=${Date.now()}`;
//   const clickUrl = `https://email-tracker-api-um5p.onrender.com/track-click?emailId=${emailId}&recipientId=${encodeURIComponent(to)}`;

//   const html = `
//     <p>${body}</p>
//     <p><a href="${clickUrl}">Click here</a></p>
//     <img src="${pixelUrl}" width="1" height="1" style="display:none;" />
//   `;

//   const transporter = require('nodemailer').createTransport({
//     host: process.env.SES_HOST,
//     port: parseInt(process.env.SES_PORT, 10),
//     secure: false,
//     auth: {
//       user: process.env.MAIL_USER,   // your SMTP username (AKIA...)
//       pass: process.env.MAIL_PASS    // your SMTP password
//     }
//   });

//   try {
//     await transporter.sendMail({
//       from: process.env.MAIL_FROM,  // ✅ must be a verified email in SES
//       to,
//       subject,
//       html
//     });
//     res.json({ message: 'Email sent' });
//   } catch (err) {
//     console.error('SES Email Error:', err);
//     res.status(500).json({ error: 'Email sending failed' });
//   }
// });

app.get('/send-email', async (req, res) => {
  const { to, subject, body, campaignId } = req.query;
  const emailId = campaignId || 'campaign-lite';

  if (!to || !subject || !body || !emailId)
    return res.status(400).json({ error: 'Missing fields' });

  const pixelUrl = `https://email-tracker-api-um5p.onrender.com/track-pixel?emailId=${emailId}&recipientId=${encodeURIComponent(to)}&t=${Date.now()}`;
  const clickUrl = `https://email-tracker-api-um5p.onrender.com/track-click?emailId=${emailId}&recipientId=${encodeURIComponent(to)}`;

  const htmlBody = `
    <p>${body}</p>
    <p><a href="${clickUrl}">Click here</a></p>
    <img src="${pixelUrl}" width="1" height="1" style="display:none;" />
  `;

  const params = {
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: htmlBody,
        }
      },
      Subject: {
        Charset: "UTF-8",
        Data: subject,
      },
    },
    Source: process.env.MAIL_FROM,
  };

  try {
    await sesClient.send(new SendEmailCommand(params));
    res.json({ message: 'Email sent' });
  } catch (err) {
    console.error('SES SDK Email Error:', err);
    res.status(500).json({ error: 'Email sending failed', detail: err.message });
  }
});



app.get('/campaign-analytics', async (req, res) => {
  const emailId = req.query.emailId || 'campaign-lite';
  const [opens, clicks, recipients] = await Promise.all([
    Log.find({ emailId, type: 'open' }),
    Log.find({ emailId, type: 'click' }),
    Log.distinct('recipientId', { emailId })
  ]);

  const uniqueOpens = opens.length;
  const totalOpens = opens.reduce((s, o) => s + o.count, 0);
  const uniqueClicks = clicks.length;
  const totalClicks = clicks.reduce((s, c) => s + c.count, 0);
  const totalSent = recipients.length;
  const openRate = totalSent ? (uniqueOpens / totalSent) * 100 : 0;
  const clickRate = totalSent ? (uniqueClicks / totalSent) * 100 : 0;
  const lastActivity = Math.max(...[...opens, ...clicks].map(l => l.timestamp?.getTime() || 0), 0);

  res.json([{
    emailId, totalSent, uniqueOpens, totalOpens, uniqueClicks, totalClicks, openRate, clickRate,
    lastActivity: lastActivity ? new Date(lastActivity) : null
  }]);
});

app.get('/opens-summary', async (req, res) => {
  const emailId = req.query.emailId;
  const data = await Log.find(emailId ? { emailId, type: 'open' } : { type: 'open' }, {
    _id: 0, emailId: 1, recipientId: 1, count: 1, timestamp: 1
  });
  res.json(data);
});

app.get('/clicks', async (req, res) => {
  const emailId = req.query.emailId;
  const data = await Log.find(emailId ? { emailId, type: 'click' } : { type: 'click' }, {
    _id: 0, emailId: 1, recipientId: 1, ip: 1, city: 1, region: 1, country: 1,
    device: 1, browser: 1, os: 1, timestamp: 1
  });
  res.json(data);
});

app.get('/campaign-ids', async (_, res) => {
  const ids = await Log.distinct('emailId');
  res.json(ids);
});

app.listen(process.env.PORT || 3000, () => console.log('🚀 Server running'));
