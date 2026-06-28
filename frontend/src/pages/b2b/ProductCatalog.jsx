import { useEffect, useState } from "react";
import LoadingSpinner from "../../components/LoadingSpinner";
import { getProducts, createQuotation } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { FaBoxOpen, FaSearch, FaShoppingCart, FaTag, FaLayerGroup } from "react-icons/fa";
import "./ProductCatalog.css";

const BULK_TIERS = [
  { label: "Standard",  min: 1,   max: 9,   discount: 0 },
  { label: "Silver",    min: 10,  max: 49,  discount: 5 },
  { label: "Gold",      min: 50,  max: 99,  discount: 10 },
  { label: "Platinum",  min: 100, max: Infinity, discount: 15 },
];

function getTier(qty) {
  return BULK_TIERS.find(t => qty >= t.min && qty <= t.max) || BULK_TIERS[0];
}

function ProductCatalog() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [quantities, setQuantities] = useState({});
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await getProducts({ limit: 100 });
        const prods = res.data.products || res.data || [];
        setProducts(prods);
        const cats = [...new Set(prods.map(p => p.category))];
        setCategories(cats);
        const initQty = {};
        prods.forEach(p => { initQty[p.product_id] = 1; });
        setQuantities(initQty);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = products.filter(p => {
    const matchCat = category === "All" || p.category === category;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.description || "").toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const addToCart = (product, qty) => {
    setCart(prev => {
      const existing = prev.find(c => c.product_id === product.product_id);
      if (existing) {
        return prev.map(c => c.product_id === product.product_id ? { ...c, quantity: c.quantity + qty } : c);
      }
      return [...prev, { ...product, quantity: qty }];
    });
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(c => c.product_id !== id));

  const cartTotal = cart.reduce((s, c) => {
    const tier = getTier(c.quantity);
    return s + c.price * c.quantity * (1 - tier.discount / 100);
  }, 0);

  const handleSubmitQuote = async () => {
    if (cart.length === 0) {
      showToast("Your cart is empty. Add products first.", "error");
      return;
    }

    try {
      const payload = {
        customer_name: user?.name || "Customer",
        package_name: `Quote Request for ${cart.length} item(s)`,
        facility_type: "b2b",
        items: cart.map(item => ({
          product_id: item.product_id,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total_amount: cartTotal,
        notes: "Submitted via B2B Product Catalog"
      };

      await createQuotation(payload);

      showToast(`Quote submitted for ${cart.length} product(s) — ₹${Math.round(cartTotal).toLocaleString("en-IN")}. A salesperson will contact you within 24 hours.`, "success");
      setCart([]);
      setShowCart(false);
    } catch (err) {
      console.error("Failed to submit quote:", err);
      showToast("Failed to submit quote request. Please try again.", "error");
    }
  };

  const updateCartQty = (id, qty) => {
    setCart(prev => prev.map(c => c.product_id === id ? { ...c, quantity: Math.max(1, qty) } : c));
  };

  return (
    <div className="catalog-page">
      {/* Toast Notification */}
      {toast && (
        <div className={`catalog-toast catalog-toast--${toast.type}`}>
          <span>{toast.type === "success" ? "✅" : "⚠️"}</span>
          <span>{toast.message}</span>
        </div>
      )}
      <div className="catalog-header">
        <div>
          <h1><FaBoxOpen /> B2B Product Catalog</h1>
          <p>Browse institutional cleaning products with bulk pricing tiers</p>
        </div>
        <button className="btn-primary cart-btn" onClick={() => setShowCart(!showCart)}>
          <FaShoppingCart /> Cart ({cart.length}) · ₹{Math.round(cartTotal).toLocaleString("en-IN")}
        </button>
      </div>

      <div className="catalog-tiers card">
        <strong><FaTag /> Bulk Pricing Tiers</strong>
        <div className="tiers-row">
          {BULK_TIERS.map(t => (
            <div key={t.label} className={`tier-badge tier-${t.label.toLowerCase()}`}>
              <span className="tier-name">{t.label}</span>
              <span className="tier-range">{t.min}{t.max === Infinity ? "+" : `–${t.max}`} units</span>
              <span className="tier-disc">{t.discount > 0 ? `${t.discount}% off` : "List price"}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="catalog-controls">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="cat-filters">
          {["All", ...categories].map(c => (
            <button key={c} className={`cat-chip ${category === c ? "active" : ""}`} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="catalog-grid">
          {filtered.map(p => {
            const qty = quantities[p.product_id] || 1;
            const tier = getTier(qty);
            const discountedPrice = Math.round(p.price * (1 - tier.discount / 100));
            const inStock = p.stock > 0;
            return (
              <div key={p.product_id} className={`catalog-card card ${!inStock ? "oos" : ""}`}>
                <div className="catalog-img-area">
                  <FaBoxOpen className="catalog-img-icon" />
                  {!inStock && <span className="oos-badge">Out of Stock</span>}
                  {tier.discount > 0 && <span className="discount-badge">{tier.discount}% off</span>}
                </div>
                <div className="catalog-body">
                  <div className="catalog-category"><FaLayerGroup /> {p.category}</div>
                  <h3 className="catalog-name">{p.name}</h3>
                  <p className="catalog-desc">{p.description || "Premium cleaning product"}</p>
                  <div className="catalog-price-row">
                    {tier.discount > 0 ? (
                      <>
                        <span className="original-price">₹{p.price}</span>
                        <span className="bulk-price">₹{discountedPrice}</span>
                        <span className="tier-pill">{tier.label}</span>
                      </>
                    ) : (
                      <span className="bulk-price">₹{p.price}</span>
                    )}
                    <span className="per-unit">/ unit</span>
                  </div>
                  <div className="catalog-stock">Stock: {p.stock || 0} units</div>
                  <div className="catalog-actions">
                    <div className="qty-control">
                      <button onClick={() => setQuantities(q => ({ ...q, [p.product_id]: Math.max(1, (q[p.product_id] || 1) - 1) }))}>−</button>
                      <input type="number" min="1" value={qty}
                        onChange={e => setQuantities(q => ({ ...q, [p.product_id]: Math.max(1, parseInt(e.target.value) || 1) }))} />
                      <button onClick={() => setQuantities(q => ({ ...q, [p.product_id]: (q[p.product_id] || 1) + 1 }))}>+</button>
                    </div>
                    <button className="btn-primary add-btn" disabled={!inStock} onClick={() => addToCart(p, qty)}>
                      Add to Quote
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="catalog-empty"><FaBoxOpen /><p>No products match your search.</p></div>
          )}
        </div>
      )}

      {showCart && (
        <div className="cart-overlay">
          <div className="cart-panel card">
            <div className="cart-header">
              <h2><FaShoppingCart /> Quote Cart</h2>
              <button className="cart-close" onClick={() => setShowCart(false)}>×</button>
            </div>
            {cart.length === 0 ? (
              <p className="cart-empty">Your cart is empty. Add products from the catalog.</p>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map(c => {
                    const tier = getTier(c.quantity);
                    const discPrice = Math.round(c.price * (1 - tier.discount / 100));
                    return (
                      <div key={c.product_id} className="cart-item">
                        <div className="cart-item-info">
                          <span className="cart-item-name">{c.name}</span>
                          <span className="cart-item-tier">{tier.label} tier · {tier.discount}% off</span>
                        </div>
                        <div className="cart-item-qty">
                          <input type="number" min="1" value={c.quantity}
                            onChange={e => updateCartQty(c.product_id, parseInt(e.target.value) || 1)} />
                          <span className="cart-item-price">₹{(discPrice * c.quantity).toLocaleString("en-IN")}</span>
                          <button className="cart-remove" onClick={() => removeFromCart(c.product_id)}>×</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="cart-summary">
                  <div className="cart-total">
                    <strong>Total</strong>
                    <strong>₹{Math.round(cartTotal).toLocaleString("en-IN")}</strong>
                  </div>
                  <p className="cart-note">Bulk discounts applied. Final pricing subject to contract terms.</p>
                  <button className="btn-primary cart-submit" onClick={handleSubmitQuote}>
                    Request Quote
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductCatalog;
