const db = require("../config/database");

const addStock = (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  if (!id || quantity === undefined || quantity < 0) {
    return res.status(400).json({ error: "Invalid ID or quantity" });
  }

  const query = "UPDATE menu_items SET stok = stok + ? WHERE id = ?";
  db.query(query, [parseInt(quantity, 10), id], (err, results) => {
    if (err) {
      console.error("Gagal menambahkan stok:", err);
      return res.status(500).json({ error: "Database error", details: err });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: "Menu tidak ditemukan" });
    }

    res.status(200).json({ 
      message: "Stok berhasil ditambahkan", 
      data: { id, quantity } 
    });
  });
};

const reduceStock = (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  if (!id || quantity === undefined || quantity < 0) {
    return res.status(400).json({ error: "Invalid ID or quantity" });
  }

  const query = "UPDATE menu_items SET stok = GREATEST(0, stok - ?) WHERE id = ?";
  db.query(query, [parseInt(quantity, 10), id], (err, results) => {
    if (err) {
      console.error("Gagal mengurangi stok:", err);
      return res.status(500).json({ error: "Database error", details: err });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: "Menu tidak ditemukan" });
    }

    res.status(200).json({ 
      message: "Stok berhasil dikurangi", 
      data: { id, quantity } 
    });
  });
};

const resetStock = (req, res) => {
  const { id } = req.params;
  const { newStock } = req.body;

  if (!id || newStock === undefined || newStock < 0) {
    return res.status(400).json({ error: "Invalid ID or stock value" });
  }

  const query = "UPDATE menu_items SET stok = ? WHERE id = ?";
  db.query(query, [parseInt(newStock, 10), id], (err, results) => {
    if (err) {
      console.error("Gagal mereset stok:", err);
      return res.status(500).json({ error: "Database error", details: err });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: "Menu tidak ditemukan" });
    }

    res.status(200).json({ 
      message: "Stok berhasil direset", 
      data: { id, newStock } 
    }); 
  });
};

const editStock = (req, res) => {
  const { id } = req.params;
  const { currentStock } = req.body;

  if (!id || currentStock === undefined || currentStock < 0) {
    return res.status(400).json({ error: "Invalid ID or stock value" });
  }

  const query = "UPDATE menu_items SET stok = ? WHERE id = ?";
  db.query(query, [parseInt(currentStock, 10), id], (err, results) => {
    if (err) {
      console.error("Gagal mengedit stok:", err);
      return res.status(500).json({ error: "Database error", details: err });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: "Menu tidak ditemukan" });
    }

    res.status(200).json({ 
      message: "Stok berhasil diedit", 
      data: { id, currentStock } 
    });
  });
};

module.exports = {
  addStock,
  reduceStock,
  resetStock,
  editStock
};