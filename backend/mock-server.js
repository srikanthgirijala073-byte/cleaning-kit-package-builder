const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const app = express();
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'], credentials: true }));
app.use(express.json());

const JWT_SECRET = 'mock-secret';

// ── Auth ────────────────────────────────────────────────
let users = [
  { user_id:1, name:'Admin Demo',   email:'admin@example.com',            password:bcrypt.hashSync('admin123',10),    role:'admin',    email_verified:true, is_active:true },
  { user_id:2, name:'Manager Demo', email:'manager@example.com',          password:bcrypt.hashSync('manager123',10),  role:'manager',  email_verified:true, is_active:true },
  { user_id:3, name:'Staff Demo',   email:'staff@example.com',            password:bcrypt.hashSync('staff123',10),    role:'staff',    email_verified:true, is_active:true },
  { user_id:4, name:'Customer Demo',email:'customer@example.com',         password:bcrypt.hashSync('customer123',10), role:'customer', email_verified:true, is_active:true },
  { user_id:5, name:'Sri Surya',    email:'srisurya1389@gmail.com',       password:bcrypt.hashSync('1234567890',10),  role:'admin',    email_verified:true, is_active:true },
  { user_id:6, name:'Salesman Demo',email:'salesman@example.com',         password:bcrypt.hashSync('salesman123',10), role:'salesman', email_verified:true, is_active:true },
  { user_id:7, name:'Delivery Demo',email:'delivery@example.com',         password:bcrypt.hashSync('delivery123',10), role:'delivery', email_verified:true, is_active:true },
  { user_id:8, name:'Accounts Demo',email:'accounts@example.com',         password:bcrypt.hashSync('accounts123',10), role:'accounts', email_verified:true, is_active:true },
  { user_id:9, name:'Compliance Demo',email:'compliance@example.com',     password:bcrypt.hashSync('comply123',10),   role:'compliance',email_verified:true,is_active:true },
  { user_id:10,name:'Dealer Demo',  email:'dealer@example.com',           password:bcrypt.hashSync('dealer123',10),   role:'dealer',   email_verified:true, is_active:true },
];
let nextUserId = 11;

const genToken  = (u) => jwt.sign({ id:u.user_id, email:u.email, role:u.role }, JWT_SECRET, { expiresIn:'15m' });
const genRefresh = () => crypto.randomBytes(40).toString('hex');
const auth = (req,res,next) => {
  try {
    const d = jwt.verify(req.headers.authorization?.split(' ')[1], JWT_SECRET);
    const u = users.find(x => x.user_id === d.id);
    if (!u) return res.status(401).json({ message:'Unauthorized' });
    req.user = u; next();
  } catch(e) { return res.status(401).json({ message:'Invalid token' }); }
};
const id = () => Date.now() + Math.floor(Math.random()*1000);

// ── In-memory stores ─────────────────────────────────────
let products = [
  { product_id:1, name:'Disinfectant Spray',   category:'Cleaning Spray',  price:250, stock:80, min_stock_level:10, is_active:true, description:'Hospital-grade disinfectant', image_url:'' },
  { product_id:2, name:'Floor Cleaner',         category:'Cleaning Liquid', price:180, stock:60, min_stock_level:8,  is_active:true, description:'Multi-surface floor cleaner', image_url:'' },
  { product_id:3, name:'Toilet Cleaner',        category:'Bathroom Cleaner',price:120, stock:4,  min_stock_level:10, is_active:true, description:'Removes tough stains', image_url:'' },
  { product_id:4, name:'Hand Sanitizer',        category:'Hand Care',       price:90,  stock:100,min_stock_level:15, is_active:true, description:'70% alcohol formula', image_url:'' },
  { product_id:5, name:'Glass Cleaner',         category:'Cleaning Spray',  price:150, stock:45, min_stock_level:5,  is_active:true, description:'Streak-free shine', image_url:'' },
  { product_id:6, name:'Mop Set',               category:'Cleaning Tools',  price:350, stock:0,  min_stock_level:5,  is_active:true, description:'Heavy duty mop with bucket', image_url:'' },
  { product_id:7, name:'Tissue Roll (Pack 6)',  category:'Paper Products',  price:200, stock:90, min_stock_level:20, is_active:true, description:'Soft 2-ply tissue rolls', image_url:'' },
  { product_id:8, name:'Surface Polish',        category:'Cleaning Spray',  price:220, stock:30, min_stock_level:5,  is_active:true, description:'Furniture & surface polish', image_url:'' },
];
let nextProductId = 9;

let orders = [
  { order_id:1, customer_name:'Apollo Hospital', package_name:'Healthcare Bundle', quantity:5, amount:3200, status:'Delivered', facility_type:'Healthcare', facility_size:'Large', created_at:new Date(Date.now()-7*86400000).toISOString(), updated_at:new Date().toISOString() },
  { order_id:2, customer_name:'Taj Hotel',        package_name:'Hospitality Kit',   quantity:8, amount:5600, status:'Processing',facility_type:'Hospitality',facility_size:'Large', created_at:new Date(Date.now()-3*86400000).toISOString(), updated_at:new Date().toISOString() },
  { order_id:3, customer_name:'TCS Office',       package_name:'Corporate Pack',    quantity:3, amount:1800, status:'Pending',   facility_type:'Corporate',  facility_size:'Medium',created_at:new Date(Date.now()-1*86400000).toISOString(), updated_at:new Date().toISOString() },
  { order_id:4, customer_name:'Green Residency',  package_name:'Home Kit',          quantity:2, amount:900,  status:'Shipped',   facility_type:'Residential',facility_size:'Small', created_at:new Date(Date.now()-2*86400000).toISOString(), updated_at:new Date().toISOString() },
];
let nextOrderId = 5;

let customers = [
  { customer_id:1, name:'Apollo Hospital',  email:'purchase@apollo.com',     phone:'9876543210', company:'Apollo Group',   address:'Hyderabad', status:'active', created_at:new Date(Date.now()-90*86400000).toISOString() },
  { customer_id:2, name:'Taj Hotel',        email:'ops@tajhotels.com',        phone:'9876543211', company:'Taj Group',      address:'Mumbai',    status:'active', created_at:new Date(Date.now()-60*86400000).toISOString() },
  { customer_id:3, name:'TCS Office',       email:'facilities@tcs.com',       phone:'9876543212', company:'TCS Ltd',        address:'Pune',      status:'active', created_at:new Date(Date.now()-30*86400000).toISOString() },
  { customer_id:4, name:'Green Residency',  email:'admin@greenres.com',       phone:'9876543213', company:'',               address:'Bangalore', status:'active', created_at:new Date(Date.now()-10*86400000).toISOString() },
];
let nextCustomerId = 5;

