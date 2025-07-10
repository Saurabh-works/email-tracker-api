// // next
// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// const requestIp = require("request-ip");
// const uaParser = require("ua-parser-js");
// const axios = require("axios");
// const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");
// require("dotenv").config();

// const app = express();
// app.use(cors());
// app.use(express.json());

// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => console.log("✅ MongoDB connected"))
//   .catch((err) => console.error("❌ MongoDB error:", err));

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
// const Log = mongoose.model("Log", logSchema);

// const sesClient = new SESClient({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   },
// });

// const isBot = (ua) => /bot|crawler|preview|headless/i.test(ua);

// async function logEvent(req, type) {
//   const ip = requestIp.getClientIp(req) || "";
//   const ua = req.headers["user-agent"] || "";
//   const { emailId, recipientId } = req.query;

//   if (!emailId || !recipientId || isBot(ua)) {
//     console.log("⚠️ Skipped bot or missing data");
//     return;
//   }

//   // Prevent duplicate click logs within 5 seconds
//   if (type === "click") {
//     const recentClick = await Log.findOne({
//       emailId,
//       recipientId,
//       type,
//       timestamp: { $gte: new Date(Date.now() - 5000) },
//     });
//     if (recentClick) {
//       console.log("🛑 Duplicate click within 5 seconds skipped");
//       return;
//     }
//   }

//   const { device, browser, os } = uaParser(ua);
//   let geo = {};
//   try {
//     geo = (
//       await axios.get(
//         `https://ipinfo.io/${ip}?token=${process.env.IPINFO_TOKEN}`
//       )
//     ).data;
//   } catch {}

//   await Log.findOneAndUpdate(
//     { emailId, recipientId, type },
//     {
//       $inc: { count: 1 },
//       $set: {
//         timestamp: new Date(),
//         ip,
//         city: geo.city || "",
//         region: geo.region || "",
//         country: geo.country || "",
//         device: device.type || "desktop",
//         browser: browser.name || "",
//         os: os.name || "",
//       },
//     },
//     { upsert: true }
//   );

//   console.log("📩 Logged Event:", { emailId, recipientId, type, ip });
// }

// app.get("/track-pixel", async (req, res) => {
//   await logEvent(req, "open");
//   const pixel = Buffer.from(
//     "R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
//     "base64"
//   );
//   res.writeHead(200, {
//     "Content-Type": "image/gif",
//     "Content-Length": pixel.length,
//     "Cache-Control": "no-cache, no-store, must-revalidate",
//   });
//   res.end(pixel);
// });

// // app.get("/track-click", async (req, res) => {
// //   await logEvent(req, "click");
// //   res.redirect("https://demandmediabpm.com/");
// // });
// app.get("/track-click", async (req, res) => {
//   await logEvent(req, "click");

//   // Fallback open logging
//   const { emailId, recipientId } = req.query;
//   if (emailId && recipientId) {
//     const existingOpen = await Log.findOne({ emailId, recipientId, type: 'open' });
//     if (!existingOpen) {
//       await Log.findOneAndUpdate(
//         { emailId, recipientId, type: 'open' },
//         {
//           $inc: { count: 1 },
//           $set: {
//             timestamp: new Date(),
//             ip: requestIp.getClientIp(req) || '',
//           },
//         },
//         { upsert: true }
//       );
//       console.log(`✅ Fallback open logged for ${recipientId}`);
//     }
//   }

//   res.redirect("https://demandmediabpm.com/");
// });

// app.get("/send-email", async (req, res) => {
//   const { to, subject, body, emailId } = req.query;

//   if (!to || !subject || !body || !emailId)
//     return res.status(400).json({ error: "Missing fields" });

