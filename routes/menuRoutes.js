const express = require("express");
const router = express.Router();
const upload = require("../config/multer");
const menuController = require("../controllers/menuController");

router.get("/", menuController.getAllMenus);
router.get("/:id", menuController.getMenuById);
router.post("/", upload.single("image"), menuController.createMenu);
router.put("/:id", upload.single("image"), menuController.updateMenu);

module.exports = router;