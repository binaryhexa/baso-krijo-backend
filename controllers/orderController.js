const db = require("../config/database");

const generateOrderCode = async () => {
  const today = new Date();
  const date = today.getDate().toString().padStart(2, '0');
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const year = today.getFullYear().toString().slice(-2);
  const dateCode = `${date}${month}${year}`;

  const countQuery = `
    SELECT COUNT(*) as count 
    FROM orders 
    WHERE DATE(created_at) = CURDATE()
  `;

  return new Promise((resolve, reject) => {
    db.query(countQuery, (err, results) => {
      if (err) {
        reject(err);
        return;
      }
      
      const count = results[0].count + 1;
      const orderNumber = count.toString().padStart(3, '0');
      const orderCode = `PSN-${dateCode}${orderNumber}`;
      resolve(orderCode);
    });
  });
};

const createOrder = async (req, res) => {
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

  try {
    // Ambil koneksi dari pool
    const connection = await db.promise().getConnection();

    try {
      // Mulai transaksi
      await connection.beginTransaction();

      // Periksa stok dan kurangi stok menu
      for (const item of menu) {
        const checkStockQuery = `SELECT stok FROM menu_items WHERE id = ?`;
        const [checkResult] = await connection.execute(checkStockQuery, [item.id_menu]);

        if (!checkResult.length || checkResult[0].stok < item.jumlah) {
          throw new Error(`Stok tidak cukup untuk menu: ${item.nama_menu}`);
        }

        const updateStockQuery = `UPDATE menu_items SET stok = stok - ? WHERE id = ?`;
        await connection.execute(updateStockQuery, [item.jumlah, item.id_menu]);
      }

      // Generate kode pesanan
      const kode_pesanan = await generateOrderCode();

      const orderQuery = `
        INSERT INTO orders (kode_pesanan, nama_pembeli, metode_pembayaran, total_harga, cash_dibayar, kembalian, jenis_pesanan, status_pesanan)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await connection.execute(
        orderQuery,
        [kode_pesanan, nama_pembeli, metode_pembayaran, total_harga, cash_dibayar, kembalian, jenis_pesanan, status_pesanan]
      );

      const orderId = result.insertId;

      const orderDetailsQuery = `
        INSERT INTO order_details (id_order, id_menu, nama_menu, harga, jumlah)
        VALUES ?
      `;

      const orderDetailsData = menu.map(item => [
        orderId,
        item.id_menu,
        item.nama_menu,
        item.harga,
        item.jumlah,
      ]);

      await connection.query(orderDetailsQuery, [orderDetailsData]);

      // Commit transaksi
      await connection.commit();

      res.status(200).json({
        success: true,
        message: "Pesanan berhasil dibuat",
        data: {
          id_pesanan: orderId,
          kode_pesanan,
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
    } catch (error) {
      // Rollback jika ada kesalahan
      await connection.rollback();
      console.error("Error creating order:", error);
      return res.status(500).json({ success: false, message: error.message });
    } finally {
      connection.release(); // Lepaskan koneksi
    }
  } catch (error) {
    console.error("Koneksi ke database gagal:", error);
    res.status(500).json({ success: false, message: "Koneksi ke database gagal" });
  }
};



const getAllOrders = (req, res) => {
  const { orderId } = req.query;

  let query = `
    SELECT 
      o.id AS id_pesanan, 
      o.kode_pesanan,
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

  query += " GROUP BY o.id ORDER BY o.created_at DESC";

  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error("Gagal mendapatkan pesanan:", err);
      return res.status(500).json({ success: false, message: "Gagal mendapatkan pesanan" });
    }

    const orders = results.map(order => ({
      id_pesanan: order.id_pesanan,
      kode_pesanan: order.kode_pesanan,
      nama_pembeli: order.nama_pembeli,
      metode_pembayaran: order.metode_pembayaran,
      total_harga: order.total_harga,
      cash_dibayar: order.cash_dibayar,
      kembalian: order.kembalian,
      jenis_pesanan: order.jenis_pesanan,
      status_pesanan: order.status_pesanan,
      created_at: order.created_at,
      menu_details: JSON.parse(`[${order.menu_details}]`),
    }));

    res.status(200).json({ success: true, data: orders });
  });
};