//   // const pixelUrl = `https://email-tracker-api-um5p.onrender.com/track-pixel?emailId=${encodeURIComponent(emailId)}&recipientId=${encodeURIComponent(to)}&t=${Date.now()}`;
//   // const clickUrl = `https://email-tracker-api-um5p.onrender.com/track-click?emailId=${encodeURIComponent(emailId)}&recipientId=${encodeURIComponent(to)}`;
//   const pixelUrl = `http://3.94.184.229:5000/track-pixel?emailId=${encodeURIComponent(
//     emailId
//   )}&recipientId=${encodeURIComponent(to)}&t=${Date.now()}`;
//   const clickUrl = `http://3.94.184.229:5000/track-click?emailId=${encodeURIComponent(
//     emailId
//   )}&recipientId=${encodeURIComponent(to)}`;

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
//         },
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
//     res.json({ message: "Email sent" });
//   } catch (err) {
//     console.error("SES SDK Email Error:", err);
//     res
//       .status(500)
//       .json({ error: "Email sending failed", detail: err.message });
//   }
// });

// app.get("/campaign-analytics", async (req, res) => {
//   const emailId = req.query.emailId || "campaign-lite";
//   const [opens, clicks, recipients] = await Promise.all([
//     Log.find({ emailId, type: "open" }),
//     Log.find({ emailId, type: "click" }),
//     Log.distinct("recipientId", { emailId }),
//   ]);

//   const uniqueOpens = opens.length;
//   const totalOpens = opens.reduce((s, o) => s + o.count, 0);
//   const uniqueClicks = clicks.length;
//   const totalClicks = clicks.reduce((s, c) => s + c.count, 0);
//   const totalSent = recipients.length;
//   const openRate = totalSent ? (uniqueOpens / totalSent) * 100 : 0;
//   const clickRate = totalSent ? (uniqueClicks / totalSent) * 100 : 0;
//   const lastActivity = Math.max(
//     ...[...opens, ...clicks].map((l) => l.timestamp?.getTime() || 0),
//     0
//   );

//   res.json([
//     {
//       emailId,
//       totalSent,
//       uniqueOpens,
//       totalOpens,
//       uniqueClicks,
//       totalClicks,
//       openRate,
//       clickRate,
//       lastActivity: lastActivity ? new Date(lastActivity) : null,
//     },
//   ]);
// });

// app.get("/opens-summary", async (req, res) => {
//   const emailId = req.query.emailId;
//   const data = await Log.find(
//     emailId ? { emailId, type: "open" } : { type: "open" },
//     {
//       _id: 0,
//       emailId: 1,
//       recipientId: 1,
//       count: 1,
//       timestamp: 1,
//     }
//   );
//   res.json(data);
// });

// app.get("/clicks", async (req, res) => {
//   const emailId = req.query.emailId;
//   const data = await Log.find(
//     emailId ? { emailId, type: "click" } : { type: "click" },
//     {
//       _id: 0,
//       emailId: 1,
//       recipientId: 1,
//       ip: 1,
//       city: 1,
//       region: 1,
//       country: 1,
//       device: 1,
//       browser: 1,
//       os: 1,
//       timestamp: 1,
//     }
//   );
//   res.json(data);
// });

// app.get("/campaign-ids", async (_, res) => {
//   const ids = await Log.distinct("emailId");
//   res.json(ids);
// });

// // app.listen(process.env.PORT || 3000, () => console.log('🚀 Server running'));
// app.listen(5000, "0.0.0.0", () => console.log("Server running"));

// new code

// ✅ Your complete server.js with merged campaign functionality

// // here we add code for new database connection for campaign:
// const mongooseCampaign = require("mongoose"); // second instance

// // Campaign DB (for logs, contacts, etc.)
// const campaignConn = mongooseCampaign.createConnection(
//   process.env.CAMPAIGN_DB_URI,
//   { useNewUrlParser: true, useUnifiedTopology: true }
// );

// campaignConn.on("connected", () => {
//   console.log("✅ Campaign DB connected");
// });

// //..............
// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// const requestIp = require("request-ip");
// const uaParser = require("ua-parser-js");
// const axios = require("axios");
// const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");
// require("dotenv").config();

// const app = express();
// app.use(cors());
// app.use(express.json());

// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => console.log("✅ MongoDB connected"))
//   .catch((err) => console.error("❌ MongoDB error:", err));

