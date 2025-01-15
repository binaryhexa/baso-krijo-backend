const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
require("dotenv").config();

const menuRoutes = require("./routes/menuRoutes");
const orderRoutes = require("./routes/orderRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());
app.use("/public", express.static(path.join(__dirname, "public")));

app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});