let inventory = [
  { inventory_id:1, product_id:1, name:'Disinfectant Spray',  category:'Cleaning Spray',  current_stock:80, minimum_stock:10, status:'In Stock' },
  { inventory_id:2, product_id:2, name:'Floor Cleaner',        category:'Cleaning Liquid', current_stock:60, minimum_stock:8,  status:'In Stock' },
  { inventory_id:3, product_id:3, name:'Toilet Cleaner',       category:'Bathroom Cleaner',current_stock:4,  minimum_stock:10, status:'Low Stock' },
  { inventory_id:4, product_id:4, name:'Hand Sanitizer',       category:'Hand Care',       current_stock:100,minimum_stock:15, status:'In Stock' },
  { inventory_id:5, product_id:5, name:'Glass Cleaner',        category:'Cleaning Spray',  current_stock:45, minimum_stock:5,  status:'In Stock' },
  { inventory_id:6, product_id:6, name:'Mop Set',              category:'Cleaning Tools',  current_stock:0,  minimum_stock:5,  status:'Out of Stock' },
  { inventory_id:7, product_id:7, name:'Tissue Roll (Pack 6)', category:'Paper Products',  current_stock:90, minimum_stock:20, status:'In Stock' },
  { inventory_id:8, product_id:8, name:'Surface Polish',       category:'Cleaning Spray',  current_stock:30, minimum_stock:5,  status:'In Stock' },
];

let quotations = [
  { id:1, customer_name:'Apollo Hospital', company:'Apollo Group', email:'purchase@apollo.com', phone:'9876543210', status:'Sent', valid_until:new Date(Date.now()+15*86400000).toISOString().split('T')[0], notes:'Urgent requirement', items:[{product_id:1,name:'Disinfectant Spray',quantity:10,price:250},{product_id:4,name:'Hand Sanitizer',quantity:20,price:90}], total_amount:4300, created_at:new Date(Date.now()-2*86400000).toISOString() },
  { id:2, customer_name:'TCS Office',      company:'TCS Ltd',       email:'facilities@tcs.com', phone:'9876543212', status:'Draft',valid_until:new Date(Date.now()+30*86400000).toISOString().split('T')[0], notes:'Monthly supply', items:[{product_id:5,name:'Glass Cleaner',quantity:5,price:150},{product_id:8,name:'Surface Polish',quantity:5,price:220}], total_amount:1850, created_at:new Date(Date.now()-1*86400000).toISOString() },
];
let nextQuotationId = 3;

let deliveries = [
  { id:1, order_id:1, customer_name:'Apollo Hospital', address:'Hyderabad', status:'Delivered', driver:'Ravi Kumar', vehicle:'MH12AB1234', estimated_date:new Date(Date.now()-1*86400000).toISOString().split('T')[0], actual_date:new Date(Date.now()-1*86400000).toISOString().split('T')[0], notes:'Delivered on time', created_at:new Date(Date.now()-3*86400000).toISOString() },
  { id:2, order_id:2, customer_name:'Taj Hotel',       address:'Mumbai',    status:'In Transit',driver:'Suresh M',   vehicle:'MH14CD5678', estimated_date:new Date(Date.now()+1*86400000).toISOString().split('T')[0], actual_date:null,notes:'Out for delivery', created_at:new Date(Date.now()-1*86400000).toISOString() },
  { id:3, order_id:4, customer_name:'Green Residency', address:'Bangalore', status:'Packed',    driver:'',           vehicle:'',           estimated_date:new Date(Date.now()+2*86400000).toISOString().split('T')[0], actual_date:null,notes:'', created_at:new Date().toISOString() },
];
let nextDeliveryId = 4;

let visits = [
  { id:1, sales_person:'Vikram S', customer_name:'Taj Hotel',   company:'Taj Group', phone:'9876543211', visit_date:new Date(Date.now()-5*86400000).toISOString().split('T')[0], visit_type:'Follow-up',      purpose:'Contract renewal discussion', notes:'Client interested in annual deal', follow_up_required:true, follow_up_date:new Date(Date.now()+7*86400000).toISOString().split('T')[0], outcome:'Positive', created_at:new Date(Date.now()-5*86400000).toISOString() },
  { id:2, sales_person:'Priya R',  customer_name:'Apollo Hospital',company:'Apollo Group',phone:'9876543210',visit_date:new Date(Date.now()-2*86400000).toISOString().split('T')[0],visit_type:'Introductory',  purpose:'New product demo', notes:'Very receptive, needs PPE range too', follow_up_required:true,follow_up_date:new Date(Date.now()+3*86400000).toISOString().split('T')[0],outcome:'Positive',created_at:new Date(Date.now()-2*86400000).toISOString() },
];
let nextVisitId = 3;

let reorders = [
  { id:1, product_id:3, product_name:'Toilet Cleaner', quantity:50, supplier:'CleanSupply Co', notes:'Critically low', status:'Pending Approval', source:'reorder_dashboard', created_at:new Date(Date.now()-1*86400000).toISOString() },
  { id:2, product_id:6, product_name:'Mop Set',         quantity:20, supplier:'MopWorld Ltd',  notes:'Out of stock',   status:'Approved',          source:'reorder_dashboard', created_at:new Date(Date.now()-3*86400000).toISOString() },
];
let nextReorderId = 3;

let contracts = [
  { contract_id:1, customer_name:'Apollo Hospital', customer_id:1, contract_type:'Annual',    start_date:'2025-01-01', end_date:'2025-12-31', discount_percentage:15, status:'Active',   terms:'Net 30 payment. Min order ₹5000.',  special_pricing:[], owner:'admin@example.com', created_at:new Date(Date.now()-180*86400000).toISOString() },
  { contract_id:2, customer_name:'Taj Hotel',       customer_id:2, contract_type:'Half-Yearly',start_date:'2025-04-01',end_date:new Date(Date.now()+20*86400000).toISOString().split('T')[0], discount_percentage:10, status:'Expiring',terms:'Weekly delivery schedule.',          special_pricing:[], owner:'manager@example.com',created_at:new Date(Date.now()-160*86400000).toISOString() },
];
let nextContractId = 3;

let compliance = [
  { id:1, customer_name:'Apollo Hospital', compliance_type:'Safety Regulation', description:'Annual safety audit for cleaning chemicals', status:'In Progress', severity:'High',   target_date:new Date(Date.now()+10*86400000).toISOString().split('T')[0], findings:'Chemical storage not labeled', action_taken:'Labeling in progress', created_at:new Date(Date.now()-10*86400000).toISOString() },
  { id:2, customer_name:'Taj Hotel',       compliance_type:'Quality Standard',  description:'ISO 9001 cleaning standards verification',   status:'Open',        severity:'Medium', target_date:new Date(Date.now()+25*86400000).toISOString().split('T')[0], findings:'', action_taken:'', created_at:new Date(Date.now()-5*86400000).toISOString() },
];
let nextComplianceId = 3;