// const logSchema = new mongooseCampaign.Schema({
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
// mongooseCampaign.index({ emailId: 1, recipientId: 1, type: 1 }, { unique: true });
// // const Log = mongoose.model("Log", logSchema);

// const contactSchema = new mongooseCampaign.Schema({
//   name: String,
//   email: String,
//   listName: String,
// });

// // ✅ Register models with campaignConn (NOT default mongoose)
// const Log = campaignConn.model("Log", logSchema);
// const Contact = campaignConn.model("Contact", contactSchema);

// const sesClient = new SESClient({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   },
// });

// const isBot = (ua) => /bot|crawler|preview|headless/i.test(ua);

// async function logEvent(req, type) {
//   const ip = requestIp.getClientIp(req) || "";
//   const ua = req.headers["user-agent"] || "";
//   const { emailId, recipientId } = req.query;
//   if (!emailId || !recipientId || isBot(ua)) return;
//   if (type === "click") {
//     const recentClick = await Log.findOne({
//       emailId,
//       recipientId,
//       type,
//       timestamp: { $gte: new Date(Date.now() - 5000) },
//     });
//     if (recentClick) return;
//   }
//   const { device, browser, os } = uaParser(ua);
//   let geo = {};
//   try {
//     geo = (await axios.get(`https://ipinfo.io/${ip}?token=${process.env.IPINFO_TOKEN}`)).data;
//   } catch {}
//   await Log.findOneAndUpdate(
//     { emailId, recipientId, type },
//     {
//       $inc: { count: 1 },
//       $set: {
//         timestamp: new Date(),
//         ip,
//         city: geo.city || "",
//         region: geo.region || "",
//         country: geo.country || "",
//         device: device.type || "desktop",
//         browser: browser.name || "",
//         os: os.name || "",
//       },
//     },
//     { upsert: true }
//   );
// }

// app.get("/track-pixel", async (req, res) => {
//   await logEvent(req, "open");
//   const pixel = Buffer.from("R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==", "base64");
//   res.writeHead(200, {
//     "Content-Type": "image/gif",
//     "Content-Length": pixel.length,
//     "Cache-Control": "no-cache, no-store, must-revalidate",
//   });
//   res.end(pixel);
// });

// app.get("/track-click", async (req, res) => {
//   await logEvent(req, "click");
//   const { emailId, recipientId } = req.query;
//   if (emailId && recipientId) {
//     const existingOpen = await Log.findOne({ emailId, recipientId, type: "open" });
//     if (!existingOpen) {
//       await Log.findOneAndUpdate(
//         { emailId, recipientId, type: "open" },
//         { $inc: { count: 1 }, $set: { timestamp: new Date(), ip: requestIp.getClientIp(req) || "" } },
//         { upsert: true }
//       );
//     }
//   }
//   res.redirect("https://demandmediabpm.com/");
// });

// app.get("/send-email", async (req, res) => {
//   const { to, subject, body, emailId } = req.query;
//   if (!to || !subject || !body || !emailId) return res.status(400).json({ error: "Missing fields" });
//   const pixelUrl = `http://3.94.184.229:5000/track-pixel?emailId=${encodeURIComponent(emailId)}&recipientId=${encodeURIComponent(to)}&t=${Date.now()}`;
//   const clickUrl = `http://3.94.184.229:5000/track-click?emailId=${encodeURIComponent(emailId)}&recipientId=${encodeURIComponent(to)}`;
//   const htmlBody = `<p>${body}</p><p><a href="${clickUrl}">Click here</a></p><img src="${pixelUrl}" width="1" height="1" style="display:none;" />`;
//   const params = {
//     Destination: { ToAddresses: [to] },
//     Message: {
//       Body: { Html: { Charset: "UTF-8", Data: htmlBody } },
//       Subject: { Charset: "UTF-8", Data: subject },
//     },
//     Source: process.env.MAIL_FROM,
//   };
//   try {
//     await sesClient.send(new SendEmailCommand(params));
//     res.json({ message: "Email sent" });
//   } catch (err) {
//     res.status(500).json({ error: "Email sending failed", detail: err.message });
//   }
// });

