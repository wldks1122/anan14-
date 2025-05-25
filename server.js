
const express = require("express");
const cors = require("cors");
const fs = require("fs-extra");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const DATA_FILE = "./data.json";
let onlineUsers = new Map();

// 한국 시간 기준 날짜/시간 키 반환
function getTimeKeys() {
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const dateKey = now.toISOString().slice(0, 10);        // YYYY-MM-DD
  const hourKey = now.toTimeString().slice(0, 2) + ":00"; // HH:00
  return { dateKey, hourKey };
}

// 방문자/클릭수 업데이트
async function updateCount(type) {
  const data = await fs.readJson(DATA_FILE).catch(() => ({ visits: {}, clicks: {} }));
  const { dateKey, hourKey } = getTimeKeys();

  if (!data[type]) data[type] = {};
  if (!data[type][dateKey]) data[type][dateKey] = {};
  if (!data[type][dateKey][hourKey]) data[type][dateKey][hourKey] = 0;

  data[type][dateKey][hourKey] += 1;

  await fs.writeJson(DATA_FILE, data);
}

// 방문 기록
app.post("/api/visit", async (req, res) => {
  await updateCount("visits");
  res.json({ success: true });
});

// 클릭 기록
app.post("/api/click", async (req, res) => {
  await updateCount("clicks");
  res.json({ success: true });
});

// 통계 조회
app.get("/api/stats", async (req, res) => {
  const data = await fs.readJson(DATA_FILE).catch(() => ({ visits: {}, clicks: {} }));
  res.json(data);
});

// 온라인 사용자 ping
app.post("/api/online", (req, res) => {
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  onlineUsers.set(ip, Date.now());
  res.json({ success: true });
});

// 온라인 사용자 수 반환
app.get("/api/online-count", (req, res) => {
  const now = Date.now();
  for (const [ip, timestamp] of onlineUsers.entries()) {
    if (now - timestamp > 60 * 1000) { // 1분 이상 활동 없으면 제거
      onlineUsers.delete(ip);
    }
  }
  res.json({ count: onlineUsers.size });
});

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
