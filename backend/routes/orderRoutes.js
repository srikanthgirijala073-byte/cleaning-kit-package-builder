const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrderById);
router.post('/', orderController.createOrder);
router.post('/process', orderController.processFacilityBundle);
router.put('/:id', authMiddleware, orderController.updateOrder);
router.delete('/:id', authMiddleware, orderController.deleteOrder);

module.exports = router;
