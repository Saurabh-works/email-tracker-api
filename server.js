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

mongoose.connect(
  process.env.MONGO_URI,
  { useNewUrlParser: true, useUnifiedTopology: true }
)
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
});
const Open = mongoose.model('Open', openSchema);

// Known bots or services (to avoid logging them)
const isBot = (userAgent = '') => {
  const botPatterns = [
    /google/i, /gmail/i, /yahoo/i, /outlook/i,
    /bot/i, /spider/i, /crawler/i, /headless/i,
    /phantomjs/i, /pingdom/i
  ];
  return botPatterns.some(pattern => pattern.test(userAgent));
};

app.get('/track-pixel', async (req, res) => {
  const ip = requestIp.getClientIp(req) || '8.8.8.8';
  const { emailId, recipientId } = req.query;
  const ua = uaParser(req.headers['user-agent']);
  const userAgent = req.headers['user-agent'] || '';

  console.log(`📍 /track-pixel HIT from ${userAgent}`);

  // Skip bot/preview hits
  if (isBot(userAgent)) {
    console.log('🚫 Bot detected. Skipping log.');
  } else {
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
    });

    try {
      await log.save();
      console.log('✅ Log saved');
    } catch (err) {
      console.error('❌ Log save error:', err.message);
    }
  }

  const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64');
  res.writeHead(200, {
    'Content-Type': 'image/gif',
    'Content-Length': pixel.length,
  });
  res.end(pixel);
});

app.get('/send-email', async (req, res) => {
  const to = req.query.to;
  if (!to) return res.status(400).json({ error: 'Missing recipient email' });

  const emailId = 'campaign-lite';
  const pixelUrl = `https://email-tracker-api-um5p.onrender.com/track-pixel?emailId=${emailId}&recipientId=${encodeURIComponent(to)}`;

  const html = `
    <h3>Hello 👋</h3>
    <p>This email contains a tracking pixel.</p>
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
          _id: { recipientId: "$recipientId", emailId: "$emailId" },
          openCount: { $sum: 1 },
          lastOpened: { $max: "$timestamp" },
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

app.get('/', (req, res) => {
  res.send('✅ Email Tracker Backend is Running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
