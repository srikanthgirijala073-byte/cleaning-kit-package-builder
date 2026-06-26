import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import SearchBar from "../components/SearchBar";
import FilterBar from "../components/FilterBar";
import CartItem from "../components/CartItem";
import Modal from "../components/Modal";
import LoadingSpinner from "../components/LoadingSpinner";
import { getProducts, createOrder, processOrderBundle, BACKEND_URL } from "../services/api";
import API from "../services/api";
import "./KitBuilder.css";

function KitBuilder() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  
  // Navigation Tabs State
  const [activeTab, setActiveTab] = useState("manual");

  // Checkout Modal State (Manual Builder)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [packageName, setPackageName] = useState("");
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [savedKitLink, setSavedKitLink] = useState(null);
  const [savingKit, setSavingKit] = useState(false);

  // Smart Assistant State
  const [facilityType, setFacilityType] = useState("Hospitality");
  const [facilitySize, setFacilitySize] = useState("Medium");
  const [focusAreas, setFocusAreas] = useState([]);
  const [assistantCustomerName, setAssistantCustomerName] = useState("");
  const [assistantPackageName, setAssistantPackageName] = useState("");
  const [assistantNotes, setAssistantNotes] = useState("");
  const [generatedBundle, setGeneratedBundle] = useState(null);
  const [submittingAssistant, setSubmittingAssistant] = useState(false);

  // Validation errors
  const [formErrors, setFormErrors] = useState({});


  // ── Save Kit ──────────────────────────────────────────────────────────────
  const handleSaveKit = async () => {
    if (cart.length === 0) {
      alert("Please add products to your kit before saving.");
      return;
    }
    const kitName = packageName.trim() || prompt("Enter a name for this kit:");
    if (!kitName) return;
    try {
      setSavingKit(true);
      setSavedKitLink(null);
      const totalAmount = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
      const res = await API.post("/b2b/kits", {
        kit_name: kitName,
        customer_name: customerName || "",
        facility_type: "Custom",
        items: cart,
        total_amount: totalAmount,
      });
      const token = res.data.share_token;
      const shareUrl = `${window.location.origin}/kit-builder?shared=${token}`;
      setSavedKitLink(shareUrl);
      alert("Kit saved successfully! Use the Copy Link button to share it.");
    } catch (err) {
      console.error("Save kit error:", err);
      alert("Failed to save kit. Please try again.");
    } finally {
      setSavingKit(false);
    }
  };

  const handleCopyKitLink = () => {
    if (!savedKitLink) return;
    navigator.clipboard.writeText(savedKitLink).then(() => {
      alert("Share link copied to clipboard!");
    }).catch(() => {
      prompt("Copy this link:", savedKitLink);
    });
  };

  const fetchProductsForBuilder = async () => {
    try {
      setLoading(true);
      const response = await getProducts({ limit: 100 });
      setProducts(response.data.products);
      if (response.data.categories) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error("Error loading products for builder:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsForBuilder();
  }, []);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" ||
      product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const addToCart = (product) => {
    const existingItem = cart.find((item) => item.product_id === product.product_id);

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.product_id === product.product_id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          product_id: product.product_id,
          name: product.name,
          category: product.category,
          price: product.price,
          image: product.image,
          quantity: 1,
        },
      ]);
    }
  };

  const increaseQuantity = (id) => {
    setCart(
      cart.map((item) =>
        item.product_id === id
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      )
    );
  };

  const decreaseQuantity = (id) => {
    setCart(
      cart
        .map((item) =>
          item.product_id === id
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (id) => {
    setCart(cart.filter((item) => item.product_id !== id));
  };

  const totalPrice = cart.reduce(
    (sum, item) => sum + parseFloat(item.price) * item.quantity,
    0
  );

  const totalQuantity = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert("Please add products to your package first.");
      return;
    }

    try {
      setSubmittingOrder(true);
      const orderData = {
        customer_name: customerName,
        package_name: packageName,
        quantity: totalQuantity,
        amount: totalPrice,
        status: "Pending",
        items: cart.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price
        }))
      };

      await createOrder(orderData);
      alert("Order created successfully!");
      setCart([]);
      setCustomerName("");
      setPackageName("");
      setIsCheckoutOpen(false);
    } catch (error) {
      console.error("Error creating package order:", error);
      alert(error.response?.data?.message || "Failed to create order");
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Smart Assistant Form Handlers
  const toggleFocusArea = (area) => {
    if (focusAreas.includes(area)) {
      setFocusAreas(focusAreas.filter(a => a !== area));
    } else {
      setFocusAreas([...focusAreas, area]);
    }
  };

  const handleAssistantSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side Validation
    const errors = {};
    if (!assistantCustomerName.trim()) errors.customer_name = "Customer name is required.";
    if (!assistantPackageName.trim()) errors.package_name = "Package name is required.";
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setFormErrors({});

    try {
      setSubmittingAssistant(true);
      const response = await processOrderBundle({
        customer_name: assistantCustomerName,
        package_name: assistantPackageName,
        facility_type: facilityType,
        facility_size: facilitySize,
        focus_areas: focusAreas,
        notes: assistantNotes
      });

      setGeneratedBundle(response.data);
      alert("Smart Facility package bundle generated and saved successfully!");
    } catch (error) {
      console.error("Error creating assistant bundle:", error);
      alert(error.response?.data?.message || "Failed to generate facility bundle");
    } finally {
      setSubmittingAssistant(false);
    }
  };

  const resetAssistant = () => {
    setAssistantCustomerName("");
    setAssistantPackageName("");
    setFacilityType("Hospitality");
    setFacilitySize("Medium");
    setFocusAreas([]);
    setAssistantNotes("");
    setGeneratedBundle(null);
    setFormErrors({});
  };

  const getImageUrl = (img) => {
    return img ? (img.startsWith("http") ? img : `${BACKEND_URL}${img}`) : "https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=500";
  };

  return (
    <div className="kit-builder">
      <h1>Cleaning Kit Package Builder</h1>
      <p className="kb-description">Design customized cleaning kits manually product-by-product, or let our automated wizard group facility-wise packages instantly.</p>

      {/* Navigation Tabs */}
      <div className="kb-tabs">
        <button
          className={`kb-tab-btn ${activeTab === "manual" ? "active" : ""}`}
          onClick={() => setActiveTab("manual")}
          type="button"
        >
          Manual Package Builder
        </button>
        <button
          className={`kb-tab-btn ${activeTab === "assistant" ? "active" : ""}`}
          onClick={() => setActiveTab("assistant")}
          type="button"
        >
          Smart Assistant Wizard
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "manual" ? (
        <>
          <SearchBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            placeholder="Search products..."
          />

          <FilterBar
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />

          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="products-grid">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.product_id}
                  image={getImageUrl(product.image)}
                  name={product.name}
                  category={product.category}
                  price={product.price}
                  stock={product.stock}
                  rating={product.rating}
                  addToCart={() => addToCart(product)}
                />
              ))}
            </div>
          )}

          <div className="cart-section card glass" style={{ marginTop: '30px', padding: '20px' }}>
            <h2>Selected Package Products</h2>

            {cart.length === 0 ? (
              <p style={{ color: '#6b7280', margin: '15px 0' }}>No products added to the package yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '15px 0' }}>
                {cart.map((item) => (
                  <CartItem
                    key={item.product_id}
                    image={getImageUrl(item.image)}
                    name={item.name}
                    price={item.price}
                    quantity={item.quantity}
                    increaseQuantity={() => increaseQuantity(item.product_id)}
                    decreaseQuantity={() => decreaseQuantity(item.product_id)}
                    removeItem={() => removeItem(item.product_id)}
                  />
                ))}
              </div>
            )}

            <div className="cart-total" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e5e7eb', paddingTop: '15px' }}>
              <h2>Total Price: ₹{totalPrice}</h2>
              {cart.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.5rem" }}>
                  <button className="btn-primary" onClick={() => setIsCheckoutOpen(true)}>
                    🛒 Save & Process Package
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={handleSaveKit}
                    disabled={savingKit}
                    style={{ background: "var(--bg-primary)", border: "2px solid var(--primary)", color: "var(--primary)", borderRadius: "8px", padding: "0.6rem 1rem", cursor: "pointer", fontWeight: 600, fontSize: "0.95rem" }}
                  >
                    {savingKit ? "💾 Saving..." : "💾 Save Kit"}
                  </button>
                  {savedKitLink && (
                    <div style={{ background: "#ecfdf5", border: "1px solid #10b981", borderRadius: "8px", padding: "0.75rem", fontSize: "0.85rem" }}>
                      <div style={{ color: "#065f46", fontWeight: 600, marginBottom: "0.4rem" }}>✅ Kit saved! Share it:</div>
                      <div style={{ wordBreak: "break-all", color: "#047857", fontSize: "0.8rem", marginBottom: "0.5rem" }}>{savedKitLink}</div>
                      <button
                        onClick={handleCopyKitLink}
                        style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: "6px", padding: "0.4rem 0.9rem", cursor: "pointer", fontWeight: 600, fontSize: "0.8rem" }}
                      >
                        📋 Copy Share Link
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Save Package / Checkout Modal */}
          <Modal
            isOpen={isCheckoutOpen}
            onClose={() => setIsCheckoutOpen(false)}
            title="Process Package Order"
          >
            <form onSubmit={handleCheckoutSubmit} className="modal-form">
              <div className="form-group">
                <label>Customer Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  placeholder="e.g. Hotel Paradise"
                />
              </div>

              <div className="form-group">
                <label>Package/Order Name</label>
                <input
                  type="text"
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                  required
                  placeholder="e.g. Premium Cleaning Kit - June"
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsCheckoutOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submittingOrder}>
                  {submittingOrder ? "Processing..." : "Place Order"}
                </button>
              </div>
            </form>
          </Modal>
        </>
      ) : (
        /* Smart Assistant Wizard Tab */
        <div className="smart-assistant-container">
          {!generatedBundle ? (
            <div className="assistant-card glass">
              <form onSubmit={handleAssistantSubmit} className="assistant-form">
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Customer Name <span style={{ color: 'red' }}>*</span></label>
                    <input
                      type="text"
                      value={assistantCustomerName}
                      onChange={(e) => setAssistantCustomerName(e.target.value)}
                      placeholder="e.g. Apollo Hospital"
                    />
                    {formErrors.customer_name && (
                      <span style={{ color: 'red', fontSize: '0.8rem' }}>{formErrors.customer_name}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Package / Order Name <span style={{ color: 'red' }}>*</span></label>
                    <input
                      type="text"
                      value={assistantPackageName}
                      onChange={(e) => setAssistantPackageName(e.target.value)}
                      placeholder="e.g. Healthcare Hygiene Bundle"
                    />
                    {formErrors.package_name && (
                      <span style={{ color: 'red', fontSize: '0.8rem' }}>{formErrors.package_name}</span>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Facility Type</label>
                    <select
                      value={facilityType}
                      onChange={(e) => setFacilityType(e.target.value)}
                    >
                      <option value="Healthcare">Healthcare / Clinic / Hospital</option>
                      <option value="Hospitality">Hospitality / Hotel / Restaurant</option>
                      <option value="Corporate">Corporate / Office Space</option>
                      <option value="Residential">Residential / Home Space</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Facility Scale (Product Quantities)</label>
                    <select
                      value={facilitySize}
                      onChange={(e) => setFacilitySize(e.target.value)}
                    >
                      <option value="Small">Small Facility (2x Qty Multiplier)</option>
                      <option value="Medium">Medium Facility (5x Qty Multiplier)</option>
                      <option value="Large">Large Facility (10x Qty Multiplier)</option>
                    </select>
                  </div>
                </div>

                {/* Focus Areas (Badges) */}
                <div>
                  <div className="focus-areas-label">Target Focus Areas (Optional - defaults to all for facility)</div>
                  <div className="focus-areas-grid">
                    <div
                      className={`focus-area-card ${focusAreas.includes("Floors") ? "active" : ""}`}
                      onClick={() => toggleFocusArea("Floors")}
                    >
                      <span className="focus-area-icon">🧹</span>
                      <span className="focus-area-name">Floors & Corridors</span>
                    </div>

                    <div
                      className={`focus-area-card ${focusAreas.includes("Glass") ? "active" : ""}`}
                      onClick={() => toggleFocusArea("Glass")}
                    >
                      <span className="focus-area-icon">🪟</span>
                      <span className="focus-area-name">Glass & Windows</span>
                    </div>

                    <div
                      className={`focus-area-card ${focusAreas.includes("Restrooms") ? "active" : ""}`}
                      onClick={() => toggleFocusArea("Restrooms")}
                    >
                      <span className="focus-area-icon">🚽</span>
                      <span className="focus-area-name">Restrooms & Bathrooms</span>
                    </div>

                    <div
                      className={`focus-area-card ${focusAreas.includes("Hand Hygiene") ? "active" : ""}`}
                      onClick={() => toggleFocusArea("Hand Hygiene")}
                    >
                      <span className="focus-area-icon">🧼</span>
                      <span className="focus-area-name">Hand Care & Hygiene</span>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Additional Notes / Directives</label>
                  <textarea
                    value={assistantNotes}
                    onChange={(e) => setAssistantNotes(e.target.value)}
                    placeholder="Enter special packing notes, delivery deadlines, or instructions."
                    rows="3"
                  />
                </div>

                <button
                  type="submit"
                  className="btn-large btn-large-primary"
                  disabled={submittingAssistant}
                  style={{ width: '100%', marginTop: '10px' }}
                >
                  {submittingAssistant ? "Analyzing Inventory & Generating..." : "Generate Smart Cleaning Package"}
                </button>
              </form>
            </div>
          ) : (
            /* Success Summary Receipt screen */
            <div className="success-summary">
              <div className="success-badge">✓</div>
              <h2>Package Generated Successfully!</h2>
              <p>The facility package has been auto-bundled, optimized for stock, and stored in the database.</p>

              <div className="receipt-card">
                <div className="receipt-header">
                  <div className="receipt-header-row">
                    <span>Order Serial:</span>
                    <strong>ORD{String(generatedBundle.order.order_id).padStart(3, '0')}</strong>
                  </div>
                  <div className="receipt-header-row">
                    <span>Client Name:</span>
                    <strong>{generatedBundle.order.customer_name}</strong>
                  </div>
                  <div className="receipt-header-row">
                    <span>Facility Type:</span>
                    <strong>{generatedBundle.order.facility_type} ({generatedBundle.order.facility_size})</strong>
                  </div>
                  <div className="receipt-header-row">
                    <span>Date Generated:</span>
                    <strong>{new Date(generatedBundle.order.created_at).toLocaleDateString("en-IN", { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                  </div>
                  <div className="receipt-title">
                    {generatedBundle.order.package_name}
                  </div>
                </div>

                <table className="receipt-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Quantity</th>
                      <th style={{ textAlign: 'right' }}>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {generatedBundle.items.map((item) => (
                      <tr key={item.id}>
                        <td>{item.product_name || `Product #${item.product_id}`}</td>
                        <td>{item.category || "General"}</td>
                        <td>{item.quantity} units</td>
                        <td style={{ textAlign: 'right' }}>₹{parseFloat(item.price) * item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="receipt-total-row">
                  <h3>Total Bundle Cost</h3>
                  <h3 className="amount">₹{generatedBundle.order.amount}</h3>
                </div>
              </div>

              <div className="success-actions">
                <button
                  onClick={resetAssistant}
                  className="btn-large btn-large-secondary"
                  type="button"
                >
                  Create Another Package
                </button>
                <Link
                  to={`/details/${generatedBundle.order.order_id}`}
                  className="btn-large btn-large-primary"
                  style={{ textDecoration: 'none', textAlign: 'center' }}
                >
                  View Order Timeline
                </Link>
                <Link
                  to="/dashboard"
                  className="btn-large btn-large-secondary"
                  style={{ textDecoration: 'none', textAlign: 'center' }}
                >
                  Go to Dashboard
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default KitBuilder;