// // Campaign Send (bulk)
// app.post("/send-campaign", async (req, res) => {
//   const { emailId, subject, body, listName } = req.body;
//   if (!emailId || !subject || !body || !listName) return res.status(400).json({ error: "Missing campaign fields" });
//   try {
//     const recipients = await Contact.find({ listName });
//     if (!recipients.length) return res.status(404).json({ error: "No recipients found" });
//     const sendResults = [];
//     for (const recipient of recipients) {
//       const to = recipient.email;
//       const pixelUrl = `http://3.94.184.229:5000/track-pixel?emailId=${encodeURIComponent(emailId)}&recipientId=${encodeURIComponent(to)}&t=${Date.now()}`;
//       const clickUrl = `http://3.94.184.229:5000/track-click?emailId=${encodeURIComponent(emailId)}&recipientId=${encodeURIComponent(to)}`;
//       const htmlBody = `<p>${body}</p><p><a href="${clickUrl}">Click here</a></p><img src="${pixelUrl}" width="1" height="1" style="display:none;" />`;
//       const params = {
//         Destination: { ToAddresses: [to] },
//         Message: { Body: { Html: { Charset: "UTF-8", Data: htmlBody } }, Subject: { Charset: "UTF-8", Data: subject } },
//         Source: process.env.MAIL_FROM,
//       };
//       try {
//         await sesClient.send(new SendEmailCommand(params));
//         sendResults.push({ to, status: "sent" });
//       } catch (error) {
//         sendResults.push({ to, status: "error", error: error.message });
//       }
//     }
//     res.json({ message: `Campaign ${emailId} sent`, result: sendResults });
//   } catch (err) {
//     res.status(500).json({ error: "Failed to send campaign" });
//   }
// });

// app.get("/contact-lists", async (_, res) => {
//   try {
//     const listNames = await Contact.distinct("listName");
//     res.json(listNames);
//   } catch (err) {
//     res.status(500).json({ error: "Could not retrieve contact lists" });
//   }
// });

// app.get("/campaign-analytics", async (req, res) => {
//   const emailId = req.query.emailId || "campaign-lite";
//   const [opens, clicks, recipients] = await Promise.all([
//     Log.find({ emailId, type: "open" }),
//     Log.find({ emailId, type: "click" }),
//     Log.distinct("recipientId", { emailId }),
//   ]);
//   const uniqueOpens = opens.length;
//   const totalOpens = opens.reduce((s, o) => s + o.count, 0);
//   const uniqueClicks = clicks.length;
//   const totalClicks = clicks.reduce((s, c) => s + c.count, 0);
//   const totalSent = recipients.length;
//   const openRate = totalSent ? (uniqueOpens / totalSent) * 100 : 0;
//   const clickRate = totalSent ? (uniqueClicks / totalSent) * 100 : 0;
//   const lastActivity = Math.max(...[...opens, ...clicks].map((l) => l.timestamp?.getTime() || 0), 0);
//   res.json([{ emailId, totalSent, uniqueOpens, totalOpens, uniqueClicks, totalClicks, openRate, clickRate, lastActivity: lastActivity ? new Date(lastActivity) : null }]);
// });

// app.get("/opens-summary", async (req, res) => {
//   const emailId = req.query.emailId;
//   const data = await Log.find(emailId ? { emailId, type: "open" } : { type: "open" }, {
//     _id: 0,
//     emailId: 1,
//     recipientId: 1,
//     count: 1,
//     timestamp: 1,
//   });
//   res.json(data);
// });

// app.get("/clicks", async (req, res) => {
//   const emailId = req.query.emailId;
//   const data = await Log.find(emailId ? { emailId, type: "click" } : { type: "click" }, {
//     _id: 0,
//     emailId: 1,
//     recipientId: 1,
//     ip: 1,
//     city: 1,
//     region: 1,
//     country: 1,
//     device: 1,
//     browser: 1,
//     os: 1,
//     timestamp: 1,
//   });
//   res.json(data);
// });