let warehouses = [
  { id:1, name:'Main Warehouse', location:'Hyderabad - Zone A', manager:'Ravi Kumar',  capacity:5000, used:3200, status:'Active', zones:['Zone A','Zone B','Zone C'], created_at:new Date(Date.now()-200*86400000).toISOString() },
  { id:2, name:'South Storage',  location:'Bangalore - Sector 4',manager:'Priya R',     capacity:2000, used:800,  status:'Active', zones:['Zone A','Zone B'],          created_at:new Date(Date.now()-100*86400000).toISOString() },
];
let warehouseStock = [
  { id:1, warehouse_id:1, product_id:1, product_name:'Disinfectant Spray', zone:'Zone A', bin:'A1-01', quantity:50, last_updated:new Date().toISOString() },
  { id:2, warehouse_id:1, product_id:2, product_name:'Floor Cleaner',       zone:'Zone A', bin:'A1-02', quantity:60, last_updated:new Date().toISOString() },
  { id:3, warehouse_id:1, product_id:4, product_name:'Hand Sanitizer',      zone:'Zone B', bin:'B2-01', quantity:100,last_updated:new Date().toISOString() },
  { id:4, warehouse_id:2, product_id:5, product_name:'Glass Cleaner',       zone:'Zone A', bin:'A1-03', quantity:45, last_updated:new Date().toISOString() },
];
let nextStockId = 5;

let b2bAccounts = [
  { id:1, name:'Apollo Hospital',  email:'purchase@apollo.com', phone:'9876543210', company:'Apollo Group',  type:'Institution', segment:'Healthcare',   contact_person:'Dr Sharma', last_order_date:new Date(Date.now()-7*86400000).toISOString(), status:'active', notes:'Large account - priority', created_at:new Date(Date.now()-365*86400000).toISOString() },
  { id:2, name:'Taj Hotel',        email:'ops@tajhotels.com',   phone:'9876543211', company:'Taj Group',     type:'Business',    segment:'Hospitality',  contact_person:'Rahul M',   last_order_date:new Date(Date.now()-3*86400000).toISOString(),  status:'active', notes:'Weekly delivery preferred',created_at:new Date(Date.now()-300*86400000).toISOString() },
  { id:3, name:'CleanMax Dealers', email:'dealer@cleanmax.com', phone:'9876543215', company:'CleanMax Pvt', type:'Dealer',      segment:'Distribution', contact_person:'Mohan K',   last_order_date:null, status:'active', notes:'New dealer partner', created_at:new Date(Date.now()-30*86400000).toISOString() },
];
let nextB2bAccountId = 4;

let notifications = [
  { id:1, user_id:1, title:'Low Stock Alert',   message:'Toilet Cleaner is below minimum stock level.',   type:'warning', is_read:false, created_at:new Date(Date.now()-1*86400000).toISOString() },
  { id:2, user_id:1, title:'New Order Placed',  message:'Apollo Hospital placed a new bulk order.',       type:'info',    is_read:false, created_at:new Date(Date.now()-2*86400000).toISOString() },
  { id:3, user_id:1, title:'Contract Expiring', message:'Taj Hotel contract expires in 20 days.',         type:'warning', is_read:true,  created_at:new Date(Date.now()-3*86400000).toISOString() },
  { id:4, user_id:1, title:'Delivery Completed',message:'Order ORD001 delivered to Apollo Hospital.',     type:'success', is_read:true,  created_at:new Date(Date.now()-4*86400000).toISOString() },
];
let nextNotifId = 5;

let loginHistory = [];

// ── Helpers ──────────────────────────────────────────────
const paginate = (arr, page=1, limit=10) => {
  const p = parseInt(page), l = parseInt(limit);
  const start = (p-1)*l;
  return { data: arr.slice(start, start+l), total: arr.length, page: p, totalPages: Math.ceil(arr.length/l) };
};
const searchFilter = (arr, term, fields) => {
  if (!term) return arr;
  const t = term.toLowerCase();
  return arr.filter(x => fields.some(f => String(x[f]||'').toLowerCase().includes(t)));
};

// ══════════════════════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════════════════════
app.post('/api/auth/quick-login', async (req,res) => {
  try {
    const { email, role, name } = req.body;
    let u = users.find(x => x.email === email);
    if (!u) {
      u = { user_id:nextUserId++, name, email, password:await bcrypt.hash('quick123',10), role, email_verified:true, is_active:true };
      users.push(u);
    } else if (role) u.role = role;
    const t = genToken(u);
    res.json({ accessToken:t, token:t, refreshToken:genRefresh(), user:{ user_id:u.user_id, name:u.name, email:u.email, role:u.role, profile_image:u.profile_image||'' } });
  } catch(e) { res.status(500).json({ message:'Login failed' }); }
});

app.post('/api/auth/login', async (req,res) => {
  try {
    const { email, password } = req.body;
    const u = users.find(x => x.email === email);
    if (!u || !(await bcrypt.compare(password, u.password))) return res.status(401).json({ message:'Invalid email or password' });
    const t = genToken(u);
    const { password:_, ...ud } = u;
    loginHistory.unshift({ id:Date.now(), user_id:u.user_id, email:u.email, login_date:new Date().toISOString(), device_name:'Browser', browser:'Chrome', ip_address:'127.0.0.1' });
    res.json({ accessToken:t, token:t, refreshToken:genRefresh(), user:ud });
  } catch(e) { res.status(500).json({ message:'Login failed' }); }
});

app.post('/api/auth/register', async (req,res) => {
  try {
    const { name, email, password } = req.body;
    if (users.find(u => u.email === email)) return res.status(409).json({ message:'Email already registered' });
    const u = { user_id:nextUserId++, name, email, password:await bcrypt.hash(password,10), role:'customer', email_verified:true, is_active:true };
    users.push(u);
    const { password:_, ...ud } = u;
    const t = genToken(u);
    res.status(201).json({ message:'Registered successfully', accessToken:t, token:t, refreshToken:genRefresh(), user:ud });
  } catch(e) { res.status(500).json({ message:'Registration failed' }); }
});

app.get('/api/auth/me', auth, (req,res) => { const { password:_, ...ud } = req.user; res.json(ud); });
app.post('/api/auth/logout', auth, (req,res) => { res.json({ message:'Logged out' }); });
app.post('/api/auth/refresh', (req,res) => { res.json({ accessToken:genToken(users[0]) }); });
app.get('/api/auth/login-history', auth, (req,res) => { res.json(loginHistory.filter(h => h.user_id === req.user.user_id)); });
app.get('/api/auth/audit-logs', auth, (req,res) => { res.json([]); });
app.put('/api/auth/profile', auth, (req,res) => { Object.assign(req.user, req.body); const { password:_, ...ud } = req.user; res.json(ud); });
app.put('/api/auth/change-password', auth, async (req,res) => {
  const { currentPassword, newPassword } = req.body;
  if (!(await bcrypt.compare(currentPassword, req.user.password))) return res.status(400).json({ message:'Current password is incorrect' });
  req.user.password = await bcrypt.hash(newPassword, 10);
  res.json({ message:'Password changed successfully' });
});
app.post('/api/auth/forgot-password', (req,res) => { res.json({ message:'Reset link sent (mock)' }); });
app.post('/api/auth/reset-password', (req,res) => { res.json({ message:'Password reset successful (mock)' }); });
app.post('/api/auth/resend-verification', (req,res) => { res.json({ message:'Verification email sent (mock)' }); });
app.get('/api/auth/login-notifications', auth, (req,res) => { res.json({ enabled: true }); });
app.put('/api/auth/login-notifications', auth, (req,res) => { res.json({ enabled: req.body.enabled }); });

