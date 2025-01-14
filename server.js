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

app.post("/api/checkout", (req, res) => {
  const {
    nama_pembeli,
    menu,
    metode_pembayaran,
    total_harga,
    cash_dibayar,
    kembalian,
    jenis_pesanan,
    status_pesanan,
  } = req.body;

  if (!nama_pembeli || !menu || menu.length === 0 || !metode_pembayaran || !jenis_pesanan || !status_pesanan) {
    return res.status(400).json({ success: false, message: "Data tidak valid" });
  }

  const orderQuery = `
    INSERT INTO orders (nama_pembeli, metode_pembayaran, total_harga, cash_dibayar, kembalian, jenis_pesanan, status_pesanan)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    orderQuery,
    [
      nama_pembeli,
      metode_pembayaran,
      total_harga,
      cash_dibayar,
      kembalian,
      jenis_pesanan,
      status_pesanan,
    ],
    (err, result) => {
      if (err) {
        console.error("Gagal menyimpan pesanan:", err);
        return res.status(500).json({ success: false, message: "Gagal membuat pesanan" });
      }

      const orderId = result.insertId;

      const orderDetailsQuery = `
        INSERT INTO order_details (id_order, id_menu, nama_menu, harga, jumlah)
        VALUES ?
      `;

      const orderDetailsData = menu.map((item) => [
        orderId,
        item.id_menu,
        item.nama_menu,
        item.harga,
        item.jumlah,
      ]);

      db.query(orderDetailsQuery, [orderDetailsData], (err) => {
        if (err) {
          console.error("Gagal menyimpan detail pesanan:", err);
          return res
            .status(500)
            .json({ success: false, message: "Gagal menyimpan detail pesanan" });
        }

        res.status(200).json({
          success: true,
          message: "Pesanan berhasil dibuat",
          data: {
            id_pesanan: orderId,
            nama_pembeli,
            menu,
            metode_pembayaran,
            total_harga,
            cash_dibayar,
            kembalian,
            jenis_pesanan,
            status_pesanan,
          },
        });
      });
    }
  );
});

app.get("/api/orders", (req, res) => {
  const { orderId } = req.query;

  let query = `
    SELECT 
      o.id AS id_pesanan, 
      o.nama_pembeli, 
      o.metode_pembayaran, 
      o.total_harga, 
      o.cash_dibayar, 
      o.kembalian, 
      o.jenis_pesanan,
      o.status_pesanan,
      o.created_at,
      GROUP_CONCAT(JSON_OBJECT(
        'id_menu', od.id_menu,
        'nama_menu', od.nama_menu,
        'harga', od.harga,
        'jumlah', od.jumlah,
        'image_link', mi.image_link
      )) AS menu_details
    FROM orders o
    LEFT JOIN order_details od ON o.id = od.id_order
    LEFT JOIN menu_items mi ON od.id_menu = mi.id
  `;

  const queryParams = [];

  if (orderId) {
    query += " WHERE o.id = ?";
    queryParams.push(orderId);
  }

  // Menambahkan sorting berdasarkan created_at untuk urutan terbaru
  query += " GROUP BY o.id ORDER BY o.created_at DESC"; // Urutkan berdasarkan waktu terbaru

  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error("Gagal mendapatkan pesanan:", err);
      return res.status(500).json({ success: false, message: "Gagal mendapatkan pesanan" });
    }

    const orders = results.map(order => ({
      id_pesanan: order.id_pesanan,
      nama_pembeli: order.nama_pembeli,
      metode_pembayaran: order.metode_pembayaran,
      total_harga: order.total_harga,
      cash_dibayar: order.cash_dibayar,
      kembalian: order.kembalian,
      jenis_pesanan: order.jenis_pesanan,
      status_pesanan: order.status_pesanan,
      created_at: order.created_at,  // Menyertakan informasi waktu pembuatan pesanan
      menu_details: JSON.parse(`[${order.menu_details}]`),
    }));

    res.status(200).json({ success: true, data: orders });
  });
});

app.patch("/api/orders/:orderId", (req, res) => {
  const { orderId } = req.params;
  const { status_pesanan } = req.body; 

  if (!status_pesanan) {
    return res.status(400).json({ success: false, message: "Status pesanan harus diberikan" });
  }

  const query = "UPDATE orders SET status_pesanan = ? WHERE id = ?";
  
  db.query(query, [status_pesanan, orderId], (err, result) => {
    if (err) {
      console.error("Gagal mengupdate status pesanan:", err);
      return res.status(500).json({ success: false, message: "Gagal mengupdate status pesanan" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Pesanan tidak ditemukan" });
    }

    res.status(200).json({
      success: true,
      message: "Status pesanan berhasil diubah",
      data: { id_pesanan: orderId, status_pesanan },
    });
  });
});

app.get("/api/dashboard", (req, res) => {
  const salesQuery = `
  SELECT 
    COUNT(*) AS total_sales, 
    SUM(od.jumlah * od.harga) AS total_revenue 
  FROM order_details od
`;

const chartQuery = `
SELECT 
  mi.name AS menu_name, 
  SUM(od.jumlah) AS total_sold,
  SUM(od.jumlah * od.harga) AS total_revenue
FROM order_details od
JOIN menu_items mi ON od.id_menu = mi.id
GROUP BY od.id_menu
ORDER BY total_sold DESC

`;

db.query(salesQuery, (salesErr, salesResults) => {
  if (salesErr) {
    return res.status(500).json({ error: "Error fetching sales data", details: salesErr });
  }

  db.query(chartQuery, (chartErr, chartResults) => {
    if (chartErr) {
      return res.status(500).json({ error: "Error fetching chart data", details: chartErr });
    }
  
    // Menghitung total penjualan dengan reduce
    const totalSales = chartResults.reduce((sum, item) => sum + item.total_sold, 0);

    const totalRevenue = chartResults.reduce((sum, item) => sum + item.total_revenue, 0);
  
    const chartData = chartResults.map((item) => ({
      menu_name: item.menu_name,
      total_sold: item.total_sold,
      total_revenue: item.total_revenue, // Menambahkan total revenue per menu
    }));
  
    res.json({
      total_sales: totalSales || 0, // Total penjualan menggunakan reduce
      total_revenue: totalRevenue || 0, // Total pendapatan
      chart_data: chartData,
    });
  });
  
});

});

app.get('/api/sales-report', (req, res) => {
  const query = `
    SELECT mi.name AS menu_name, 
           SUM(od.jumlah) AS quantity, 
           mi.harga AS price
    FROM order_details od
    JOIN menu_items mi ON od.id_menu = mi.id
    GROUP BY od.id_menu
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching sales data:", err);
      return res.status(500).json({ error: 'Failed to fetch sales report data' });
    }

    const reportData = results.map(item => ({
      menu_name: item.menu_name,
      quantity: item.quantity,
      total_price: item.quantity * item.price,
    }));

    const totalPrice = reportData.reduce((sum, item) => sum + item.total_price, 0);

    res.json({ reportData, totalPrice });
  });
});



app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
