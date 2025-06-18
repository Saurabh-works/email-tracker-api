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

//   // const pixelUrl = `${process.env.BASE_URL}/track-pixel?emailId=${emailId}&recipientId=${encodeURIComponent(to)}&t=${Date.now()}`;
//   const pixelUrl = `https://email-tracker-api-um5p.onrender.com/track-pixel?emailId=${emailId}&recipientId=${encodeURIComponent(to)}&t=${Date.now()}`;
//   // const clickUrl = `${process.env.BASE_URL}/track-click?emailId=${emailId}&recipientId=${encodeURIComponent(to)}`;
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


const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const requestIp = require('request-ip');
const uaParser = require('ua-parser-js');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

const logSchema = new mongoose.Schema({
  campaignId: String,
  recipientId: String,
  type: String, // 'open' | 'click'
  timestamp: Date,
  ip: String,
  city: String,
  region: String,
  country: String,
  device: String,
  browser: String,
  os: String
});
const Log = mongoose.model('Log', logSchema);

const isBot = (ua) => /bot|crawler|preview|gmail|google|outlook|headless/i.test(ua);

async function logEvent(req, type) {
  const ip = requestIp.getClientIp(req) || '';
  const ua = req.headers['user-agent'] || '';
  const { emailId: campaignId, recipientId } = req.query;
  if (!campaignId || !recipientId || isBot(ua)) return;

  const { device, browser, os } = uaParser(ua);
  let geo = {};
  try {
    geo = (await axios.get(`https://ipinfo.io/${ip}?token=${process.env.IPINFO_TOKEN}`)).data;
  } catch {}

  await Log.create({
    campaignId,
    recipientId,
    type,
    timestamp: new Date(),
    ip,
    city: geo.city || '',
    region: geo.region || '',
    country: geo.country || '',
    device: device.type || 'desktop',
    browser: browser.name || '',
    os: os.name || '',
  });
}

app.get('/track-pixel', async (req, res) => {
  const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64');
  res.writeHead(200, {
    'Content-Type': 'image/gif',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Content-Length': pixel.length
  });
  res.end(pixel);
  logEvent(req, 'open'); // async logging
});

app.get('/track-click', async (req, res) => {
  logEvent(req, 'click'); // async logging
  res.redirect('https://demandmediabpm.com/');
});

app.get('/send-email', async (req, res) => {
  const to = req.query.to;
  const campaignId = 'campaign-lite';
  if (!to) return res.status(400).json({ error: 'Missing email' });

  const pixelUrl = `https://email-tracker-api-um5p.onrender.com/track-pixel?emailId=${campaignId}&recipientId=${encodeURIComponent(to)}&t=${Date.now()}`;
  const clickUrl = `https://email-tracker-api-um5p.onrender.com/track-click?emailId=${campaignId}&recipientId=${encodeURIComponent(to)}&t=${Date.now()}`;

  const html = `
    <p>Hello 👋</p>
    <p><a href="${clickUrl}">Click here</a></p>
    <img src="${pixelUrl}" width="1" height="1" style="display:none;" />
  `;

  const transporter = require('nodemailer').createTransport({
    service: 'gmail',
    auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS }
  });

  await transporter.sendMail({ from: process.env.MAIL_USER, to, subject: 'Tracked Email', html });
  res.json({ message: 'Email sent' });
});

app.get('/campaign-analytics', async (req, res) => {
  const campaignId = req.query.emailId || 'campaign-lite';

  const [opens, clicks, recipients] = await Promise.all([
    Log.find({ campaignId, type: 'open' }),
    Log.find({ campaignId, type: 'click' }),
    Log.distinct('recipientId', { campaignId })
  ]);

  const openMap = {};
  const clickMap = {};

  opens.forEach(o => openMap[o.recipientId] = (openMap[o.recipientId] || 0) + 1);
  clicks.forEach(c => clickMap[c.recipientId] = (clickMap[c.recipientId] || 0) + 1);

  const uniqueOpens = Object.keys(openMap).length;
  const totalOpens = opens.length;
  const uniqueClicks = Object.keys(clickMap).length;
  const totalClicks = clicks.length;
  const totalSent = recipients.length;

  const openRate = totalSent ? (uniqueOpens / totalSent) * 100 : 0;
  const clickRate = totalSent ? (uniqueClicks / totalSent) * 100 : 0;
  const lastActivity = Math.max(...[...opens, ...clicks].map(l => l.timestamp?.getTime() || 0));

  res.json([{
    emailId: campaignId,
    totalSent,
    uniqueOpens,
    totalOpens,
    openRate,
    uniqueClicks,
    totalClicks,
    clickRate,
    lastActivity: lastActivity ? new Date(lastActivity) : null
  }]);
});

app.get('/opens-summary', async (_, res) => {
  const logs = await Log.aggregate([
    { $match: { type: 'open' } },
    {
      $group: {
        _id: { campaignId: "$campaignId", recipientId: "$recipientId" },
        count: { $sum: 1 },
        timestamp: { $max: "$timestamp" }
      }
    },
    {
      $project: {
        emailId: "$_id.recipientId",
        campaignId: "$_id.campaignId",
        recipientId: "$_id.recipientId",
        count: 1,
        timestamp: 1,
        _id: 0
      }
    }
  ]);
  res.json(logs);
});

app.get('/clicks', async (_, res) => {
  const logs = await Log.aggregate([
    { $match: { type: 'click' } },
    {
      $group: {
        _id: { campaignId: "$campaignId", recipientId: "$recipientId" },
        count: { $sum: 1 },
        timestamp: { $max: "$timestamp" },
        ip: { $last: "$ip" },
        city: { $last: "$city" },
        region: { $last: "$region" },
        country: { $last: "$country" },
        device: { $last: "$device" },
        browser: { $last: "$browser" },
        os: { $last: "$os" },
      }
    },
    {
      $project: {
        emailId: "$_id.recipientId",
        campaignId: "$_id.campaignId",
        recipientId: "$_id.recipientId",
        count: 1,
        timestamp: 1,
        ip: 1, city: 1, region: 1, country: 1,
        device: 1, browser: 1, os: 1,
        _id: 0
      }
    }
  ]);
  res.json(logs);
});

app.listen(process.env.PORT || 3000, () => console.log('🚀 Server running'));

