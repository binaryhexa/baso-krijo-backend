const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");

router.get("/", dashboardController.getDashboardData);
router.get("/sales-report", dashboardController.getSalesReport);

module.exports = router;