const updateOrderStatus = (req, res) => {
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
};

const checkout = async (req, res) => {
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

  try {
    // Get a connection from the pool
    const connection = await new Promise((resolve, reject) => {
      db.getConnection((err, conn) => {
        if (err) {
          reject(err);
        } else {
          resolve(conn);
        }
      });
    });

    // Start a transaction
    await new Promise((resolve, reject) => {
      connection.beginTransaction(err => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Update menu stock first
    await updateMenuStock(menu, connection);

    // Generate order code
    const kode_pesanan = await generateOrderCode();

    // Insert order
    const orderQuery = `
      INSERT INTO orders (kode_pesanan, nama_pembeli, metode_pembayaran, total_harga, cash_dibayar, kembalian, jenis_pesanan, status_pesanan)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await new Promise((resolve, reject) => {
      connection.query(
        orderQuery,
        [
          kode_pesanan,
          nama_pembeli,
          metode_pembayaran,
          total_harga,
          cash_dibayar,
          kembalian,
          jenis_pesanan,
          status_pesanan,
        ],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });

    const orderId = result.insertId;

    // Insert order details
    const orderDetailsQuery = `
      INSERT INTO order_details (id_order, id_menu, nama_menu, harga, jumlah)
      VALUES ?
    `;
    const orderDetailsData = menu.map(item => [
      orderId,
      item.id_menu,
      item.nama_menu,
      item.harga,
      item.jumlah,
    ]);

    await new Promise((resolve, reject) => {
      connection.query(orderDetailsQuery, [orderDetailsData], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Commit transaction
    await new Promise((resolve, reject) => {
      connection.commit(err => {
        if (err) {
          connection.rollback(() => {
            reject(err);
          });
        } else {
          resolve();
        }
      });
    });

    // Return success response
    res.status(200).json({
      success: true,
      message: "Pesanan berhasil dibuat",
      data: {
        id_pesanan: orderId,
        kode_pesanan,
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
  } catch (error) {
    // Handle error and rollback if any part of the transaction fails
    console.error("Error during checkout:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Updated updateMenuStock function for using transactions with connection object
const updateMenuStock = (menuItems, connection) => {
  return new Promise((resolve, reject) => {
    // Start a transaction to ensure stock updates are atomic
    connection.beginTransaction((err) => {
      if (err) {
        return reject(err);
      }

      const updatePromises = menuItems.map((item) => {
        return new Promise((resolveItem, rejectItem) => {
          // First check if enough stock is available
          const checkStockQuery = "SELECT stok FROM menu_items WHERE id = ?";
          connection.query(checkStockQuery, [item.id_menu], (err, results) => {
            if (err) {
              return rejectItem(err);
            }

            if (!results[0] || results[0].stok < item.jumlah) {
              return rejectItem(new Error(`Stok tidak cukup untuk menu: ${item.nama_menu}`));
            }

            // Update stock
            const updateQuery = "UPDATE menu_items SET stok = stok - ? WHERE id = ?";
            connection.query(updateQuery, [item.jumlah, item.id_menu], (err) => {
              if (err) {
                return rejectItem(err);
              }
              resolveItem();
            });
          });
        });
      });

      Promise.all(updatePromises)
        .then(() => {
          connection.commit((err) => {
            if (err) {
              return connection.rollback(() => reject(err));
            }
            resolve();
          });
        })
        .catch((error) => {
          connection.rollback(() => reject(error));
        });
    });
  });
};

module.exports = {
  createOrder,
  getAllOrders,
  updateOrderStatus,
  checkout
};
  