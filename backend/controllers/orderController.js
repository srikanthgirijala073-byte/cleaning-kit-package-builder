const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const OrderHistory = require('../models/OrderHistory');
const Product = require('../models/Product');
const AuditLog = require('../models/AuditLog');

const orderController = {
  async createOrder(req, res, next) {
    try {
      const { customer_name, customer_id, package_name, quantity, amount, status, items, facility_type, facility_size, notes } = req.body;

      if (!customer_name || !amount) {
        return res.status(400).json({ message: 'Customer name and amount are required' });
      }

      const orderId = await Order.create({
        customer_name,
        customer_id: customer_id || null,
        package_name: package_name || 'Custom Package',
        quantity: quantity || 1,
        amount,
        status: status || 'Pending',
        facility_type: facility_type || null,
        facility_size: facility_size || null,
        notes: notes || null
      });

      if (items && Array.isArray(items)) {
        for (const item of items) {
          await OrderItem.create({
            order_id: orderId,
            product_id: item.product_id,
            quantity: item.quantity || 1,
            price: item.price,
          });
        }
      }

      // Record initial history timeline entry
      await OrderHistory.create({
        order_id: orderId,
        status: status || 'Pending',
        notes: notes || 'Package order created successfully.'
      });

      const order = await Order.findById(orderId);
      const orderItems = await OrderItem.findByOrderId(orderId);

      // Notify all administrative users (admin, manager, staff)
      try {
        const [usersToNotify] = await require('../config/db').execute(
          "SELECT user_id FROM users WHERE role IN ('admin', 'manager', 'staff')"
        );
        for (const u of usersToNotify) {
          await require('../config/db').execute(
            "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)",
            [
              u.user_id,
              "New Order Placed",
              `A new order of ${quantity || 1} item(s) (Total: ₹${amount}) has been placed by ${customer_name} for "${package_name || 'Custom Package'}".`,
              "info"
            ]
          );
        }
      } catch (notifErr) {
        console.error("Failed to create admin notification:", notifErr);
      }

      res.status(201).json({ message: 'Order created successfully', order, items: orderItems });
    } catch (error) {
      next(error);
    }
  },

  async getOrders(req, res, next) {
    try {
      const { search, status, facility_type, startDate, endDate, sort, order, page, limit } = req.query;
      const orders = await Order.findAll({
        search,
        status,
        facility_type,
        startDate,
        endDate,
        sort,
        order,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10
      });
      const total = await Order.count({ search, status, facility_type, startDate, endDate });

      const ordersWithItems = [];
      for (const ord of orders) {
        const items = await OrderItem.findByOrderId(ord.order_id);
        ordersWithItems.push({ ...ord, items });
      }

      res.json({ orders: ordersWithItems, total, page: parseInt(page) || 1, totalPages: Math.ceil(total / (parseInt(limit) || 10)) });
    } catch (error) {
      next(error);
    }
  },

  async getOrderById(req, res, next) {
    try {
      const order = await Order.findById(req.params.id);
      if (!order) return res.status(404).json({ message: 'Order not found' });

      const items = await OrderItem.findByOrderId(req.params.id);
      const history = await OrderHistory.findByOrderId(req.params.id);
      res.json({ ...order, items, history });
    } catch (error) {
      next(error);
    }
  },

  async updateOrder(req, res, next) {
    try {
      const order = await Order.findById(req.params.id);
      if (!order) return res.status(404).json({ message: 'Order not found' });

      const { customer_name, package_name, quantity, amount, status, notes } = req.body;
      const fields = {};
      if (customer_name) fields.customer_name = customer_name;
      if (package_name) fields.package_name = package_name;
      if (quantity) fields.quantity = quantity;
      if (amount) fields.amount = amount;
      if (status) fields.status = status;
      if (notes) fields.notes = notes;

      await Order.update(req.params.id, fields);

      const statusChanged = status && status !== order.status;
      if (statusChanged || notes) {
        await OrderHistory.create({
          order_id: req.params.id,
          status: status || order.status,
          notes: notes || `Status updated from '${order.status}' to '${status || order.status}'.`
        });
      }

      // Step 5: Action History — record who changed this record and when.
      // req.rbacUser is present when this route is reached through the
      // Admin/Manager/Staff RBAC system (middleware/rbacAuth.js); req.user
      // is present when reached through the main customer-facing auth
      // system (middleware/auth.js). Either way we never let an audit
      // logging failure block the actual order update from succeeding.
      try {
        const actor = req.rbacUser || req.user || null;
        await AuditLog.create({
          userId: req.user ? req.user.userId : null,
          actorLabel: actor ? `${actor.role || 'unknown'}:${actor.email || actor.userId || 'unknown'}` : 'system',
          action: 'ORDER_UPDATED',
          details: `Fields changed: ${Object.keys(fields).join(', ') || 'none'}.`,
          entityType: 'order',
          entityId: req.params.id,
          ipAddress: req.ip || '',
        });
      } catch (auditError) {
        console.error('Audit log write failed (non-blocking):', auditError.message);
      }

      const updated = await Order.findById(req.params.id);
      res.json({ message: 'Order updated successfully', order: updated });
    } catch (error) {
      next(error);
    }
  },

  async deleteOrder(req, res, next) {
    try {
      const order = await Order.findById(req.params.id);
      if (!order) return res.status(404).json({ message: 'Order not found' });

      await Order.delete(req.params.id);
      res.json({ message: 'Order deleted successfully' });
    } catch (error) {
      next(error);
    }
  },

  async processFacilityBundle(req, res, next) {
    try {
      const { customer_name, package_name, facility_type, facility_size, focus_areas, notes, customer_id } = req.body;

      if (!customer_name || !package_name || !facility_type || !facility_size) {
        return res.status(400).json({ message: 'Customer name, package name, facility type, and facility size are required' });
      }

      // 1. Fetch available products
      const products = await Product.findAll({ limit: 100 });

      // 2. Define category mappings for Focus Areas
      // Mapping:
      // - Floors & Corridors -> "Cleaning Liquid", "Cleaning Tools"
      // - Glass & Windows -> "Cleaning Spray"
      // - Restrooms -> "Bathroom Cleaner"
      // - Hand Care & Hygiene -> "Hand Care"
      const focusAreaCategories = {
        'Floors': ['Cleaning Liquid', 'Cleaning Tools'],
        'Glass': ['Cleaning Spray'],
        'Restrooms': ['Bathroom Cleaner'],
        'Hand Hygiene': ['Hand Care']
      };

      // 3. Define default categories for Facility Types
      const facilityDefaultCategories = {
        'Healthcare': ['Hand Care', 'Cleaning Spray', 'Bathroom Cleaner', 'Cleaning Liquid'],
        'Hospitality': ['Cleaning Liquid', 'Bathroom Cleaner', 'Hand Care', 'Cleaning Spray', 'Cleaning Tools'],
        'Corporate': ['Hand Care', 'Cleaning Spray', 'Cleaning Liquid'],
        'Residential': ['Cleaning Liquid', 'Bathroom Cleaner', 'Cleaning Spray']
      };

      // Determine which categories we want to select
      let targetCategories = [];
      if (focus_areas && Array.isArray(focus_areas) && focus_areas.length > 0) {
        focus_areas.forEach(area => {
          if (focusAreaCategories[area]) {
            targetCategories.push(...focusAreaCategories[area]);
          }
        });
      } else {
        targetCategories = facilityDefaultCategories[facility_type] || ['Cleaning Liquid', 'Cleaning Spray', 'Bathroom Cleaner', 'Hand Care'];
      }

      // De-duplicate target categories
      targetCategories = [...new Set(targetCategories)];

      // 4. Calculate Quantities based on Facility Size
      let multiplier = 2; // small default
      if (facility_size.toLowerCase() === 'medium') {
        multiplier = 5;
      } else if (facility_size.toLowerCase() === 'large') {
        multiplier = 10;
      }

      // 5. Select products matching the target categories and calculate totals
      const recommendedItems = [];
      let totalAmount = 0;
      let totalQty = 0;

      products.forEach(prod => {
        if (targetCategories.includes(prod.category)) {
          // Exclude out of stock items
          if (prod.stock > 0) {
            const quantity = Math.min(multiplier, prod.stock); // recommend multiplier or available stock
            const price = parseFloat(prod.price);
            recommendedItems.push({
              product_id: prod.product_id,
              name: prod.name,
              category: prod.category,
              image: prod.image,
              price: price,
              quantity: quantity,
              subtotal: price * quantity
            });
            totalAmount += price * quantity;
            totalQty += quantity;
          }
        }
      });

      if (recommendedItems.length === 0) {
        return res.status(400).json({ message: 'No suitable products available in stock for the selected configurations.' });
      }

      // 6. Save the package order to database
      const orderId = await Order.create({
        customer_name,
        customer_id: customer_id || null,
        package_name: package_name || `${facility_type} Bundle`,
        quantity: totalQty,
        amount: totalAmount,
        status: 'Pending',
        facility_type,
        facility_size,
        notes: notes || `Automated bundle generated for ${facility_type} (${facility_size}).`
      });

      // 7. Save order items
      for (const item of recommendedItems) {
        await OrderItem.create({
          order_id: orderId,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price
        });
      }

      // 8. Create status history
      const historyNotes = `Initial status 'Pending'. Facility Package auto-generated for ${facility_type} (${facility_size}) with focus on: ${focus_areas ? focus_areas.join(', ') : 'All categories'}. Total products: ${recommendedItems.length}.`;
      await OrderHistory.create({
        order_id: orderId,
        status: 'Pending',
        notes: historyNotes
      });

      const savedOrder = await Order.findById(orderId);
      const savedItems = await OrderItem.findByOrderId(orderId);
      const savedHistory = await OrderHistory.findByOrderId(orderId);

      res.status(201).json({
        message: 'Facility package bundle generated and saved successfully',
        order: savedOrder,
        items: savedItems,
        history: savedHistory
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/bulk-order
   * -----------------------------------------------------------------
   * "Step 1: Data Entry — Bulk Order Portal". Places a single order
   * containing many line items in one request, validating stock for
   * every line before committing any of them (so a bulk order never
   * partially succeeds and leaves inventory in an inconsistent state).
   *
   * Body shape:
   * {
   *   customer_name: string (required),
   *   customer_id: number (optional),
   *   package_name: string (optional),
   *   notes: string (optional),
   *   items: [{ product_id, quantity }, ...]  (required, 1+)
   * }
   */
  async createBulkOrder(req, res, next) {
    try {
      const { customer_name, customer_id, package_name, notes, items } = req.body;

      if (!customer_name) {
        return res.status(400).json({ message: 'Customer name is required.' });
      }
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'At least one line item is required for a bulk order.' });
      }

      // 1. Validate every line item up front (stock + existence) before
      // writing anything, so the bulk order is all-or-nothing.
      const resolvedItems = [];
      for (const item of items) {
        if (!item || !item.product_id || !item.quantity || item.quantity <= 0) {
          return res.status(400).json({ message: 'Every line item requires a valid product_id and a positive quantity.' });
        }

        const product = await Product.findById(item.product_id);
        if (!product) {
          return res.status(404).json({ message: `Product ${item.product_id} was not found.` });
        }
        if (Number(product.stock) < Number(item.quantity)) {
          return res.status(400).json({
            message: `Insufficient stock for "${product.name}". Requested ${item.quantity}, available ${product.stock}.`,
          });
        }

        const price = parseFloat(product.price) || 0;
        resolvedItems.push({
          product_id: product.product_id,
          name: product.name,
          quantity: Number(item.quantity),
          price,
          subtotal: price * Number(item.quantity),
        });
      }

      const totalAmount = resolvedItems.reduce((sum, i) => sum + i.subtotal, 0);
      const totalQuantity = resolvedItems.reduce((sum, i) => sum + i.quantity, 0);

      // 2. Create the order + items.
      const orderId = await Order.create({
        customer_name,
        customer_id: customer_id || null,
        package_name: package_name || 'Bulk Order',
        quantity: totalQuantity,
        amount: totalAmount,
        status: 'Pending',
        notes: notes || `Bulk order with ${resolvedItems.length} distinct product line(s).`,
      });

      for (const item of resolvedItems) {
        await OrderItem.create({
          order_id: orderId,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
        });
      }

      await OrderHistory.create({
        order_id: orderId,
        status: 'Pending',
        notes: `Bulk order created via the Bulk Order Portal with ${resolvedItems.length} line item(s).`,
      });

      try {
        const actor = req.rbacUser || req.user || null;
        await AuditLog.create({
          userId: req.user ? req.user.userId : null,
          actorLabel: actor ? `${actor.role || 'unknown'}:${actor.email || actor.userId || 'unknown'}` : 'system',
          action: 'BULK_ORDER_CREATED',
          details: `Bulk order #${orderId} created for "${customer_name}" with ${resolvedItems.length} line item(s), total ₹${totalAmount}.`,
          entityType: 'order',
          entityId: orderId,
          ipAddress: req.ip || '',
        });
      } catch (auditError) {
        console.error('Audit log write failed (non-blocking):', auditError.message);
      }

      const savedOrder = await Order.findById(orderId);
      const savedItems = await OrderItem.findByOrderId(orderId);

      res.status(201).json({
        message: 'Bulk order created successfully',
        order: savedOrder,
        items: savedItems,
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = orderController;
