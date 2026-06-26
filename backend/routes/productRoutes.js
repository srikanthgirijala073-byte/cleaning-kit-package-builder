const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { roleMiddleware } = require('../middleware/roleMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);
router.post('/', authMiddleware, roleMiddleware('admin', 'manager'), upload.single('image'), productController.addProduct);
router.put('/:id', authMiddleware, roleMiddleware('admin', 'manager'), upload.single('image'), productController.updateProduct);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), productController.deleteProduct);

module.exports = router;
