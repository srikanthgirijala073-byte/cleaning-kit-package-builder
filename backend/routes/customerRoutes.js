const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', customerController.getCustomers);
router.get('/:id', customerController.getCustomerById);
router.post('/', customerController.addCustomer);
router.put('/:id', authMiddleware, customerController.updateCustomer);
router.delete('/:id', authMiddleware, customerController.deleteCustomer);

module.exports = router;
