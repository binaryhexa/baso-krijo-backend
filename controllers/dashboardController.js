const db = require("../config/database");

const getDashboardData = (req, res) => {
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
    
      const totalSales = chartResults.reduce((sum, item) => sum + item.total_sold, 0);
      const totalRevenue = chartResults.reduce((sum, item) => sum + item.total_revenue, 0);
    
      const chartData = chartResults.map((item) => ({
        menu_name: item.menu_name,
        total_sold: item.total_sold,
        total_revenue: item.total_revenue,
      }));
    
      res.json({
        total_sales: totalSales || 0,
        total_revenue: totalRevenue || 0,
        chart_data: chartData,
      });
    });
  });
};

const getSalesReport = (req, res) => {
  const { startDate, endDate } = req.query;
  
  let query = `
    SELECT mi.name AS menu_name, 
           SUM(od.jumlah) AS quantity, 
           mi.harga AS price
    FROM order_details od
    JOIN menu_items mi ON od.id_menu = mi.id
    JOIN orders o ON od.id_order = o.id`;
  if (startDate && endDate) {
    query += ` WHERE DATE(o.created_at) BETWEEN ? AND ?`;
  }

  query += ` GROUP BY od.id_menu`;

  const queryParams = startDate && endDate ? [startDate, endDate] : [];

  console.log('Query:', query);
  console.log('Parameters:', queryParams);

  db.query(query, queryParams, (err, results) => {
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

    console.log('Report Data:', reportData);
    console.log('Total Price:', totalPrice);

    res.json({ reportData, totalPrice });
  });
};

module.exports = {
  getDashboardData,
  getSalesReport
};