// app.get("/campaign-ids", async (_, res) => {
//   const ids = await Log.distinct("emailId");
//   res.json(ids);
// });

// app.listen(5000, "0.0.0.0", () => console.log("Server running"));

// this is updated code

// 📁 server.js (updated with full email tracking + campaign logic)
// 📁 server.js
require("dotenv").config();
// const fs = require("fs");
// const https = require("https");
const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const mongooseCampaign = require("mongoose");
const cors = require("cors");
const requestIp = require("request-ip");
const uaParser = require("ua-parser-js");
const axios = require("axios");
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

// ⬇️ Load your self-signed cert
// const sslOptions = {
//   key: fs.readFileSync("/home/ubuntu/ssl/localhost-key.pem"),
//   cert: fs.readFileSync("/home/ubuntu/ssl/localhost-cert.pem"),
// };

const app = express();
app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.CONTACT_MONGO_URI)
  .then(() => console.log("✅ Contact DB connected"))
  .catch((err) => console.error("❌ Contact DB error:", err));

const campaignConn = mongooseCampaign.createConnection(
  process.env.CAMPAIGN_DB_URI,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);
campaignConn.on("connected", () => console.log("✅ Campaign DB connected"));

const logSchema = new mongooseCampaign.Schema({
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
const Log = campaignConn.model("Log", logSchema);

const contactSchema = new mongoose.Schema({
  name: String,
  email: String,
  listName: String,
});
const Contact = mongoose.model("Contact", contactSchema);

const sesClient = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const isBot = (ua) => /bot|crawler|preview|headless/i.test(ua);

async function logEvent(req, type) {
  const ip = requestIp.getClientIp(req) || "";
  const ua = req.headers["user-agent"] || "";
  const { emailId, recipientId } = req.query;
  if (!emailId || !recipientId || isBot(ua)) return;

  if (type === "click") {
    const recentClick = await Log.findOne({
      emailId,
      recipientId,
      type,
      timestamp: { $gte: new Date(Date.now() - 5000) },
    });
    if (recentClick) return;
  }

  const { device, browser, os } = uaParser(ua);
  let geo = {};
  try {
    geo = (
      await axios.get(
        `https://ipinfo.io/${ip}?token=${process.env.IPINFO_TOKEN}`
      )
    ).data;
  } catch {}

  await Log.findOneAndUpdate(
    { emailId, recipientId, type },
    {
      $inc: { count: 1 },
      $set: {
        timestamp: new Date(),
        ip,
        city: geo.city || "",
        region: geo.region || "",
        country: geo.country || "",
        device: device.type || "desktop",
        browser: browser.name || "",
        os: os.name || "",
      },
    },
    { upsert: true }
  );
}

app.get("/track-pixel", async (req, res) => {
  await logEvent(req, "open");
  const pixel = Buffer.from(
    "R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
    "base64"
  );
  res.writeHead(200, {
    "Content-Type": "image/gif",
    "Content-Length": pixel.length,
    "Cache-Control": "no-cache, no-store, must-revalidate",
  });
  res.end(pixel);
});

app.get("/track-click", async (req, res) => {
  await logEvent(req, "click");
  const { emailId, recipientId } = req.query;
  if (emailId && recipientId) {
    const existingOpen = await Log.findOne({
      emailId,
      recipientId,
      type: "open",
    });
    if (!existingOpen) {
      await Log.findOneAndUpdate(
        { emailId, recipientId, type: "open" },
        {
          $inc: { count: 1 },
          $set: { timestamp: new Date(), ip: requestIp.getClientIp(req) || "" },
        },
        { upsert: true }
      );
    }
  }
  res.redirect("https://demandmediabpm.com/");
});

app.post("/send-campaign", async (req, res) => {
  const { emailId, subject, body, listName } = req.body;
  if (!emailId || !subject || !body || !listName)
    return res.status(400).json({ error: "Missing fields" });

  try {
    const recipients = await Contact.find({ listName });
    if (!recipients.length)
      return res.status(404).json({ error: "No recipients found" });

    const results = [];
    for (const { email: to } of recipients) {
      const pixelUrl = `http://3.94.184.229:5000/track-pixel?emailId=${encodeURIComponent(
        emailId
      )}&recipientId=${encodeURIComponent(to)}&t=${Date.now()}`;
      const clickUrl = `http://3.94.184.229:5000/track-click?emailId=${encodeURIComponent(
        emailId
      )}&recipientId=${encodeURIComponent(to)}`;
      const htmlBody = `<p>${body}</p><p><a href="${clickUrl}">Click here</a></p><img src="${pixelUrl}" width="1" height="1" style="display:none;" />`;

      const params = {
        Destination: { ToAddresses: [to] },
        Message: {
          Body: { Html: { Charset: "UTF-8", Data: htmlBody } },
          Subject: { Charset: "UTF-8", Data: subject },
        },
        Source: process.env.MAIL_FROM,
      };

      try {
        await sesClient.send(new SendEmailCommand(params));
        results.push({ to, status: "sent" });
      } catch (err) {
        results.push({ to, status: "error", error: err.message });
      }
    }

    res.json({ message: `Campaign ${emailId} sent`, results });
  } catch (err) {
    res.status(500).json({ error: "Failed to send campaign" });
  }
});

app.get("/campaign-ids", async (_, res) => {
  const ids = await Log.distinct("emailId");
  res.json(ids);
});

app.get("/campaign-analytics", async (req, res) => {
  const emailId = req.query.emailId;
  const [opens, clicks, recipients] = await Promise.all([
    Log.find({ emailId, type: "open" }),
    Log.find({ emailId, type: "click" }),
    Log.distinct("recipientId", { emailId }),
  ]);

  const uniqueOpens = opens.length;
  const totalOpens = opens.reduce((sum, o) => sum + o.count, 0);
  const uniqueClicks = clicks.length;
  const totalClicks = clicks.reduce((sum, c) => sum + c.count, 0);
  const totalSent = recipients.length;
  const openRate = totalSent ? (uniqueOpens / totalSent) * 100 : 0;
  const clickRate = totalSent ? (uniqueClicks / totalSent) * 100 : 0;
  const lastActivity = Math.max(
    ...[...opens, ...clicks].map((l) => l.timestamp?.getTime() || 0),
    0
  );

  res.json({
    emailId,
    totalSent,
    uniqueOpens,
    totalOpens,
    uniqueClicks,
    totalClicks,
    openRate,
    clickRate,
    lastActivity: lastActivity ? new Date(lastActivity) : null,
  });
});

app.get("/campaign-details", async (req, res) => {
  const emailId = req.query.emailId;
  const logs = await Log.find({ emailId });
  const details = {};
  for (const log of logs) {
    const r = log.recipientId;
    if (!details[r]) {
      details[r] = {
        emailId,
        recipient: r,
        ip: "NA",
        city: "NA",
        region: "NA",
        country: "NA",
        device: "NA",
        browser: "NA",
        os: "NA",
        totalOpen: 0,
        totalClick: 0,
        lastClick: "NA",
      };
    }
    if (log.type === "open") details[r].totalOpen += log.count;
    if (log.type === "click") {
      details[r].totalClick += log.count;
      details[r].lastClick = log.timestamp;
      details[r].ip = log.ip || "NA";
      details[r].city = log.city || "NA";
      details[r].region = log.region || "NA";
      details[r].country = log.country || "NA";
      details[r].device = log.device || "NA";
      details[r].browser = log.browser || "NA";
      details[r].os = log.os || "NA";
    }
  }
  res.json(Object.values(details));
});

app.get("/contact-lists", async (_, res) => {
  const listNames = await Contact.distinct("listName");
  res.json(listNames);
});

// https.createServer(sslOptions, app).listen(5000, "0.0.0.0", () => {
//   console.log("🔒 HTTPS server running on port 5000");
// });

http.createServer(app).listen(5000, "0.0.0.0", () => {
  console.log("🌐 HTTP server running on port 5000");
});