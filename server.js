// ✅ UPDATED BACKEND CODE (server.js or index.js)

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const requestIp = require('request-ip');
const nodemailer = require('nodemailer');
const axios = require('axios');
const uaParser = require('ua-parser-js');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

const openSchema = new mongoose.Schema({
  emailId: String,
  recipientId: String,
  ip: String,
  city: String,
  region: String,
  country: String,
  device: String,
  browser: String,
  os: String,
  timestamp: Date,
  type: String,
  count: { type: Number, default: 1 },
});
openSchema.index({ emailId: 1, recipientId: 1, type: 1 }, { unique: true });
const Open = mongoose.model('Open', openSchema);

const isBot = (ua = '') => /google|bot|crawler|preview|headless|gmail|outlook/i.test(ua);

const logInteraction = async (req, res, type = 'open') => {
  const ip = requestIp.getClientIp(req) || '8.8.8.8';
  const { emailId, recipientId } = req.query;
  const userAgent = req.headers['user-agent'] || '';
  if (!emailId || !recipientId || isBot(userAgent)) return;

  const ua = uaParser(userAgent);
  let geo = {};
  try {
    const g = await axios.get(`https://ipinfo.io/${ip}?token=${process.env.IPINFO_TOKEN}`);
    geo = g.data;
  } catch {}

  const update = {
    $set: {
      city: geo.city,
      region: geo.region,
      country: geo.country,
      device: ua.device?.type || 'desktop',
      browser: ua.browser?.name || '',
      os: ua.os?.name || '',
      timestamp: new Date(),
    },
    $inc: { count: 1 },
  };

  try {
    await Open.updateOne({ emailId, recipientId, type }, update, { upsert: true });
  } catch (err) {
    console.error('Log save error:', err.message);
  }
};

app.get('/track-pixel', async (req, res) => {
  await logInteraction(req, res, 'open');
  const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64');
  res.writeHead(200, {
    'Content-Type': 'image/gif',
    'Content-Length': pixel.length,
  });
  res.end(pixel);
});

app.get('/track-click', async (req, res) => {
  await logInteraction(req, res, 'click');
  res.redirect('https://yourwebsite.com/thank-you');
});

app.get('/send-email', async (req, res) => {
  const to = req.query.to;
  const emailId = 'campaign-lite';
  if (!to) return res.status(400).json({ error: 'Missing recipient email' });

  const pixelUrl = `${process.env.BASE_URL}/track-pixel?emailId=${emailId}&recipientId=${encodeURIComponent(to)}`;
  const clickUrl = `${process.env.BASE_URL}/track-click?emailId=${emailId}&recipientId=${encodeURIComponent(to)}`;

  const html = `<p><a href="${clickUrl}">Click here</a></p><img src="${pixelUrl}" width="1" height="1" style="display:none;" />`;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  try {
    await transporter.sendMail({ from: process.env.MAIL_USER, to, subject: 'Tracked Email', html });
    res.json({ message: 'Email sent' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send email' });
  }
});

app.get('/opens-summary', async (req, res) => {
  try {
    const summary = await Open.find({}, { _id: 0, recipientId: 1, emailId: 1, count: 1, timestamp: 1, type: 1 });
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get summary' });
  }
});

app.get('/opens-details', async (req, res) => {
  try {
    const logs = await Open.find().sort({ timestamp: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get logs' });
  }
});

app.get('/clicks', async (req, res) => {
  try {
    const clicks = await Open.find({ type: 'click' }).sort({ timestamp: -1 });
    res.json(clicks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get click logs' });
  }
});

app.get('/campaign-analytics', async (req, res) => {
  try {
    const emailId = req.query.emailId || 'campaign-lite';
    const [opens, clicks] = await Promise.all([
      Open.find({ emailId, type: 'open' }),
      Open.find({ emailId, type: 'click' }),
    ]);

    const uniqueOpens = opens.length;
    const totalOpens = opens.reduce((acc, o) => acc + o.count, 0);
    const uniqueClicks = clicks.length;
    const totalClicks = clicks.reduce((acc, c) => acc + c.count, 0);
    const recipients = await Open.distinct('recipientId', { emailId });

    const openRate = (uniqueOpens / recipients.length) * 100 || 0;
    const clickRate = (uniqueClicks / recipients.length) * 100 || 0;

    const lastActivity = [...opens, ...clicks].sort((a, b) => b.timestamp - a.timestamp)[0]?.timestamp;

    res.json([
      {
        emailId,
        totalSent: recipients.length,
        uniqueOpens,
        totalOpens,
        uniqueClicks,
        totalClicks,
        openRate,
        clickRate,
        lastActivity,
      },
    ]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log('🚀 Server ready');
});
