const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
require("dotenv").config();

const menuRoutes = require("./routes/menuRoutes");
const orderRoutes = require("./routes/orderRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const stokRoutes = require('./routes/stokRoutes');
const bahanBakuRoutes = require('./routes/bahanBakuRoutes');
const authRoutes = require('./routes/authRoutes'); 

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use("/public", express.static(path.join(__dirname, "public")));

app.use('/api/bahan-baku', bahanBakuRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/stok", stokRoutes);
app.use('/api/auth', authRoutes); 

app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;