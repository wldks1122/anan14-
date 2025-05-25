
const express = require("express");
const cors = require("cors");
const fs = require("fs-extra");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const DATA_FILE = "./data.json";
let onlineUsers = new Map();
let recentVisitors = new Map();

function getTimeKeys30m() {
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const dateKey = now.toISOString().slice(0, 10);
  const minutes = now.getMinutes() < 30 ? "00" : "30";
  const hourKey = `${now.getHours().toString().padStart(2, '0')}:${minutes}`;
  return { dateKey, hourKey };
}

async function updateCount(type, udd) {
  const data = await fs.readJson(DATA_FILE).catch(() => ({ visits: {}, clicks: {}, clickLogs: {} }));
  const { dateKey, hourKey } = getTimeKeys30m();
  const uniqueKey = `${udd}_${dateKey}_${hourKey}`;

  if (type === "visits") {
    if (recentVisitors.has(uniqueKey)) return;
    recentVisitors.set(uniqueKey, Date.now());
  }

  if (!data[type]) data[type] = {};
  if (!data[type][dateKey]) data[type][dateKey] = {};
  if (!data[type][dateKey][hourKey]) data[type][dateKey][hourKey] = 0;

  data[type][dateKey][hourKey] += 1;

  await fs.writeJson(DATA_FILE, data);
}

async function logClickDetail(udd) {
  const data = await fs.readJson(DATA_FILE).catch(() => ({ clickLogs: {} }));
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000); // KST
  const dateKey = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 8); // HH:MM:SS

  if (!data.clickLogs) data.clickLogs = {};
  if (!data.clickLogs[dateKey]) data.clickLogs[dateKey] = [];

  data.clickLogs[dateKey].push({ time, udd });

  await fs.writeJson(DATA_FILE, data);
}

setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of recentVisitors.entries()) {
    if (now - timestamp > 30 * 60 * 1000) {
      recentVisitors.delete(key);
    }
  }
}, 5 * 60 * 1000);

app.post("/api/visit", async (req, res) => {
  const udd = req.body.udd;
  if (!udd) return res.status(400).json({ success: false, error: "Missing udd" });
  await updateCount("visits", udd);
  res.json({ success: true });
});

app.post("/api/click", async (req, res) => {
  const udd = req.body.udd;
  if (!udd) return res.status(400).json({ success: false, error: "Missing udd" });
  await updateCount("clicks", udd);
  await logClickDetail(udd);
  res.json({ success: true });
});

app.post("/api/online", (req, res) => {
  const udd = req.body.udd;
  if (!udd) return res.status(400).json({ success: false, error: "Missing udd" });
  onlineUsers.set(udd, Date.now());
  res.json({ success: true });
});

app.get("/api/online-count", (req, res) => {
  const now = Date.now();
  for (const [udd, timestamp] of onlineUsers.entries()) {
    if (now - timestamp > 60 * 1000) {
      onlineUsers.delete(udd);
    }
  }
  res.json({ count: onlineUsers.size });
});

app.get("/api/stats", async (req, res) => {
  const data = await fs.readJson(DATA_FILE).catch(() => ({ visits: {}, clicks: {}, clickLogs: {} }));
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