// ══════════════════════════════════════════════════════════
//  PRODUCTS
// ══════════════════════════════════════════════════════════
app.get('/api/products', auth, (req,res) => {
  let list = [...products];
  if (req.query.search) list = searchFilter(list, req.query.search, ['name','category']);
  if (req.query.category && req.query.category !== 'All') list = list.filter(p => p.category === req.query.category);
  const cats = [...new Set(products.map(p => p.category))];
  const pg = paginate(list, req.query.page||1, req.query.limit||12);
  res.json({ products:pg.data, total:pg.total, totalPages:pg.totalPages, categories:cats });
});
app.get('/api/products/:id', auth, (req,res) => {
  const p = products.find(x => x.product_id === parseInt(req.params.id));
  if (!p) return res.status(404).json({ message:'Product not found' });
  res.json(p);
});
app.post('/api/products', auth, (req,res) => {
  const p = { product_id:nextProductId++, ...req.body, stock:req.body.stock||0, is_active:true, image_url:'', created_at:new Date().toISOString() };
  products.push(p);
  res.status(201).json(p);
});
app.put('/api/products/:id', auth, (req,res) => {
  const idx = products.findIndex(x => x.product_id === parseInt(req.params.id));
  if (idx<0) return res.status(404).json({ message:'Product not found' });
  products[idx] = { ...products[idx], ...req.body };
  res.json(products[idx]);
});
app.delete('/api/products/:id', auth, (req,res) => {
  const idx = products.findIndex(x => x.product_id === parseInt(req.params.id));
  if (idx<0) return res.status(404).json({ message:'Product not found' });
  products.splice(idx,1);
  res.json({ message:'Product deleted' });
});

// ══════════════════════════════════════════════════════════
//  ORDERS
// ══════════════════════════════════════════════════════════
app.get('/api/orders', auth, (req,res) => {
  let list = [...orders];
  if (req.query.search) list = searchFilter(list, req.query.search, ['customer_name','package_name']);
  if (req.query.status) list = list.filter(o => o.status === req.query.status);
  if (req.query.facility_type) list = list.filter(o => o.facility_type === req.query.facility_type);
  const pg = paginate(list, req.query.page||1, req.query.limit||6);
  res.json({ orders:pg.data, total:pg.total, totalPages:pg.totalPages });
});
app.get('/api/orders/:id', auth, (req,res) => {
  const o = orders.find(x => x.order_id === parseInt(req.params.id));
  if (!o) return res.status(404).json({ message:'Order not found' });
  res.json({ ...o, items:[], history:[{ status:o.status, notes:'Order created', created_at:o.created_at }] });
});
app.post('/api/orders', auth, (req,res) => {
  const o = { order_id:nextOrderId++, ...req.body, status:'Pending', created_at:new Date().toISOString(), updated_at:new Date().toISOString() };
  orders.unshift(o);
  notifications.unshift({ id:nextNotifId++, user_id:1, title:'New Order', message:`New order placed by ${o.customer_name}`, type:'info', is_read:false, created_at:new Date().toISOString() });
  res.status(201).json(o);
});
app.post('/api/orders/process', auth, (req,res) => {
  const { customer_name, package_name, facility_type, facility_size } = req.body;
  const facilityCategories = {
    Healthcare: ['Cleaning Spray','Hand Care','Bathroom Cleaner','Cleaning Liquid'],
    Hospitality: ['Cleaning Liquid','Bathroom Cleaner','Hand Care','Cleaning Spray','Cleaning Tools','Paper Products'],
    Corporate: ['Hand Care','Cleaning Spray','Cleaning Liquid'],
    Residential: ['Cleaning Liquid','Bathroom Cleaner','Cleaning Spray'],
  };
  const multiplier = { Small:2, Medium:5, Large:10 }[facility_size] || 5;
  const cats = facilityCategories[facility_type] || Object.values(facilityCategories).flat();
  const items = products.filter(p => cats.includes(p.category) && p.stock > 0)
    .map(p => ({ product_id:p.product_id, name:p.name, category:p.category, price:p.price, quantity:Math.min(multiplier, p.stock), subtotal:p.price * Math.min(multiplier,p.stock) }));
  const totalAmount = items.reduce((s,i) => s+i.subtotal, 0);
  const o = { order_id:nextOrderId++, customer_name, package_name, quantity:items.length, amount:totalAmount, status:'Pending', facility_type, facility_size, items, created_at:new Date().toISOString(), updated_at:new Date().toISOString() };
  orders.unshift(o);
  res.status(201).json({ message:'Bundle generated', order:o, items });
});
app.put('/api/orders/:id', auth, (req,res) => {
  const idx = orders.findIndex(x => x.order_id === parseInt(req.params.id));
  if (idx<0) return res.status(404).json({ message:'Order not found' });
  orders[idx] = { ...orders[idx], ...req.body, updated_at:new Date().toISOString() };
  res.json(orders[idx]);
});
app.delete('/api/orders/:id', auth, (req,res) => {
  const idx = orders.findIndex(x => x.order_id === parseInt(req.params.id));
  if (idx<0) return res.status(404).json({ message:'Order not found' });
  orders.splice(idx,1); res.json({ message:'Order deleted' });
});

// ══════════════════════════════════════════════════════════
//  CUSTOMERS
// ══════════════════════════════════════════════════════════
app.get('/api/customers', auth, (req,res) => {
  let list = [...customers];
  if (req.query.search) list = searchFilter(list, req.query.search, ['name','email','company']);
  const pg = paginate(list, req.query.page||1, req.query.limit||10);
  res.json({ customers:pg.data, total:pg.total, totalPages:pg.totalPages });
});
app.get('/api/customers/:id', auth, (req,res) => {
  const c = customers.find(x => x.customer_id === parseInt(req.params.id));
  if (!c) return res.status(404).json({ message:'Not found' });
  res.json(c);
});
app.post('/api/customers', auth, (req,res) => {
  const c = { customer_id:nextCustomerId++, ...req.body, status:'active', created_at:new Date().toISOString() };
  customers.push(c); res.status(201).json(c);
});
app.put('/api/customers/:id', auth, (req,res) => {
  const idx = customers.findIndex(x => x.customer_id === parseInt(req.params.id));
  if (idx<0) return res.status(404).json({ message:'Not found' });
  customers[idx] = { ...customers[idx], ...req.body };
  res.json(customers[idx]);
});
app.delete('/api/customers/:id', auth, (req,res) => {
  const idx = customers.findIndex(x => x.customer_id === parseInt(req.params.id));
  if (idx<0) return res.status(404).json({ message:'Not found' });
  customers.splice(idx,1); res.json({ message:'Deleted' });
});

