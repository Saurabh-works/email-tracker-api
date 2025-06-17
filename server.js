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

// Connect to MongoDB
mongoose.connect(
  'mongodb+srv://Saurabh:Saurabh%402315@cluster0.5lyrbxh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
  { useNewUrlParser: true, useUnifiedTopology: true }
)
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Schema and Model
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

// Track Pixel
app.get('/track-pixel', async (req, res) => {
  console.log('📍 /track-pixel HIT');
  const ip = requestIp.getClientIp(req) || '8.8.8.8';
  const { emailId, recipientId } = req.query;

  console.log('🧾 Query Params:', { emailId, recipientId });
  console.log('📡 IP Address:', ip);
  console.log('🧠 User-Agent:', req.headers['user-agent']);

  const ua = uaParser(req.headers['user-agent']);
  let geo = {};

  try {
    const geoRes = await axios.get(`https://ipinfo.io/${ip}?token=${process.env.IPINFO_TOKEN}`);
    geo = geoRes.data;
    console.log('🌍 Geo Info:', geo);
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
    const saved = await log.save();
    console.log('✅ Log saved:', saved);
  } catch (err) {
    console.log('❌ Error saving log:', err.message);
  }

  const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64');
  res.writeHead(200, {
    'Content-Type': 'image/gif',
    'Content-Length': pixel.length,
  });
  res.end(pixel);
});

// Send Email
app.get('/send-email', async (req, res) => {
  const to = req.query.to;
  if (!to) {
    console.log('❌ Missing recipient email');
    return res.status(400).json({ error: 'Missing recipient email' });
  }

  const emailId = 'campaign-lite';
  const pixelUrl = `https://email-tracker-api-um5p.onrender.com/track-pixel?emailId=${emailId}&recipientId=${encodeURIComponent(to)}`;
  // const pixelUrl = `https://your-deployed-url.com/track-pixel?emailId=${emailId}&recipientId=${encodeURIComponent(to)}`;

  console.log(`✉️ Sending email to: ${to}`);
  console.log(`🖼️ Tracking Pixel URL: ${pixelUrl}`);

  const html = `
    <h3>Hello 👋</h3>
    <p>This is a tracked email.</p>
    <img src="${pixelUrl}" width="1" height="1" style="display:none;" />
  `;

  let transporter = nodemailer.createTransport({
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
      subject: 'Email with Pixel',
      html,
    });
    console.log('✅ Email sent successfully');
    res.json({ message: 'Email sent' });
  } catch (err) {
    console.error('❌ Failed to send email:', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Opens Summary
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
    console.log('📊 Summary Data:', data);
    res.json(data);
  } catch (err) {
    console.error('❌ Error getting summary:', err);
    res.status(500).json({ error: 'Failed to get summary' });
  }
});

// Opens Details
app.get('/opens-details', async (req, res) => {
  try {
    const logs = await Open.find().sort({ timestamp: -1 });
    console.log('📋 Full Logs:', logs);
    res.json(logs);
  } catch (err) {
    console.error('❌ Error getting details:', err);
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

