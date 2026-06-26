const Customer = require('../models/Customer');
const Order = require('../models/Order');

const customerController = {
  async getCustomers(req, res, next) {
    try {
      const { search, sort, order, page, limit } = req.query;
      const customers = await Customer.findAll({ search, sort, order, page: parseInt(page) || 1, limit: parseInt(limit) || 10 });
      const total = await Customer.count({ search });
      res.json({ customers, total, page: parseInt(page) || 1, totalPages: Math.ceil(total / (parseInt(limit) || 10)) });
    } catch (error) {
      next(error);
    }
  },

  async getCustomerById(req, res, next) {
    try {
      const customer = await Customer.findById(req.params.id);
      if (!customer) return res.status(404).json({ message: 'Customer not found' });

      const orders = await Order.findAll({ search: customer.name, sort: 'created_at', order: 'DESC', page: 1, limit: 50 });
      res.json({ ...customer, orders: orders || [] });
    } catch (error) {
      next(error);
    }
  },

  async addCustomer(req, res, next) {
    try {
      const { name, email, phone, address, company, image } = req.body;
      if (!name || !email) {
        return res.status(400).json({ message: 'Name and email are required' });
      }

      const customerId = await Customer.create({ name, email, phone, address, company, image });
      const customer = await Customer.findById(customerId);
      res.status(201).json({ message: 'Customer added successfully', customer });
    } catch (error) {
      next(error);
    }
  },

  async updateCustomer(req, res, next) {
    try {
      const customer = await Customer.findById(req.params.id);
      if (!customer) return res.status(404).json({ message: 'Customer not found' });

      const { name, email, phone, address, company, image } = req.body;
      const fields = {};
      if (name) fields.name = name;
      if (email) fields.email = email;
      if (phone) fields.phone = phone;
      if (address) fields.address = address;
      if (company) fields.company = company;
      if (image) fields.image = image;

      await Customer.update(req.params.id, fields);
      const updated = await Customer.findById(req.params.id);
      res.json({ message: 'Customer updated successfully', customer: updated });
    } catch (error) {
      next(error);
    }
  },

  async deleteCustomer(req, res, next) {
    try {
      const customer = await Customer.findById(req.params.id);
      if (!customer) return res.status(404).json({ message: 'Customer not found' });

      await Customer.delete(req.params.id);
      res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = customerController;