// ══════════════════════════════════════════════════════════
//  INVENTORY
// ══════════════════════════════════════════════════════════
app.get('/api/inventory', auth, (req,res) => {
  let list = [...inventory];
  if (req.query.search) list = searchFilter(list, req.query.search, ['name','category']);
  if (req.query.status && req.query.status !== 'All') list = list.filter(i => i.status === req.query.status);
  const pg = paginate(list, req.query.page||1, req.query.limit||10);
  res.json({ inventory:pg.data, total:pg.total, totalPages:pg.totalPages });
});
app.put('/api/inventory/:id', auth, (req,res) => {
  const idx = inventory.findIndex(x => x.inventory_id === parseInt(req.params.id));
  if (idx<0) return res.status(404).json({ message:'Not found' });
  const cur = req.body.current_stock !== undefined ? parseInt(req.body.current_stock) : inventory[idx].current_stock;
  const min = req.body.minimum_stock !== undefined ? parseInt(req.body.minimum_stock) : inventory[idx].minimum_stock;
  const status = cur <= 0 ? 'Out of Stock' : cur <= min ? 'Low Stock' : 'In Stock';
  inventory[idx] = { ...inventory[idx], current_stock:cur, minimum_stock:min, status };
  const pi = products.findIndex(p => p.product_id === inventory[idx].product_id);
  if (pi>=0) products[pi].stock = cur;
  res.json(inventory[idx]);
});

// ══════════════════════════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════════════════════════
app.get('/api/dashboard/stats', auth, (req,res) => {
  const totalRevenue = orders.filter(o => ['Delivered','Completed'].includes(o.status)).reduce((s,o) => s+o.amount, 0);
  const lowStock = inventory.filter(i => i.current_stock <= i.minimum_stock).length;
  res.json({ totalOrders:orders.length, totalRevenue, totalCustomers:customers.length, totalProducts:products.length, pendingOrders:orders.filter(o=>o.status==='Pending').length, processingOrders:orders.filter(o=>o.status==='Processing').length, lowStockProducts:lowStock });
});
app.get('/api/dashboard/recent-orders', auth, (req,res) => {
  res.json(orders.slice(0,5).map(o => ({ ...o, customer_name:o.customer_name, amount:o.amount })));
});
app.get('/api/dashboard/charts', auth, (req,res) => { res.json({}); });
app.get('/api/rbac-dashboard/my-queue', auth, (req,res) => {
  const role = req.user.role;
  let queue = [...orders];
  if (role === 'staff' || role === 'delivery') queue = queue.filter(o => ['Pending','Processing'].includes(o.status));
  if (role === 'salesman') queue = [];
  res.json({ role, queue, total:queue.length });
});
app.get('/api/rbac-dashboard/orders/:id/history', auth, (req,res) => {
  res.json([{ status:'Pending', notes:'Created', created_at:new Date().toISOString() }]);
});

// ══════════════════════════════════════════════════════════
//  REPORTS
// ══════════════════════════════════════════════════════════
app.get('/api/reports/sales', auth, (req,res) => { res.json({ data:orders.slice(0,10), total:orders.length }); });
app.get('/api/reports/revenue', auth, (req,res) => {
  const revenue = orders.filter(o => ['Delivered','Completed'].includes(o.status)).reduce((s,o) => s+o.amount, 0);
  res.json({ total_revenue:revenue, orders_count:orders.length });
});
app.get('/api/reports/inventory', auth, (req,res) => { res.json({ data:inventory, low_stock:inventory.filter(i=>i.status!=='In Stock').length }); });

// ══════════════════════════════════════════════════════════
//  NOTIFICATIONS
// ══════════════════════════════════════════════════════════
app.get('/api/notifications', auth, (req,res) => { res.json(notifications.filter(n => !n.user_id || n.user_id === req.user.user_id)); });
app.put('/api/notifications/:id/read', auth, (req,res) => {
  const n = notifications.find(x => x.id === parseInt(req.params.id));
  if (n) n.is_read = true;
  res.json({ message:'Marked as read' });
});

// ══════════════════════════════════════════════════════════
//  SETTINGS
// ══════════════════════════════════════════════════════════
let settings = { company_name:'Cleaning Kit Builder', email:'admin@example.com', phone:'+91-9876543210', address:'123 Business Ave, Hyderabad', dark_mode:false, email_notifications:true };
app.get('/api/settings', auth, (req,res) => { res.json(settings); });
app.put('/api/settings', auth, (req,res) => { settings = { ...settings, ...req.body }; res.json(settings); });

// ══════════════════════════════════════════════════════════
//  AI / INSIGHTS (Step 4)
// ══════════════════════════════════════════════════════════
app.get('/api/ai/insights', auth, (req,res) => {
  const lowStockItems = inventory.filter(i => i.current_stock <= i.minimum_stock);
  const outOfStock   = inventory.filter(i => i.current_stock === 0);
  const revenue = orders.filter(o => ['Delivered','Completed'].includes(o.status)).reduce((s,o)=>s+o.amount,0);
  res.json({
    generated_at: new Date().toISOString(),
    daily_summary: { type:'daily_summary', date:new Date().toISOString().split('T')[0], orders_today:orders.filter(o=>o.created_at?.startsWith(new Date().toISOString().split('T')[0])).length, revenue_today:revenue, pending_orders:orders.filter(o=>o.status==='Pending').length, low_stock_items:lowStockItems.length, summary:`${orders.length} total orders, ₹${revenue.toLocaleString('en-IN')} revenue` },
    order_summary:  { type:'order_summary', total_orders:orders.length, pending:orders.filter(o=>o.status==='Pending').length, revenue, fulfillment_rate: orders.length ? Math.round((orders.filter(o=>['Delivered','Completed'].includes(o.status)).length/orders.length)*100) : 0, summary:`${orders.length} orders tracked` },
    alerts: { type:'system_alerts', total: lowStockItems.length + (orders.filter(o=>o.status==='Pending').length>0?1:0), alerts:[
      ...(outOfStock.length>0 ? [{ id:'oos', type:'error',   severity:'critical', title:'Out of Stock',    message:`${outOfStock.length} products out of stock`, actionable:true, action_link:'/inventory', action_label:'Restock' }] : []),
      ...(lowStockItems.length>0 ? [{ id:'ls',  type:'warning', severity:'high',     title:'Low Stock Alert', message:`${lowStockItems.length} products below minimum`, actionable:true, action_link:'/inventory', action_label:'View' }] : []),
    ]},
    messages: { type:'auto_messages', total:1, messages:[{ id:'m1', type:'system', title:'System Online', message:'Mock server running normally.', severity:'success', timestamp:new Date().toISOString() }] },
    popular_products: { type:'popular_products', items: products.sort((a,b)=>b.stock-a.stock).slice(0,6) },
  });
});
app.get('/api/ai/alerts', auth, (req,res) => {
  const alerts = [];
  const ls = inventory.filter(i => i.current_stock <= i.minimum_stock && i.current_stock > 0);
  const oos = inventory.filter(i => i.current_stock === 0);
  if (oos.length>0) alerts.push({ id:'oos', type:'error', severity:'critical', title:'Out of Stock', message:`${oos.length} products out of stock`, action_link:'/inventory' });
  if (ls.length>0)  alerts.push({ id:'ls',  type:'warning',severity:'high',    title:'Low Stock',    message:`${ls.length} products low`, action_link:'/inventory' });
  const expiring = contracts.filter(c => { const d = Math.ceil((new Date(c.end_date)-new Date())/(86400000)); return d>=0 && d<=30; });
  if (expiring.length>0) alerts.push({ id:'ce', type:'warning', severity:'medium', title:'Contracts Expiring', message:`${expiring.length} contracts expire within 30 days`, action_link:'/b2b/contracts' });
  const overdue = compliance.filter(c => c.status !== 'Resolved' && c.status !== 'Closed' && new Date(c.target_date) < new Date());
  if (overdue.length>0) alerts.push({ id:'co', type:'error', severity:'high', title:'Compliance Overdue', message:`${overdue.length} compliance items past deadline`, action_link:'/b2b/compliance' });
  res.json({ type:'system_alerts', total:alerts.length, alerts, generated_at:new Date().toISOString() });
});
app.get('/api/ai/recommendations', auth, (req,res) => {
  const reorder = inventory.filter(i => i.current_stock <= i.minimum_stock*1.5).map(i => ({ product_id:i.product_id, name:i.name, current_stock:i.current_stock, minimum_stock:i.minimum_stock, priority: i.current_stock<=i.minimum_stock?'Critical':'Warning' }));
  const popular = products.sort((a,b)=>b.stock-a.stock).slice(0,5);
  res.json({ reorder, popular, generated_at:new Date().toISOString() });
});
app.get('/api/ai/summary', auth, (req,res) => {
  const revenue = orders.filter(o=>['Delivered','Completed'].includes(o.status)).reduce((s,o)=>s+o.amount,0);
  res.json({ daily:{ orders_today:orders.length, revenue_today:revenue }, orders:{ summary:`${orders.length} total, ${orders.filter(o=>o.status==='Pending').length} pending` } });
});
app.get('/api/ai/messages', auth, (req,res) => {
  res.json({ messages:[{ id:'m1', type:'system', title:'System Online', message:'All systems running normally.', severity:'success', timestamp:new Date().toISOString() }] });
});
app.get('/api/ai/recommend-kit', auth, (req,res) => {
  const ft = req.query.facilityType || 'Healthcare';
  const cats = { Healthcare:['Cleaning Spray','Hand Care','Bathroom Cleaner'], Hospitality:['Cleaning Liquid','Bathroom Cleaner','Cleaning Spray'], Corporate:['Hand Care','Cleaning Spray'], Residential:['Cleaning Liquid','Bathroom Cleaner'] }[ft] || ['Cleaning Spray'];
  const items = products.filter(p => cats.includes(p.category) && p.stock > 0);
  res.json({ message:'Recommended kit', recommendation:{ facilityType:ft, recommendedCategories:cats, recommendedKit:{ items, totalAmount:items.reduce((s,p)=>s+p.price,0) } } });
});

