import { useEffect, useState } from "react";
import SearchBar from "../components/SearchBar";
import FilterBar from "../components/FilterBar";
import ProductCard from "../components/ProductCard";
import StatisticsCard from "../components/StatisticsCard";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";
import LoadingSpinner from "../components/LoadingSpinner";
import { getProducts, createProduct, updateProduct, deleteProduct, BACKEND_URL } from "../services/api";
import { exportToCSV } from "../utils/csvExport";
import { useAuth } from "../context/AuthContext";
import "./Products.css";

import {
  FaBoxes,
  FaWarehouse,
  FaCheckCircle,
  FaExclamationTriangle,
  FaPlus,
  FaEdit,
  FaTrash,
  FaHeart,
  FaRegHeart,
  FaFileCsv,
} from "react-icons/fa";

function Products() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [inStock, setInStock] = useState(0);
  const [lowStock, setLowStock] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  
  // Wishlist / Favorites states
  const [wishlist, setWishlist] = useState(() => {
    const saved = localStorage.getItem("wishlist");
    return saved ? JSON.parse(saved) : [];
  });
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Recently Viewed states
  const [recentlyViewed, setRecentlyViewed] = useState(() => {
    const saved = localStorage.getItem("recentlyViewed");
    return saved ? JSON.parse(saved) : [];
  });
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
    description: "",
    image: null,
  });

  const fetchProductsList = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 6,
        search: searchTerm,
        category: selectedCategory === "All" ? "" : selectedCategory,
      };
      
      const response = await getProducts(params);
      setProducts(response.data.products);
      setTotal(response.data.total);
      setInStock(response.data.inStock || 0);
      setLowStock(response.data.lowStock || 0);
      setTotalPages(response.data.totalPages || 1);
      
      if (response.data.categories) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsList();
  }, [currentPage, searchTerm, selectedCategory]);

  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const handleToggleWishlist = (productId) => {
    let updated;
    if (wishlist.includes(productId)) {
      updated = wishlist.filter((id) => id !== productId);
    } else {
      updated = [...wishlist, productId];
    }
    setWishlist(updated);
    localStorage.setItem("wishlist", JSON.stringify(updated));
  };

  const handleQuickView = (product) => {
    setQuickViewProduct(product);
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((p) => p.product_id !== product.product_id);
      const updated = [product, ...filtered].slice(0, 6);
      localStorage.setItem("recentlyViewed", JSON.stringify(updated));
      return updated;
    });
  };

  const handleExportCSV = () => {
    const headers = ["Product ID", "Name", "Category", "Price (₹)", "Stock", "Rating", "Description"];
    const fields = ["product_id", "name", "category", "price", "stock", "rating", "description"];
    exportToCSV(products, "cleaning_products_catalog.csv", headers, fields);
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      category: categories[0] || "Cleaning Liquids",
      price: "",
      stock: "",
      description: "",
      image: null,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price,
      stock: product.stock,
      description: product.description || "",
      image: null,
    });
    setIsModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, image: e.target.files[0] }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("category", formData.category);
      data.append("price", formData.price);
      data.append("stock", formData.stock);
      data.append("description", formData.description);
      if (formData.image) {
        data.append("image", formData.image);
      }

      if (editingProduct) {
        await updateProduct(editingProduct.product_id, data);
        alert("Product updated successfully!");
      } else {
        await createProduct(data);
        alert("Product added successfully!");
      }
      
      setIsModalOpen(false);
      fetchProductsList();
    } catch (error) {
      console.error("Error saving product:", error);
      alert(error.response?.data?.message || "Failed to save product");
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await deleteProduct(id);
        alert("Product deleted successfully");
        fetchProductsList();
      } catch (error) {
        console.error("Error deleting product:", error);
        alert(error.response?.data?.message || "Failed to delete product");
      }
    }
  };

  const getImageUrl = (img) => {
    return img ? (img.startsWith("http") ? img : `${BACKEND_URL}${img}`) : "https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=500";
  };

  // Filter local display array if showing favorites
  const displayedProducts = showFavoritesOnly
    ? products.filter((p) => wishlist.includes(p.product_id))
    : products;

  const lowStockCount = lowStock;
  const inStockCount = inStock;

  return (
    <div className="products-page">
      {/* Header */}
      <div className="products-header">
        <div>
          <h1>Products Management</h1>
          <p>Manage all cleaning products and inventory items.</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn-secondary" onClick={handleExportCSV} type="button">
            <FaFileCsv /> Export to CSV
          </button>
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <button className="btn-primary" onClick={handleOpenAddModal} type="button">
              <FaPlus /> Add Product
            </button>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="products-stats">
        <StatisticsCard
          title="Total Products"
          value={total}
          icon={<FaBoxes />}
          color="#2563eb"
          percentage=""
          subtitle="Catalog size"
        />

        <StatisticsCard
          title="In Stock"
          value={inStockCount}
          icon={<FaCheckCircle />}
          color="#10b981"
          percentage=""
          subtitle="Available items"
        />

        <StatisticsCard
          title="Low Stock"
          value={lowStockCount}
          icon={<FaExclamationTriangle />}
          color="#f59e0b"
          percentage=""
          subtitle="Need replenishment"
        />

        <StatisticsCard
          title="Warehouse"
          value="5 Locations"
          icon={<FaWarehouse />}
          color="#ef4444"
          percentage=""
          subtitle="Storage zones"
        />
      </div>

      {/* Search and Filter */}
      <div className="products-controls">
        <div style={{ flex: 1, display: "flex", gap: "15px", alignItems: "center" }}>
          <SearchBar
            searchTerm={searchTerm}
            setSearchTerm={handleSearch}
            placeholder="Search products..."
          />
          <button 
            className={`btn-fav-filter ${showFavoritesOnly ? "active" : ""}`}
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            type="button"
          >
            {showFavoritesOnly ? <FaHeart className="fav-icon" /> : <FaRegHeart className="fav-icon" />}
            {showFavoritesOnly ? "Show All Products" : "Show Favorites Only"}
          </button>
        </div>

        <FilterBar
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={handleCategoryChange}
        />
      </div>

      {/* Product Grid */}
      {loading ? (
        <LoadingSpinner />
      ) : displayedProducts.length === 0 ? (
        <div className="empty-state">
          <p>No products found matching the criteria.</p>
        </div>
      ) : (
        <>
          <div className="products-grid">
            {displayedProducts.map((product) => (
              <div key={product.product_id} className="product-wrapper">
                <ProductCard
                  image={getImageUrl(product.image)}
                  name={product.name}
                  category={product.category}
                  price={product.price}
                  stock={product.stock}
                  rating={product.rating}
                  addToCart={() => alert(`${product.name} added to builder cart`)}
                  isFavorite={wishlist.includes(product.product_id)}
                  onToggleFavorite={() => handleToggleWishlist(product.product_id)}
                  onQuickView={() => handleQuickView(product)}
                />
                <div className="product-actions-bar">
                  {(user?.role === 'admin' || user?.role === 'manager') && (
                    <button className="icon-btn edit" onClick={() => handleOpenEditModal(product)} type="button">
                      <FaEdit /> Edit
                    </button>
                  )}
                  {user?.role === 'admin' && (
                    <button className="icon-btn delete" onClick={() => handleDeleteProduct(product.product_id, product.name)} type="button">
                      <FaTrash /> Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {/* Recently Viewed Products Slider */}
      {recentlyViewed.length > 0 && (
        <div className="recently-viewed-section">
          <h3>Recently Viewed Products</h3>
          <div className="recently-viewed-slider">
            {recentlyViewed.map((product) => (
              <div 
                key={`recent-${product.product_id}`} 
                className="recent-product-card" 
                onClick={() => handleQuickView(product)}
              >
                <div className="recent-img-wrapper">
                  <img src={getImageUrl(product.image)} alt={product.name} />
                </div>
                <div className="recent-info">
                  <h4>{product.name}</h4>
                  <div className="recent-meta">
                    <span className="recent-price">₹{product.price}</span>
                    <span className="recent-cat">{product.category}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick View Modal */}
      <Modal
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        title="Product Details Quick View"
      >
        {quickViewProduct && (
          <div className="quickview-modal-content">
            <div className="quickview-img-container">
              <img src={getImageUrl(quickViewProduct.image)} alt={quickViewProduct.name} />
            </div>
            <div className="quickview-details">
              <h3>{quickViewProduct.name}</h3>
              <span className="quickview-category">{quickViewProduct.category}</span>
              <p className="quickview-description">
                {quickViewProduct.description || "High efficiency cleaning solution tailored for commercial and domestic utility. Enhances sanitation and hygiene standards."}
              </p>
              
              <div className="quickview-meta-grid">
                <div className="meta-box">
                  <span className="meta-lbl">Unit Price</span>
                  <span className="meta-val text-success">₹{quickViewProduct.price}</span>
                </div>
                <div className="meta-box">
                  <span className="meta-lbl">Stock Status</span>
                  <span className={`meta-val ${quickViewProduct.stock < 10 ? "text-danger" : "text-success"}`}>
                    {quickViewProduct.stock} units
                  </span>
                </div>
                <div className="meta-box">
                  <span className="meta-lbl">Rating Score</span>
                  <span className="meta-val text-warning">⭐ {quickViewProduct.rating || 4.5}</span>
                </div>
              </div>

              <button 
                className="btn-primary" 
                style={{ width: "100%", marginTop: "24px", padding: "14px" }}
                onClick={() => {
                  alert(`${quickViewProduct.name} added to builder cart`);
                  setQuickViewProduct(null);
                }}
                type="button"
              >
                Add to Package Builder
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? "Edit Product" : "Add Product"}
      >
        <form onSubmit={handleFormSubmit} className="modal-form">
          <div className="form-group">
            <label>Product Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              required
              placeholder="e.g. Toilet Cleaner"
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Price (₹)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleFormChange}
                required
                min="0"
                placeholder="e.g. 250"
              />
            </div>
            <div className="form-group">
              <label>Initial Stock</label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleFormChange}
                required
                min="0"
                placeholder="e.g. 50"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleFormChange}
              required
            >
              <option value="Cleaning Liquids">Cleaning Liquids</option>
              <option value="Accessories">Accessories</option>
              <option value="Disinfectants">Disinfectants</option>
              <option value="Tools">Tools</option>
            </select>
          </div>

          <div className="form-group">
            <label>Product Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              rows="3"
              placeholder="Describe the product details..."
            />
          </div>

          <div className="form-group">
            <label>Product Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingProduct ? "Save Changes" : "Add Product"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Products;