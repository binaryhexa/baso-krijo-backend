const db = require("../config/database");

const getAllMenus = (req, res) => {
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
};

const getMenuById = (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "Menu ID is required" });
  }

  const query = "SELECT * FROM menu_items WHERE id = ?";
  
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error("Error fetching menu by ID:", err);
      return res.status(500).json({ error: "Database error", details: err });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Menu not found" });
    }

    res.status(200).json(results[0]); 
  });
};

const createMenu = (req, res) => {
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

    res.status(201).json({ 
      message: "Menu berhasil ditambahkan", 
      data: { id: results.insertId, name, harga, category, image_link } 
    });
  });
};

const updateMenu = (req, res) => {
  const { id } = req.params;
  const { name, harga, category } = req.body;

  if (!name || !harga || !category) {
    return res.status(400).json({ error: "Semua form harus diisi: name, harga, category" });
  }

  let query = "UPDATE menu_items SET name = ?, harga = ?, category = ?";
  const queryParams = [name, parseInt(harga, 10), category];

  if (req.file) {
    const image_link = `http://localhost:5000/public/images/${req.file.filename}`;
    query += ", image_link = ?";
    queryParams.push(image_link);
  }

  query += " WHERE id = ?";
  queryParams.push(id);

  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error("Gagal memperbarui menu:", err);
      return res.status(500).json({ error: "Database error", details: err });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: "Menu tidak ditemukan" });
    }

    res.status(200).json({
      message: "Menu berhasil diperbarui",
      data: { id, name, harga, category, image_link: req.file ? queryParams[3] : undefined },
    });
  });
};

module.exports = {
  getAllMenus,
  getMenuById,
  createMenu,
  updateMenu
};