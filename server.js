const express = require("express");
const cors = require("cors");
const fs = require("fs-extra");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const DATA_FILE = "./data.json";

app.post("/api/visit", async (req, res) => {
  const data = await fs.readJson(DATA_FILE);
  data.visits += 1;
  await fs.writeJson(DATA_FILE, data);
  res.json({ success: true });
});

app.post("/api/click", async (req, res) => {
  const data = await fs.readJson(DATA_FILE);
  data.clicks += 1;
  await fs.writeJson(DATA_FILE, data);
  res.json({ success: true });
});

app.get("/api/stats", async (req, res) => {
  const data = await fs.readJson(DATA_FILE);
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