// ══════════════════════════════════════════════════════════
//  BULK ORDER (Step 1 — missing portal backend)
// ══════════════════════════════════════════════════════════
app.post('/api/bulk-order', auth, (req,res) => {
  const { customer_name, customer_id, package_name, notes, items:lineItems } = req.body;
  if (!customer_name) return res.status(400).json({ message:'Customer name is required' });
  if (!Array.isArray(lineItems)||lineItems.length===0) return res.status(400).json({ message:'At least one item required' });
  const resolved = [];
  for (const item of lineItems) {
    const p = products.find(x => x.product_id === parseInt(item.product_id));
    if (!p) return res.status(404).json({ message:`Product ${item.product_id} not found` });
    if (p.stock < item.quantity) return res.status(400).json({ message:`Insufficient stock for ${p.name}` });
    resolved.push({ product_id:p.product_id, name:p.name, quantity:item.quantity, price:p.price, subtotal:p.price*item.quantity });
  }
  const totalAmount = resolved.reduce((s,i)=>s+i.subtotal,0);
  const o = { order_id:nextOrderId++, customer_name, customer_id:customer_id||null, package_name:package_name||'Bulk Order', quantity:resolved.reduce((s,i)=>s+i.quantity,0), amount:totalAmount, status:'Pending', notes:notes||'', items:resolved, created_at:new Date().toISOString(), updated_at:new Date().toISOString() };
  orders.unshift(o);
  notifications.unshift({ id:nextNotifId++, user_id:1, title:'Bulk Order Created', message:`Bulk order for ${customer_name} — ₹${totalAmount.toLocaleString('en-IN')}`, type:'info', is_read:false, created_at:new Date().toISOString() });
  res.status(201).json({ message:'Bulk order created', order:o, items:resolved });
});

// ══════════════════════════════════════════════════════════
//  B2B — QUOTATIONS
// ══════════════════════════════════════════════════════════
app.get('/api/b2b/quotations', auth, (req,res) => {
  let list = [...quotations];
  if (req.query.search) list = searchFilter(list, req.query.search, ['customer_name','company']);
  if (req.query.status && req.query.status !== 'All') list = list.filter(q => q.status === req.query.status);
  res.json({ quotations:list, total:list.length });
});
app.get('/api/b2b/quotations/:id', auth, (req,res) => {
  const q = quotations.find(x => x.id === parseInt(req.params.id));
  if (!q) return res.status(404).json({ message:'Not found' });
  res.json(q);
});
app.post('/api/b2b/quotations', auth, (req,res) => {
  const q = { id:nextQuotationId++, ...req.body, status:req.body.status||'Draft', total_amount:(req.body.items||[]).reduce((s,i)=>s+(i.price*i.quantity),0), owner:req.user.email, created_at:new Date().toISOString() };
  quotations.unshift(q);
  res.status(201).json(q);
});
app.put('/api/b2b/quotations/:id', auth, (req,res) => {
  const idx = quotations.findIndex(x => x.id === parseInt(req.params.id));
  if (idx<0) return res.status(404).json({ message:'Not found' });
  quotations[idx] = { ...quotations[idx], ...req.body, total_amount:(req.body.items||quotations[idx].items||[]).reduce((s,i)=>s+(i.price*i.quantity),0) };
  res.json(quotations[idx]);
});
app.delete('/api/b2b/quotations/:id', auth, (req,res) => {
  const idx = quotations.findIndex(x => x.id === parseInt(req.params.id));
  if (idx<0) return res.status(404).json({ message:'Not found' });
  quotations.splice(idx,1); res.json({ message:'Deleted' });
});
app.post('/api/b2b/quotations/:id/convert', auth, (req,res) => {
  const q = quotations.find(x => x.id === parseInt(req.params.id));
  if (!q) return res.status(404).json({ message:'Not found' });
  const o = { order_id:nextOrderId++, customer_name:q.customer_name, package_name:`Order from Quote #${q.id}`, quantity:q.items.reduce((s,i)=>s+i.quantity,0), amount:q.total_amount, status:'Pending', items:q.items, created_at:new Date().toISOString(), updated_at:new Date().toISOString() };
  orders.unshift(o);
  quotations.find(x=>x.id===q.id).status = 'Accepted';
  notifications.unshift({ id:nextNotifId++, user_id:1, title:'Quote Converted', message:`Quotation #${q.id} converted to order`, type:'success', is_read:false, created_at:new Date().toISOString() });
  res.json({ message:'Converted to order', order:o });
});

