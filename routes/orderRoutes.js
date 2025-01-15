const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

router.post("/", orderController.createOrder);
router.get("/", orderController.getAllOrders);
router.patch("/:orderId", orderController.updateOrderStatus);
router.post("/checkout", orderController.checkout);  

module.exports = router;