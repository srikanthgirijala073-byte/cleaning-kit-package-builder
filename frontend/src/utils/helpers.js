export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStatusColor(status) {
  const colors = {
    'Pending': '#f59e0b',
    'Processing': '#3b82f6',
    'Shipped': '#8b5cf6',
    'Delivered': '#10b981',
    'Completed': '#10b981',
    'Cancelled': '#ef4444',
    'In Stock': '#10b981',
    'Low Stock': '#f59e0b',
    'Out of Stock': '#ef4444',
  };
  return colors[status] || '#64748b';
}

export function getStatusBg(status) {
  const colors = {
    'Pending': '#fef3c7',
    'Processing': '#dbeafe',
    'Shipped': '#ede9fe',
    'Delivered': '#d1fae5',
    'Completed': '#d1fae5',
    'Cancelled': '#fee2e2',
    'In Stock': '#d1fae5',
    'Low Stock': '#fef3c7',
    'Out of Stock': '#fee2e2',
  };
  return colors[status] || '#f1f5f9';
}

export function truncateText(text, maxLength = 50) {
  if (!text || text.length <= maxLength) return text || '-';
  return text.substring(0, maxLength) + '...';
}

export function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

export function debounce(func, delay = 300) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
}

export const PRODUCTS = [
  { product_id: 1, name: 'Floor Cleaner', category: 'Cleaning Liquid', price: 250, stock: 120, rating: 4.8, image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=500', description: 'Professional floor cleaning solution for all surfaces' },
  { product_id: 2, name: 'Glass Cleaner', category: 'Cleaning Spray', price: 180, stock: 90, rating: 4.7, image: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=500', description: 'Streak-free glass and window cleaner' },
  { product_id: 3, name: 'Toilet Cleaner', category: 'Bathroom Cleaner', price: 220, stock: 80, rating: 4.9, image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500', description: 'Powerful toilet bowl and bathroom cleaner' },
  { product_id: 4, name: 'Surface Cleaner', category: 'Cleaning Spray', price: 200, stock: 100, rating: 4.6, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=500', description: 'Multi-surface disinfectant cleaner' },
  { product_id: 5, name: 'Sanitizer', category: 'Hand Care', price: 150, stock: 200, rating: 4.9, image: 'https://images.unsplash.com/photo-1607619056574-7b8d570a2f4e?w=500', description: 'Alcohol-based hand sanitizer 70%' },
  { product_id: 6, name: 'Hand Wash', category: 'Hand Care', price: 120, stock: 150, rating: 4.5, image: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=500', description: 'Luxury liquid hand wash with moisturizer' },
  { product_id: 7, name: 'Mop', category: 'Cleaning Tools', price: 350, stock: 60, rating: 4.4, image: 'https://images.unsplash.com/photo-1585689514342-2b98a84c64ed?w=500', description: 'Microfiber flat mop with extendable handle' },
  { product_id: 8, name: 'Brush', category: 'Cleaning Tools', price: 80, stock: 300, rating: 4.3, image: 'https://images.unsplash.com/photo-1585435279437-1c2f9e8e65e9?w=500', description: 'Multi-purpose cleaning brush set' },
  { product_id: 9, name: 'Tissue Roll', category: 'Paper Products', price: 45, stock: 500, rating: 4.2, image: 'https://images.unsplash.com/photo-1588964895597-cfccd6e2fbf9?w=500', description: 'Premium 2-ply tissue paper rolls' },
];
