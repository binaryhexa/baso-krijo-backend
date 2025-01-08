const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");

const app = express();
const PORT = 5000;

// Konfigurasi multer untuk menyimpan file gambar
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/images");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

app.use(cors());
app.use(bodyParser.json());
app.use("/public", express.static(path.join(__dirname, "public")));

let menuItems = [
  { id: 1, name: "Bakso Mercon", harga: 15000, image_link: "http://localhost:5000/public/images/Mercon.jpg", category: "Makanan" },
  { id: 2, name: "Bakso Tetelan", harga: 15000, image_link: "http://localhost:5000/public/images/Bakso.jpeg", category: "Makanan" },
  { id: 3, name: "Es Teh Manis", harga: 5000, image_link: "http://localhost:5000/public/images/TehManis.jpg", category: "Minuman" },
  { id: 4, name: "Es Jeruk", harga: 7000, image_link: "http://localhost:5000/public/images/EsJeruk.jpg", category: "Minuman" },
  { id: 5, name: "Kerupuk", harga: 2000, image_link: "http://localhost:5000/public/images/Kerupuk.jpg", category: "Toping" },
  { id: 6, name: "Bawang Goreng", harga: 1000, image_link: "http://localhost:5000/public/images/BawangGoreng.jpeg", category: "Toping" },
];

// Endpoint untuk create menu baru
app.post("/api/menu", upload.single("image"), (req, res) => {
  const { name, harga, category } = req.body;

  if (!name || !harga || !category || !req.file) {
    return res.status(400).json({ error: "Semua form harus diisi: name, harga, image_link, category" });
  }

  const newMenuItem = {
    id: menuItems.length + 1,
    name,
    harga: parseInt(harga, 10),
    category,
    image_link: `http://localhost:5000/public/images/${req.file.filename}`,
  };

  menuItems.push(newMenuItem);
  res.status(201).json({ message: "Menu berhasil di tambahkan", data: newMenuItem });
});

// Endpoint untuk get semua menu
app.get("/api/menu", (req, res) => {
  const { category } = req.query;

  if (category) {
    if (category === "Semua Menu") {
      return res.json(menuItems);
    }
    const filteredItems = menuItems.filter((item) => item.category === category);
    return res.json(filteredItems);
  }

  res.json(menuItems);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
