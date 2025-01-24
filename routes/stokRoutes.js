const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stokController');

router.post('/:id/add', stockController.addStock);
router.post('/:id/reduce', stockController.reduceStock);
router.put('/:id/reset', stockController.resetStock);
router.put('/:id/edit', stockController.editStock);

module.exports = router;