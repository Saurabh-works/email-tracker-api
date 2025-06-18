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
  type: String, // 'open' or 'click'
});
const Open = mongoose.model('Open', openSchema);

const isBot = (userAgent = '') => {
  const botPatterns = [
    /google/i, /gmail/i, /yahoo/i, /outlook/i,
    /bot/i, /spider/i, /crawler/i, /headless/i, /phantomjs/i,
  ];
  return botPatterns.some(pattern => pattern.test(userAgent));
};

const logInteraction = async (req, res, type = 'open') => {
  const ip = requestIp.getClientIp(req) || '8.8.8.8';
  const { emailId, recipientId } = req.query;
  const userAgent = req.headers['user-agent'] || '';
  const ua = uaParser(userAgent);

  if (isBot(userAgent)) {
    console.log('🚫 Bot detected. Skipping log.');
    return;
  }

  let geo = {};
  try {
    const geoRes = await axios.get(`https://ipinfo.io/${ip}?token=${process.env.IPINFO_TOKEN}`);
    geo = geoRes.data;
  } catch (e) {
    console.log('⚠️ Geo lookup failed:', e.message);
  }

  const log = new Open({
    emailId,
    recipientId,
    ip,
    city: geo.city,
    region: geo.region,
    country: geo.country,
    device: ua.device?.type || 'desktop',
    browser: ua.browser?.name || '',
    os: ua.os?.name || '',
    timestamp: new Date(),
    type,
  });

  try {
    await log.save();
    console.log(`✅ ${type.toUpperCase()} log saved for`, recipientId);
  } catch (err) {
    console.error('❌ Log save error:', err.message);
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
  if (!to) return res.status(400).json({ error: 'Missing recipient email' });

  const emailId = 'campaign-lite';
  const pixelUrl = `https://email-tracker-api-um5p.onrender.com/track-pixel?emailId=${emailId}&recipientId=${encodeURIComponent(to)}`;
  const clickUrl = `https://email-tracker-api-um5p.onrender.com/track-click?emailId=${emailId}&recipientId=${encodeURIComponent(to)}`;

  const html = `
    <h3>Hello 👋</h3>
    <p>This email contains a tracking pixel and a tracked link.</p>
    <p><a href="${clickUrl}">Click here</a> to visit our site.</p>
    <img src="${pixelUrl}" width="1" height="1" style="display:none;" />
  `;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: `"Tracker" <${process.env.MAIL_USER}>`,
      to,
      subject: 'Tracked Email',
      html,
    });
    console.log('✅ Email sent to:', to);
    res.json({ message: 'Email sent' });
  } catch (err) {
    console.error('❌ Email send error:', err.message);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

app.get('/opens-summary', async (req, res) => {
  try {
    const data = await Open.aggregate([
      {
        $group: {
          _id: { recipientId: "$recipientId", emailId: "$emailId", type: "$type" },
          count: { $sum: 1 },
          lastTime: { $max: "$timestamp" },
        },
      },
    ]);
    res.json(data);
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

// 📊 Campaign Analytics
app.get('/campaign-analytics', async (req, res) => {
  try {
    const emailId = req.query.emailId || 'campaign-lite';

    const [opens, clicks, totalRecipients] = await Promise.all([
      Open.find({ emailId, type: 'open' }),
      Open.find({ emailId, type: 'click' }),
      Open.distinct('recipientId', { emailId, type: 'open' }),
    ]);

    const uniqueOpeners = [...new Set(opens.map(o => o.recipientId))];
    const uniqueClickers = [...new Set(clicks.map(c => c.recipientId))];

    const openRate = (uniqueOpeners.length / totalRecipients.length) * 100 || 0;
    const clickRate = (uniqueClickers.length / totalRecipients.length) * 100 || 0;

    const lastActivity = [...opens, ...clicks].sort((a, b) => b.timestamp - a.timestamp)[0]?.timestamp;

    res.json({
      totalEmailsSent: totalRecipients.length,
      totalOpens: opens.length,
      uniqueOpens: uniqueOpeners.length,
      openRate: openRate.toFixed(2) + '%',
      totalClicks: clicks.length,
      uniqueClicks: uniqueClickers.length,
      clickRate: clickRate.toFixed(2) + '%',
      lastActivity: lastActivity ? new Date(lastActivity) : null,
    });
  } catch (err) {
    console.error('❌ Analytics error:', err.message);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

app.get('/', (req, res) => {
  res.send('✅ Email Tracker Backend Running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
