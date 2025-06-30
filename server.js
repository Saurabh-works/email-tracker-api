


// // 4 changes

// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const requestIp = require('request-ip');
// const uaParser = require('ua-parser-js');
// const axios = require('axios');
// const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");
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
//   type: String,
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

// const sesClient = new SESClient({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   },
// });

// const isBot = ua => /bot|crawler|preview|headless/i.test(ua);

// async function logEvent(req, type) {
//   const ip = requestIp.getClientIp(req) || '';
//   const ua = req.headers['user-agent'] || '';
//   const { emailId, recipientId } = req.query;

//   if (!emailId || !recipientId || isBot(ua)) {
//     console.log('⚠️ Skipped bot or missing data');
//     return;
//   }

//   const { device, browser, os } = uaParser(ua);
//   let geo = {};
//   try {
//     geo = (await axios.get(`https://ipinfo.io/${ip}?token=${process.env.IPINFO_TOKEN}`)).data;
//   } catch {}

// //   const log = await Log.findOne({ emailId, recipientId, type });

// //   if (!log) {
// //     await Log.create({
// //       emailId,
// //       recipientId,
// //       type,
// //       count: 1,
// //       timestamp: new Date(),
// //       ip,
// //       city: geo.city || '',
// //       region: geo.region || '',
// //       country: geo.country || '',
// //       device: device.type || 'desktop',
// //       browser: browser.name || '',
// //       os: os.name || ''
// //     });
// //   } else {
// //     await Log.updateOne(
// //       { emailId, recipientId, type },
// //       {
// //         $inc: { count: 1 },
// //         $set: {
// //           timestamp: new Date(),
// //           ip,
// //           city: geo.city || '',
// //           region: geo.region || '',
// //           country: geo.country || '',
// //           device: device.type || 'desktop',
// //           browser: browser.name || '',
// //           os: os.name || ''
// //         }
// //       }
// //     );
// //   }
// // }


// await Log.findOneAndUpdate(
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
//         os: os.name || ''
//       }
//     },
//     { upsert: true }
//   );

//   console.log('📩 Logged Event:', { emailId, recipientId, type, ip });
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
//   const { to, subject, body, emailId } = req.query;

//   if (!to || !subject || !body || !emailId)
//     return res.status(400).json({ error: 'Missing fields' });

//   const pixelUrl = `https://email-tracker-api-um5p.onrender.com/track-pixel?emailId=${emailId}&recipientId=${encodeURIComponent(to)}&t=${Date.now()}`;
//   const clickUrl = `https://email-tracker-api-um5p.onrender.com/track-click?emailId=${emailId}&recipientId=${encodeURIComponent(to)}`;

//   const htmlBody = `
//     <p>${body}</p>
//     <p><a href="${clickUrl}">Click here</a></p>
//     <img src="${pixelUrl}" width="1" height="1" style="display:none;" />
//   `;

//   const params = {
//     Destination: {
//       ToAddresses: [to],
//     },
//     Message: {
//       Body: {
//         Html: {
//           Charset: "UTF-8",
//           Data: htmlBody,
//         }
//       },
//       Subject: {
//         Charset: "UTF-8",
//         Data: subject,
//       },
//     },
//     Source: process.env.MAIL_FROM,
//   };

//   try {
//     await sesClient.send(new SendEmailCommand(params));
//     res.json({ message: 'Email sent' });
//   } catch (err) {
//     console.error('SES SDK Email Error:', err);
//     res.status(500).json({ error: 'Email sending failed', detail: err.message });
//   }
// });

// app.get('/campaign-analytics', async (req, res) => {
//   const emailId = req.query.emailId || 'campaign-lite';
//   const [opens, clicks, recipients] = await Promise.all([
//     Log.find({ emailId, type: 'open' }),
//     Log.find({ emailId, type: 'click' }),
//     Log.distinct('recipientId', { emailId })
//   ]);

//   const uniqueOpens = opens.length;
//   const totalOpens = opens.reduce((s, o) => s + o.count, 0);
//   const uniqueClicks = clicks.length;
//   const totalClicks = clicks.reduce((s, c) => s + c.count, 0);
//   const totalSent = recipients.length;
//   const openRate = totalSent ? (uniqueOpens / totalSent) * 100 : 0;
//   const clickRate = totalSent ? (uniqueClicks / totalSent) * 100 : 0;
//   const lastActivity = Math.max(...[...opens, ...clicks].map(l => l.timestamp?.getTime() || 0), 0);

//   res.json([{
//     emailId, totalSent, uniqueOpens, totalOpens, uniqueClicks, totalClicks, openRate, clickRate,
//     lastActivity: lastActivity ? new Date(lastActivity) : null
//   }]);
// });

// app.get('/opens-summary', async (req, res) => {
//   const emailId = req.query.emailId;
//   const data = await Log.find(emailId ? { emailId, type: 'open' } : { type: 'open' }, {
//     _id: 0, emailId: 1, recipientId: 1, count: 1, timestamp: 1
//   });
//   res.json(data);
// });

// app.get('/clicks', async (req, res) => {
//   const emailId = req.query.emailId;
//   const data = await Log.find(emailId ? { emailId, type: 'click' } : { type: 'click' }, {
//     _id: 0, emailId: 1, recipientId: 1, ip: 1, city: 1, region: 1, country: 1,
//     device: 1, browser: 1, os: 1, timestamp: 1
//   });
//   res.json(data);
// });

// app.get('/campaign-ids', async (_, res) => {
//   const ids = await Log.distinct('emailId');
//   res.json(ids);
// });

// app.listen(process.env.PORT || 3000, () => console.log('🚀 Server running'));

// next

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

  await Log.findOneAndUpdate(
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
    },
    { upsert: true }
  );

  console.log('📩 Logged Event:', { emailId, recipientId, type, ip });
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

app.get('/send-email', async (req, res) => {
  const { to, subject, body, emailId } = req.query;

  if (!to || !subject || !body || !emailId)
    return res.status(400).json({ error: 'Missing fields' });

  const pixelUrl = `https://email-tracker-api-um5p.onrender.com/track-pixel?emailId=${encodeURIComponent(emailId)}&recipientId=${encodeURIComponent(to)}&t=${Date.now()}`;
  const clickUrl = `https://email-tracker-api-um5p.onrender.com/track-click?emailId=${encodeURIComponent(emailId)}&recipientId=${encodeURIComponent(to)}`;

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
