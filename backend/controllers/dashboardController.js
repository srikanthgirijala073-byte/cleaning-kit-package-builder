const db = require('../config/db');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

/**
 * STATUS_BY_DEPARTMENT
 * -----------------------------------------------------------------
 * "Step 5: Dashboard Records — Role-Based Aggregation".
 * Maps a staff member's department (set on the RBAC Staff record,
 * models/Staff.js, and carried into the JWT at login — see
 * rbacAuthController.staffLogin) to the order status that's relevant
 * to their day-to-day queue. Department matching is case-insensitive
 * and substring-based so "Warehouse", "warehouse-east", etc. all
 * resolve the same way.
 */
const STATUS_BY_DEPARTMENT = [
  { match: 'warehouse', status: 'Pending Packing', label: 'Warehouse Staff' },
  { match: 'sales', status: 'Visit Scheduled', label: 'Salesman' },
  { match: 'delivery', status: 'Shipped', label: 'Delivery Staff' },
  { match: 'support', status: 'Processing', label: 'Support Staff' },
];

function resolveDepartmentQueue(department) {
  if (!department) return null;
  const key = String(department).toLowerCase();
  return STATUS_BY_DEPARTMENT.find((entry) => key.includes(entry.match)) || null;
}

const dashboardController = {
  async getStats(req, res, next) {
    try {
      const totalOrders = await Order.countAll();
      const totalRevenue = await Order.getRevenue();
      const totalCustomers = await Customer.countAll();
      const totalProducts = await Product.countAll();
      const totalUsers = await User.count();

      const pendingOrders = await Order.countByStatus('Pending');
      const processingOrders = await Order.countByStatus('Processing');
      const deliveredOrders = await Order.countByStatus('Delivered');
      const completedOrders = await Order.countByStatus('Completed');
      const cancelledOrders = await Order.countByStatus('Cancelled');

      res.json({
        totalOrders,
        totalRevenue,
        totalCustomers,
        totalProducts,
        totalUsers,
        pendingOrders,
        processingOrders,
        deliveredOrders,
        completedOrders,
        cancelledOrders,
      });
    } catch (error) {
      next(error);
    }
  },

  async getCharts(req, res, next) {
    try {
      const revenueByMonth = await Order.getRevenueByMonth();
      const salesByProduct = await Order.getSalesByProduct();
      const statusDistribution = await Order.getStatusDistribution();

      res.json({ revenueByMonth, salesByProduct, statusDistribution });
    } catch (error) {
      next(error);
    }
  },

  async getRecentOrders(req, res, next) {
    try {
      const orders = await Order.findAll({ sort: 'created_at', order: 'DESC', page: 1, limit: 10 });
      res.json(orders);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/rbac-dashboard/my-queue
   * -----------------------------------------------------------------
   * Role-Based Aggregation: returns only the orders relevant to the
   * signed-in user's role/department, instead of the full order list.
   *   - admin / manager: every order (the full operational picture).
   *   - staff in the "Warehouse" department: orders with
   *     status = 'Pending Packing'.
   *   - staff in the "Sales" department (a Salesman): orders with
   *     status = 'Visit Scheduled'.
   *   - staff with no recognized department: falls back to 'Pending'
   *     orders as a safe default queue.
   *
   * Expects req.rbacUser to have been set by middleware/rbacAuth.js's
   * `protect`, and (for staff) req.rbacUser.department to have been
   * included in the JWT at login time (see rbacAuthController.staffLogin).
   */
  async getRoleBasedQueue(req, res, next) {
    try {
      const rbacUser = req.rbacUser;
      if (!rbacUser) {
        return res.status(401).json({ success: false, message: 'You are not authorized to access this page.' });
      }

      const { page, limit } = req.query;
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 20;

      let statusFilter = '';
      let queueLabel = 'All Orders';

      if (rbacUser.role === 'admin' || rbacUser.role === 'manager') {
        statusFilter = '';
        queueLabel = rbacUser.role === 'admin' ? 'All Orders (Admin)' : 'All Orders (Manager)';
      } else if (rbacUser.role === 'staff') {
        const departmentQueue = resolveDepartmentQueue(rbacUser.department);
        if (departmentQueue) {
          statusFilter = departmentQueue.status;
          queueLabel = `${departmentQueue.label} Queue (${departmentQueue.status})`;
        } else {
          statusFilter = 'Pending';
          queueLabel = 'Staff Queue (Pending — no department set)';
        }
      }

      const orders = await Order.findAll({
        status: statusFilter,
        sort: 'created_at',
        order: 'DESC',
        page: pageNum,
        limit: limitNum,
      });
      const total = await Order.count({ status: statusFilter });

      res.json({
        success: true,
        role: rbacUser.role,
        department: rbacUser.department || null,
        queueLabel,
        statusFilter: statusFilter || 'ALL',
        orders,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/rbac-dashboard/orders/:orderId/history
   * -----------------------------------------------------------------
   * Action History: who changed this specific order, and when.
   * Backed by AuditLog.findByEntity('order', orderId).
   */
  async getOrderActionHistory(req, res, next) {
    try {
      const { orderId } = req.params;
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found.' });
      }

      const history = await AuditLog.findByEntity('order', orderId);
      res.json({ success: true, order_id: Number(orderId), history });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = dashboardController;
