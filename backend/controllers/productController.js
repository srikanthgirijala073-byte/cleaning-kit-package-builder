const Product = require('../models/Product');
const { buildFacilityBundle } = require('../services/bundlingService');

const productController = {
  async getProducts(req, res, next) {
    try {
      const { search, category, sort, order, page, limit } = req.query;
      const products = await Product.findAll({ search, category, sort, order, page: parseInt(page) || 1, limit: parseInt(limit) || 12 });
      const total = await Product.count({ search, category });
      const categories = await Product.getCategories();
      res.json({ products, total, page: parseInt(page) || 1, totalPages: Math.ceil(total / (parseInt(limit) || 12)), categories });
    } catch (error) {
      next(error);
    }
  },

  async getProductById(req, res, next) {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ message: 'Product not found' });
      res.json(product);
    } catch (error) {
      next(error);
    }
  },

  async addProduct(req, res, next) {
    try {
      const { name, category, price, stock, rating, image, description } = req.body;
      if (!name || !category || !price) {
        return res.status(400).json({ message: 'Name, category, and price are required' });
      }
      const imageUrl = req.file ? `/uploads/${req.file.filename}` : (image || '');
      const productId = await Product.create({ name, category, price, stock: stock || 0, rating: rating || 0, image: imageUrl, description });
      const product = await Product.findById(productId);
      res.status(201).json({ message: 'Product added successfully', product });
    } catch (error) {
      next(error);
    }
  },

  async updateProduct(req, res, next) {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ message: 'Product not found' });

      const { name, category, price, stock, rating, image, description } = req.body;
      const fields = {};
      if (name) fields.name = name;
      if (category) fields.category = category;
      if (price) fields.price = price;
      if (stock !== undefined) fields.stock = stock;
      if (rating) fields.rating = rating;
      if (req.file) fields.image = `/uploads/${req.file.filename}`;
      else if (image) fields.image = image;
      if (description !== undefined) fields.description = description;

      await Product.update(req.params.id, fields);
      const updated = await Product.findById(req.params.id);
      res.json({ message: 'Product updated successfully', product: updated });
    } catch (error) {
      next(error);
    }
  },

  async deleteProduct(req, res, next) {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ message: 'Product not found' });

      await Product.delete(req.params.id);
      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/facility-bundle/preview?facility_type=Hospital&facility_size=Medium&focus_areas=Cleaning%20Spray,Hand%20Care
   * -----------------------------------------------------------------
   * "Step 3: Cleaning Kit Workflow (Bundling)" business-rules preview.
   * Looks up every in-stock product and runs it through
   * services/bundlingService.buildFacilityBundle() to recommend a kit
   * for the given facility type/size WITHOUT creating an order. This
   * lets the KitBuilder UI show "here's what we'd bundle" before the
   * customer commits, and lets other portals (e.g. Bulk Order) reuse
   * the exact same business rule.
   */
  async previewFacilityBundle(req, res, next) {
    try {
      const { facility_type, facility_size, focus_areas } = req.query;

      if (!facility_type) {
        return res.status(400).json({ message: 'facility_type is required (e.g. Hospital, Office, Hotel, Home).' });
      }

      const focusAreas = focus_areas
        ? String(focus_areas).split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      // Pull every product so the bundling rule has the full catalog to
      // match against; the rule itself filters by category/stock.
      const products = await Product.findAll({ limit: 500 });

      const bundle = buildFacilityBundle({
        facilityType: facility_type,
        facilitySize: facility_size,
        products,
        focusAreas,
      });

      if (bundle.items.length === 0) {
        return res.status(400).json({
          message: bundle.warning || 'No in-stock products match this facility configuration.',
          bundle,
        });
      }

      res.json({ message: 'Facility bundle preview generated successfully', bundle });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = productController;
