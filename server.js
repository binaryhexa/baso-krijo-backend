const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const mysql = require("mysql");
require("dotenv").config();

const app = express();
const PORT = 5000;

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error("Koneksi ke database gagal:", err);
  } else {
    console.log("Koneksi ke database berhasil.");
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/images");
  },
  filename: (req, file, cb) => {
    cb(null, `${file.originalname}`);
  },
});
const upload = multer({ storage });

app.use(cors());
app.use(bodyParser.json());
app.use("/public", express.static(path.join(__dirname, "public")));

app.get("/api/menu", (req, res) => {
  const { category } = req.query;

  let query = "SELECT * FROM menu_items";
  const queryParams = [];

  if (category && category !== "Semua Menu") {
    query += " WHERE category = ?";
    queryParams.push(category);
  }

  db.query(query, queryParams, (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Database error", details: err });
    }
    res.json(results);
  });
});

app.post("/api/menu", upload.single("image"), (req, res) => {
  const { name, harga, category } = req.body;

  if (!name || !harga || !category || !req.file) {
    return res.status(400).json({ error: "Semua form harus diisi: name, harga, image_link, category" });
  }

  const image_link = `http://localhost:5000/public/images/${req.file.filename}`;
  const query = "INSERT INTO menu_items (name, harga, image_link, category) VALUES (?, ?, ?, ?)";

  db.query(query, [name, parseInt(harga, 10), image_link, category], (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Database error", details: err });
    }

    res.status(201).json({ message: "Menu berhasil ditambahkan", data: { id: results.insertId, name, harga, category, image_link } });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