// ══════════════════════════════════════════════════════════
//  B2B — DELIVERIES
// ══════════════════════════════════════════════════════════
app.get('/api/b2b/deliveries', auth, (req,res) => {
  let list = [...deliveries];
  if (req.query.search) list = searchFilter(list, req.query.search, ['customer_name','driver']);
  if (req.query.status && req.query.status !== 'All') list = list.filter(d => d.status === req.query.status);
  res.json({ deliveries:list, total:list.length });
});
app.get('/api/b2b/deliveries/:id', auth, (req,res) => {
  const d = deliveries.find(x => x.id === parseInt(req.params.id));
  if (!d) return res.status(404).json({ message:'Not found' });
  res.json(d);
});
app.post('/api/b2b/deliveries', auth, (req,res) => {
  const d = { id:nextDeliveryId++, ...req.body, status:req.body.status||'Scheduled', created_at:new Date().toISOString() };
  deliveries.unshift(d); res.status(201).json(d);
});
app.put('/api/b2b/deliveries/:id', auth, (req,res) => {
  const idx = deliveries.findIndex(x => x.id === parseInt(req.params.id));
  if (idx<0) return res.status(404).json({ message:'Not found' });
  deliveries[idx] = { ...deliveries[idx], ...req.body };
  res.json(deliveries[idx]);
});
app.patch('/api/b2b/deliveries/:id/status', auth, (req,res) => {
  const d = deliveries.find(x => x.id === parseInt(req.params.id));
  if (!d) return res.status(404).json({ message:'Not found' });
  d.status = req.body.status;
  if (req.body.status === 'Delivered') d.actual_date = new Date().toISOString().split('T')[0];
  if (req.body.status === 'Delivered') {
    const o = orders.find(x => x.order_id === d.order_id);
    if (o) o.status = 'Delivered';
    notifications.unshift({ id:nextNotifId++, user_id:1, title:'Delivery Completed', message:`Order delivered to ${d.customer_name}`, type:'success', is_read:false, created_at:new Date().toISOString() });
  }
  res.json(d);
});

// ══════════════════════════════════════════════════════════
//  B2B — SALESMAN VISITS
// ══════════════════════════════════════════════════════════
app.get('/api/b2b/visits', auth, (req,res) => {
  let list = [...visits];
  if (req.query.search) list = searchFilter(list, req.query.search, ['customer_name','sales_person','company']);
  res.json({ visits:list, total:list.length });
});
app.post('/api/b2b/visits', auth, (req,res) => {
  const v = { id:nextVisitId++, ...req.body, owner:req.user.email, source:'salesman_visit_form', created_at:new Date().toISOString() };
  visits.unshift(v);
  if (v.follow_up_required && v.follow_up_date) notifications.unshift({ id:nextNotifId++, user_id:1, title:'Follow-up Scheduled', message:`Follow up with ${v.customer_name} on ${v.follow_up_date}`, type:'info', is_read:false, created_at:new Date().toISOString() });
  res.status(201).json(v);
});
app.put('/api/b2b/visits/:id', auth, (req,res) => {
  const idx = visits.findIndex(x => x.id === parseInt(req.params.id));
  if (idx<0) return res.status(404).json({ message:'Not found' });
  visits[idx] = { ...visits[idx], ...req.body };
  res.json(visits[idx]);
});
app.delete('/api/b2b/visits/:id', auth, (req,res) => {
  const idx = visits.findIndex(x => x.id === parseInt(req.params.id));
  if (idx<0) return res.status(404).json({ message:'Not found' });
  visits.splice(idx,1); res.json({ message:'Deleted' });
});

// ══════════════════════════════════════════════════════════
//  B2B — REORDERS
// ══════════════════════════════════════════════════════════
app.get('/api/b2b/reorders', auth, (req,res) => {
  let list = [...reorders];
  if (req.query.status) list = list.filter(r => r.status.toLowerCase().includes(req.query.status.toLowerCase()));
  res.json({ reorders:list, total:list.length });
});
app.get('/api/b2b/reorders/suggestions', auth, (req,res) => {
  const suggestions = inventory.filter(i => i.current_stock <= i.minimum_stock*1.5).map(i => ({ product_id:i.product_id, product_name:i.name, current_stock:i.current_stock, minimum_stock:i.minimum_stock, suggested_qty: i.minimum_stock*2 - i.current_stock, priority: i.current_stock<=i.minimum_stock ? 'Critical':'Warning' }));
  res.json({ suggestions });
});
app.post('/api/b2b/reorders', auth, (req,res) => {
  const r = { id:nextReorderId++, ...req.body, owner:req.user.email, created_at:new Date().toISOString() };
  reorders.unshift(r); res.status(201).json(r);
});
app.patch('/api/b2b/reorders/:id/approve', auth, (req,res) => {
  const r = reorders.find(x => x.id === parseInt(req.params.id));
  if (!r) return res.status(404).json({ message:'Not found' });
  r.status = 'Approved'; r.approved_by = req.user.email; r.approved_at = new Date().toISOString();
  notifications.unshift({ id:nextNotifId++, user_id:1, title:'Reorder Approved', message:`Reorder for ${r.product_name} approved`, type:'success', is_read:false, created_at:new Date().toISOString() });
  res.json(r);
});

// ══════════════════════════════════════════════════════════
//  B2B — CONTRACTS
// ══════════════════════════════════════════════════════════
app.get('/api/b2b/contracts', auth, (req,res) => {
  let list = [...contracts];
  if (req.query.search) list = searchFilter(list, req.query.search, ['customer_name']);
  res.json({ contracts:list, total:list.length });
});
app.post('/api/b2b/contracts', auth, (req,res) => {
  const c = { contract_id:nextContractId++, ...req.body, owner:req.user.email, source:'contract_pricing', created_at:new Date().toISOString() };
  contracts.unshift(c);
  notifications.unshift({ id:nextNotifId++, user_id:1, title:'New Contract', message:`Contract created for ${c.customer_name}`, type:'info', is_read:false, created_at:new Date().toISOString() });
  res.status(201).json(c);
});
app.put('/api/b2b/contracts/:id', auth, (req,res) => {
  const idx = contracts.findIndex(x => (x.contract_id||x.id) === parseInt(req.params.id));
  if (idx<0) return res.status(404).json({ message:'Not found' });
  contracts[idx] = { ...contracts[idx], ...req.body };
  res.json(contracts[idx]);
});
app.delete('/api/b2b/contracts/:id', auth, (req,res) => {
  const idx = contracts.findIndex(x => (x.contract_id||x.id) === parseInt(req.params.id));
  if (idx<0) return res.status(404).json({ message:'Not found' });
  contracts.splice(idx,1); res.json({ message:'Deleted' });
});
app.get('/api/b2b/contracts/pricing/:customerId', auth, (req,res) => {
  const c = contracts.find(x => String(x.customer_id) === req.params.customerId || x.customer_name.toLowerCase().includes(req.params.customerId.toLowerCase()));
  if (!c) return res.status(404).json({ message:'No contract found' });
  const contractedProducts = products.map(p => ({ name:p.name, original_price:p.price, contract_price:Math.round(p.price*(1 - (c.discount_percentage||0)/100)) }));
  res.json({ contract:c, products:contractedProducts });
});
// Legacy path
app.get('/api/contract-pricing/:customerId', auth, (req,res) => {
  const c = contracts.find(x => String(x.customer_id) === req.params.customerId);
  if (!c) return res.json({ products:[] });
  const contractedProducts = products.map(p => ({ name:p.name, original_price:p.price, contract_price:Math.round(p.price*(1-(c.discount_percentage||0)/100)) }));
  res.json({ contract:c, products:contractedProducts });
});

