
const express = require("express");
const cors = require("cors");
const fs = require("fs-extra");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const DATA_FILE = "./data.json";

// 날짜 및 시간 키 생성
function getTimeKeys() {
  const now = new Date();
  const dateKey = now.toISOString().slice(0, 10);        // YYYY-MM-DD
  const hourKey = now.toTimeString().slice(0, 2) + ":00"; // HH:00
  return { dateKey, hourKey };
}

// 방문자 또는 클릭 수 업데이트
async function updateCount(type) {
  const data = await fs.readJson(DATA_FILE).catch(() => ({ visits: {}, clicks: {} }));
  const { dateKey, hourKey } = getTimeKeys();

  if (!data[type]) data[type] = {};
  if (!data[type][dateKey]) data[type][dateKey] = {};
  if (!data[type][dateKey][hourKey]) data[type][dateKey][hourKey] = 0;

  data[type][dateKey][hourKey] += 1;

  await fs.writeJson(DATA_FILE, data);
}

// 방문자 수 API
app.post("/api/visit", async (req, res) => {
  await updateCount("visits");
  res.json({ success: true });
});

// 클릭 수 API
app.post("/api/click", async (req, res) => {
  await updateCount("clicks");
  res.json({ success: true });
});

// 통계 조회 API
app.get("/api/stats", async (req, res) => {
  const data = await fs.readJson(DATA_FILE).catch(() => ({ visits: {}, clicks: {} }));
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