// ══════════════════════════════════════════════════════════
//  B2B — COMPLIANCE
// ══════════════════════════════════════════════════════════
app.get('/api/b2b/compliance', auth, (req,res) => {
  let list = [...compliance];
  if (req.query.search) list = searchFilter(list, req.query.search, ['customer_name','compliance_type']);
  if (req.query.status && req.query.status !== 'All') list = list.filter(c => c.status === req.query.status);
  res.json({ records:list, total:list.length });
});
app.post('/api/b2b/compliance', auth, (req,res) => {
  const c = { id:nextComplianceId++, ...req.body, owner:req.user.email, source:'compliance_portal', created_at:new Date().toISOString() };
  compliance.unshift(c);
  if (c.severity === 'Critical' || c.severity === 'High') notifications.unshift({ id:nextNotifId++, user_id:1, title:'New Compliance Issue', message:`${c.severity} severity: ${c.compliance_type} for ${c.customer_name}`, type:'warning', is_read:false, created_at:new Date().toISOString() });
  res.status(201).json(c);
});
app.put('/api/b2b/compliance/:id', auth, (req,res) => {
  const idx = compliance.findIndex(x => x.id === parseInt(req.params.id));
  if (idx<0) return res.status(404).json({ message:'Not found' });
  compliance[idx] = { ...compliance[idx], ...req.body };
  res.json(compliance[idx]);
});
app.get('/api/b2b/compliance/:id/audit', auth, (req,res) => {
  const c = compliance.find(x => x.id === parseInt(req.params.id));
  if (!c) return res.status(404).json({ message:'Not found' });
  res.json([{ action:'Created', actor:c.owner||'system', timestamp:c.created_at, details:`${c.compliance_type} record created` }]);
});

// ══════════════════════════════════════════════════════════
//  B2B — WAREHOUSE MANAGEMENT (Step 1 — missing portal)
// ══════════════════════════════════════════════════════════
app.get('/api/b2b/warehouses', auth, (req,res) => {
  let list = [...warehouses];
  if (req.query.search) list = searchFilter(list, req.query.search, ['name','location']);
  res.json({ warehouses:list, total:list.length });
});
app.post('/api/b2b/warehouses', auth, (req,res) => {
  const w = { id:Date.now(), ...req.body, status:'Active', created_at:new Date().toISOString() };
  warehouses.push(w); res.status(201).json(w);
});
app.put('/api/b2b/warehouses/:id', auth, (req,res) => {
  const idx = warehouses.findIndex(x => x.id === parseInt(req.params.id));
  if (idx<0) return res.status(404).json({ message:'Not found' });
  warehouses[idx] = { ...warehouses[idx], ...req.body };
  res.json(warehouses[idx]);
});
app.get('/api/b2b/warehouses/:id/stock', auth, (req,res) => {
  const stock = warehouseStock.filter(s => s.warehouse_id === parseInt(req.params.id));
  res.json({ stock, total:stock.length });
});
app.post('/api/b2b/warehouses/:id/stock', auth, (req,res) => {
  const s = { id:nextStockId++, warehouse_id:parseInt(req.params.id), ...req.body, last_updated:new Date().toISOString() };
  warehouseStock.push(s); res.status(201).json(s);
});
app.put('/api/b2b/warehouses/:wid/stock/:sid', auth, (req,res) => {
  const idx = warehouseStock.findIndex(x => x.id === parseInt(req.params.sid));
  if (idx<0) return res.status(404).json({ message:'Not found' });
  warehouseStock[idx] = { ...warehouseStock[idx], ...req.body, last_updated:new Date().toISOString() };
  res.json(warehouseStock[idx]);
});

// ══════════════════════════════════════════════════════════
//  B2B — CRM ACCOUNTS (Institutional CRM extended)
// ══════════════════════════════════════════════════════════
app.get('/api/b2b/accounts', auth, (req,res) => {
  let list = [...b2bAccounts];
  if (req.query.search) list = searchFilter(list, req.query.search, ['name','company','segment']);
  const pg = paginate(list, req.query.page||1, req.query.limit||10);
  res.json({ accounts:pg.data, total:pg.total, totalPages:pg.totalPages });
});
app.get('/api/b2b/accounts/:id', auth, (req,res) => {
  const a = b2bAccounts.find(x => x.id === parseInt(req.params.id));
  if (!a) return res.status(404).json({ message:'Not found' });
  res.json(a);
});
app.post('/api/b2b/accounts', auth, (req,res) => {
  const a = { id:nextB2bAccountId++, ...req.body, status:'active', created_at:new Date().toISOString() };
  b2bAccounts.push(a); res.status(201).json(a);
});
app.put('/api/b2b/accounts/:id', auth, (req,res) => {
  const idx = b2bAccounts.findIndex(x => x.id === parseInt(req.params.id));
  if (idx<0) return res.status(404).json({ message:'Not found' });
  b2bAccounts[idx] = { ...b2bAccounts[idx], ...req.body };
  res.json(b2bAccounts[idx]);
});

// ══════════════════════════════════════════════════════════
//  FACILITY BUNDLE PREVIEW
// ══════════════════════════════════════════════════════════
app.get('/api/facility-bundle/preview', auth, (req,res) => {
  const { facility_type, facility_size } = req.query;
  const cats = { Healthcare:['Cleaning Spray','Hand Care'], Hospitality:['Cleaning Liquid','Bathroom Cleaner','Cleaning Spray'], Corporate:['Hand Care','Cleaning Spray'], Residential:['Cleaning Liquid','Bathroom Cleaner'] }[facility_type] || ['Cleaning Spray'];
  const mult = { Small:2, Medium:5, Large:10 }[facility_size] || 5;
  const items = products.filter(p => cats.includes(p.category) && p.stock > 0).map(p => ({ ...p, recommended_qty:Math.min(mult,p.stock) }));
  res.json({ facilityType:facility_type, facilitySize:facility_size, items, totalAmount:items.reduce((s,p)=>s+p.price*Math.min(mult,p.stock),0) });
});

// ══════════════════════════════════════════════════════════
//  MISC
// ══════════════════════════════════════════════════════════
app.get('/api/health', (req,res) => res.json({ status:'ok', server:'mock', timestamp:new Date().toISOString() }));
app.use((req,res) => res.status(404).json({ message:`Not found: ${req.method} ${req.originalUrl}` }));

app.listen(5000, () => console.log('\n🧹 Mock server running on http://localhost:5000\n   All B2B routes + AI routes active\n'));
