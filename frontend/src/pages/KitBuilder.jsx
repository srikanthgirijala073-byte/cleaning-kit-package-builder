import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import SearchBar from "../components/SearchBar";
import FilterBar from "../components/FilterBar";
import CartItem from "../components/CartItem";
import Modal from "../components/Modal";
import LoadingSpinner from "../components/LoadingSpinner";
import { getProducts, createOrder, processOrderBundle, BACKEND_URL } from "../services/api";
import "./KitBuilder.css";

const USE_CASE_KITS = [
  {
    id: "hotel",
    name: "Hotel Cleaning Kit",
    description: "Room Freshener, Floor Cleaner, Toilet Cleaner, Glass Cleaner, Mop, Broom, Dustbin Liner, Housekeeping Trolley",
    items: [
      { key: "room_freshener", name: "Room Freshener", fallbackPrice: 280, defaultQty: 5, category: "Air Care", matchName: "Air Freshener" },
      { key: "floor_cleaner", name: "Floor Cleaner", fallbackPrice: 450, defaultQty: 10, category: "Floor Care", matchName: "Floor Cleaner" },
      { key: "toilet_cleaner", name: "Toilet Cleaner", fallbackPrice: 180, defaultQty: 8, category: "Bathroom Care", matchName: "Toilet" },
      { key: "glass_cleaner", name: "Glass Cleaner", fallbackPrice: 220, defaultQty: 6, category: "Glass Care", matchName: "Glass" },
      { key: "mop", name: "Mop", fallbackPrice: 850, defaultQty: 4, category: "Mopping Equipment", matchName: "Mop" },
      { key: "broom", name: "Broom", fallbackPrice: 320, defaultQty: 4, category: "Sweeping Equipment", matchName: "Broom" },
      { key: "dustbin_liner", name: "Dustbin Liner", fallbackPrice: 140, defaultQty: 12, category: "Waste Management", matchName: "Garbage" },
      { key: "housekeeping_trolley", name: "Housekeeping Trolley", fallbackPrice: 2500, defaultQty: 2, category: "Cleaning Equipment", matchName: "Trolley" }
    ]
  },
  {
    id: "office",
    name: "Office Cleaning Kit",
    description: "Multipurpose Cleaner, Glass Cleaner, Disinfectant Spray, Tissue Roll, Dustbin, Broom, Mop",
    items: [
      { key: "multipurpose_cleaner", name: "Multipurpose Cleaner", fallbackPrice: 299, defaultQty: 6, category: "Surface Cleaners", matchName: "Multi-Surface" },
      { key: "glass_cleaner", name: "Glass Cleaner", fallbackPrice: 220, defaultQty: 4, category: "Glass Care", matchName: "Glass" },
      { key: "disinfectant_spray", name: "Disinfectant Spray", fallbackPrice: 350, defaultQty: 5, category: "Disinfectants", matchName: "Disinfectant Spray" },
      { key: "tissue_roll", name: "Tissue Roll", fallbackPrice: 99, defaultQty: 20, category: "Paper Products", matchName: "Wipes" },
      { key: "dustbin", name: "Dustbin", fallbackPrice: 199, defaultQty: 5, category: "Waste Management", matchName: "Dustbin" },
      { key: "broom", name: "Broom", fallbackPrice: 320, defaultQty: 2, category: "Sweeping Equipment", matchName: "Broom" },
      { key: "mop", name: "Mop", fallbackPrice: 850, defaultQty: 2, category: "Mopping Equipment", matchName: "Mop" }
    ]
  },
  {
    id: "hospital",
    name: "Hospital Hygiene Kit",
    description: "Disinfectant (hospital-grade), Bleach Solution, Gloves, Apron, Sanitizer, Mop with color-coding, Biohazard Bag, MSDS Sheet reference",
    items: [
      { key: "disinfectant_hospital", name: "Disinfectant (hospital-grade)", fallbackPrice: 550, defaultQty: 15, category: "Disinfectants", matchName: "Disinfectant Spray" },
      { key: "bleach_solution", name: "Bleach Solution", fallbackPrice: 240, defaultQty: 8, category: "Chemicals", matchName: "Bleach" },
      { key: "gloves", name: "Gloves", fallbackPrice: 85, defaultQty: 25, category: "Safety Equipment", matchName: "Gloves" },
      { key: "apron", name: "Apron", fallbackPrice: 150, defaultQty: 10, category: "Safety Equipment", matchName: "Apron" },
      { key: "sanitizer", name: "Sanitizer", fallbackPrice: 199, defaultQty: 20, category: "Hygiene Products", matchName: "Sanitizer" },
      { key: "mop_color", name: "Mop with color-coding", fallbackPrice: 890, defaultQty: 6, category: "Mopping Equipment", matchName: "Mop" },
      { key: "biohazard_bag", name: "Biohazard Bag", fallbackPrice: 180, defaultQty: 15, category: "Waste Management", matchName: "Garbage" },
      { key: "msds_reference", name: "MSDS Sheet reference", fallbackPrice: 0, defaultQty: 1, category: "Documentation", matchName: "MSDS" }
    ]
  },
  {
    id: "school",
    name: "School Cleaning Kit",
    description: "Floor Cleaner, Toilet Cleaner, Dustbin Liners, Broom, Mop, Hand Wash, Sanitizer Dispenser",
    items: [
      { key: "floor_cleaner", name: "Floor Cleaner", fallbackPrice: 450, defaultQty: 8, category: "Floor Care", matchName: "Floor Cleaner" },
      { key: "toilet_cleaner", name: "Toilet Cleaner", fallbackPrice: 180, defaultQty: 10, category: "Bathroom Care", matchName: "Toilet" },
      { key: "dustbin_liners", name: "Dustbin Liners", fallbackPrice: 140, defaultQty: 15, category: "Waste Management", matchName: "Garbage" },
      { key: "broom", name: "Broom", fallbackPrice: 320, defaultQty: 5, category: "Sweeping Equipment", matchName: "Broom" },
      { key: "mop", name: "Mop", fallbackPrice: 850, defaultQty: 5, category: "Mopping Equipment", matchName: "Mop" },
      { key: "hand_wash", name: "Hand Wash", fallbackPrice: 175, defaultQty: 12, category: "Hygiene Products", matchName: "Hand Wash" },
      { key: "sanitizer_dispenser", name: "Sanitizer Dispenser", fallbackPrice: 650, defaultQty: 4, category: "Hygiene Products", matchName: "Sanitizer" }
    ]
  }
];

function KitBuilder() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  
  // Use Case selector state
  const [selectedUseCase, setSelectedUseCase] = useState("custom");
  const [skeletonLoading, setSkeletonLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Navigation Tabs State
  const [activeTab, setActiveTab] = useState("manual");

  // Checkout Modal State (Manual Builder)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [packageName, setPackageName] = useState("Custom Cleaning Kit");
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
  const [errors, setErrors] = useState({});
  const [formErrors, setFormErrors] = useState({});

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const loadUseCaseBundle = (useCaseId, productsList) => {
    if (useCaseId === "custom") {
      setCart([]);
      setPackageName("Custom Cleaning Kit");
      return;
    }
    const kit = USE_CASE_KITS.find(k => k.id === useCaseId);
    if (!kit) return;
    
    setPackageName(kit.name);
    
    const initializedItems = kit.items.map(item => {
      const dbMatch = productsList.find(p => 
        p.name.toLowerCase().includes(item.matchName.toLowerCase()) || 
        item.matchName.toLowerCase().includes(p.name.toLowerCase())
      );
      
      return {
        product_id: dbMatch ? dbMatch.product_id : `mock-${item.key}`,
        name: dbMatch ? dbMatch.name : item.name,
        price: dbMatch ? parseFloat(dbMatch.price) : item.fallbackPrice,
        category: dbMatch ? dbMatch.category : (item.category || "General"),
        image: dbMatch ? dbMatch.image : "",
        stock: dbMatch ? dbMatch.stock : 100,
        rating: dbMatch ? dbMatch.rating : 4.5,
        quantity: item.defaultQty,
        key: item.key,
        matchName: item.matchName
      };
    });
    
    setCart(initializedItems);
    
    // Clear validation errors on packageName
    setErrors(prev => {
      const copy = { ...prev };
      delete copy.packageName;
      return copy;
    });
  };

  const selectUseCase = (useCaseId) => {
    setSkeletonLoading(true);
    setSelectedUseCase(useCaseId);
    loadUseCaseBundle(useCaseId, products);
    setTimeout(() => {
      setSkeletonLoading(false);
    }, 300);
  };

  // ── Save Kit ──────────────────────────────────────────────────────────────
  const handleSaveKit = async () => {
    const kitName = packageName.trim();
    if (!kitName) {
      setErrors(prev => ({ ...prev, packageName: "Package name is required to save." }));
      showToast("Please enter a package name.", "error");
      return;
    }
    
    const activeCartItems = cart.filter(item => item.quantity > 0);
    if (activeCartItems.length === 0) {
      showToast("Please add at least one product with quantity > 0.", "error");
      return;
    }

    try {
      setSavingKit(true);
      const payload = {
        kit_name: kitName,
        customer_name: customerName || "B2B Client",
        facility_type: selectedUseCase,
        items: activeCartItems.map(item => ({
          product_id: typeof item.product_id === "string" && item.product_id.startsWith("mock-") ? 1 : item.product_id,
          name: item.name,
          price: item.price,
          category: item.category,
          quantity: item.quantity
        })),
        total_amount: totalPrice
      };

      const res = await saveB2bKit(payload);
      const shareToken = res.data.share_token;
      
      const shareUrl = `${window.location.origin}/kit-builder?shared=${shareToken}`;
      setSavedKitLink(shareUrl);
      showToast("Package saved on server successfully!");
      
      // Auto-copy to clipboard
      navigator.clipboard.writeText(shareUrl).then(() => {
        showToast("Link copied to clipboard!");
      }).catch(() => {});
    } catch (err) {
      console.error("Save kit error:", err);
      showToast("Failed to save kit on server.", "error");
    } finally {
      setSavingKit(false);
    }
  };

  const handleCopyKitLink = () => {
    if (!savedKitLink) {
      showToast("No shareable link generated yet.", "error");
      return;
    }
    navigator.clipboard.writeText(savedKitLink).then(() => {
      showToast("Link copied to clipboard!");
    }).catch(() => {
      prompt("Copy this link:", savedKitLink);
    });
  };

  const fetchProductsForBuilder = async () => {
    try {
      setLoading(true);
      const response = await getProducts({ limit: 100 });
      const prods = response.data.products;
      setProducts(prods);
      if (response.data.categories) {
        setCategories(response.data.categories);
      }
      
      // Parse shared link config if present
      const params = new URLSearchParams(window.location.search);
      const sharedParam = params.get("shared");
      const useCaseParam = params.get("useCase");
      const nameParam = params.get("name");
      const itemsParam = params.get("items");

      if (sharedParam) {
        try {
          const res = await getSharedKit(sharedParam);
          const kit = res.data;
          setPackageName(kit.kit_name || kit.name);
          setSelectedUseCase(kit.facility_type || "custom");
          
          let parsedItems = [];
          if (typeof kit.items === "string") {
            parsedItems = JSON.parse(kit.items);
          } else if (Array.isArray(kit.items)) {
            parsedItems = kit.items;
          }

          const initialized = parsedItems.map(item => {
            const dbMatch = prods.find(p => p.product_id === item.product_id || p.name.toLowerCase() === item.name.toLowerCase());
            return {
              product_id: dbMatch ? dbMatch.product_id : item.product_id,
              name: dbMatch ? dbMatch.name : item.name,
              price: dbMatch ? parseFloat(dbMatch.price) : parseFloat(item.price || 0),
              category: dbMatch ? dbMatch.category : (item.category || "General"),
              image: dbMatch ? dbMatch.image : "",
              quantity: item.quantity,
            };
          });
          setCart(initialized);
          setSavedKitLink(`${window.location.origin}/kit-builder?shared=${sharedParam}`);
        } catch (err) {
          console.error("Shared kit load error:", err);
          showToast("Failed to load shared kit.", "error");
        }
      } else if (useCaseParam) {
        setSelectedUseCase(useCaseParam);
        if (nameParam) setPackageName(nameParam);
        
        if (useCaseParam === "custom") {
          // Custom manual builder from shared link
          if (itemsParam) {
            const qtyMap = {};
            itemsParam.split(",").forEach(pair => {
              const [k, q] = pair.split(":");
              if (k && q) qtyMap[k] = parseInt(q) || 0;
            });
            const initialized = prods.filter(p => qtyMap[p.product_id] !== undefined).map(p => ({
              product_id: p.product_id,
              name: p.name,
              category: p.category,
              price: parseFloat(p.price),
              image: p.image,
              quantity: qtyMap[p.product_id]
            }));
            setCart(initialized);
          }
        } else {
          // Pre-defined use-case from shared link
          const kit = USE_CASE_KITS.find(k => k.id === useCaseParam);
          if (kit) {
            const qtyMap = {};
            if (itemsParam) {
              itemsParam.split(",").forEach(pair => {
                const [k, q] = pair.split(":");
                if (k && q) qtyMap[k] = parseInt(q) || 0;
              });
            }
            
            const newCart = kit.items.map(item => {
              const qty = qtyMap[item.key] !== undefined ? qtyMap[item.key] : item.defaultQty;
              const dbMatch = prods.find(p => p.name.toLowerCase().includes(item.matchName.toLowerCase()) || item.matchName.toLowerCase().includes(p.name.toLowerCase()));
              return {
                product_id: dbMatch ? dbMatch.product_id : `mock-${item.key}`,
                name: dbMatch ? dbMatch.name : item.name,
                price: dbMatch ? parseFloat(dbMatch.price) : item.fallbackPrice,
                category: dbMatch ? dbMatch.category : (item.category || "General"),
                image: dbMatch ? dbMatch.image : "",
                stock: dbMatch ? dbMatch.stock : 100,
                rating: dbMatch ? dbMatch.rating : 4.5,
                quantity: qty,
                key: item.key,
                matchName: item.matchName
              };
            });
            setCart(newCart);
          }
        }
      } else {
        // Default to custom (empty cart)
        selectUseCase("custom");
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

  const filteredCart = cart.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" ||
      item.category === selectedCategory;

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
    showToast("Product added to package!");
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
        .map((item) => {
          if (item.product_id === id) {
            const newQty = item.quantity - 1;
            return {
              ...item,
              quantity: Math.max(0, newQty),
            };
          }
          return item;
        })
        .filter((item) => selectedUseCase !== "custom" ? true : item.quantity > 0)
    );
  };

  const removeItem = (id) => {
    setCart(cart.filter((item) => item.product_id !== id));
  };

  const totalPrice = cart.reduce(
    (sum, item) => sum + parseFloat(item.price) * item.quantity,
    0
  );

  const gstAmount = totalPrice * 0.18;
  const grandTotal = totalPrice + gstAmount;

  const totalQuantity = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      showToast("Please add products to your package first.", "error");
      return;
    }

    const kitName = packageName.trim();
    const custName = customerName.trim();
    
    let errs = {};
    if (!kitName) errs.packageName = "Package name is required.";
    if (!custName) errs.customerName = "Customer name is required.";
    
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    try {
      setSubmittingOrder(true);
      const activeCartItems = cart.filter(item => item.quantity > 0);
      const orderData = {
        customer_name: custName,
        package_name: kitName,
        quantity: totalQuantity,
        amount: totalPrice,
        status: "Pending",
        items: activeCartItems.map(item => ({
          product_id: typeof item.product_id === "string" && item.product_id.startsWith("mock-") ? 1 : item.product_id,
          quantity: item.quantity,
          price: item.price
        }))
      };

      const res = await createOrder(orderData);
      const orderId = res.data?.order_id || res.data?.id;
      showToast(`Order placed successfully! Order ID: ${orderId}`);
      setCart([]);
      setCustomerName("");
      setIsCheckoutOpen(false);
    } catch (error) {
      console.error("Error creating package order:", error);
      showToast("Failed to place order: " + (error.response?.data?.message || error.message), "error");
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
      showToast("Smart Facility package bundle generated and saved successfully!");
    } catch (error) {
      console.error("Error creating assistant bundle:", error);
      showToast(error.response?.data?.message || "Failed to generate facility bundle", "error");
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

  const handleCustomerNameChange = (val) => {
    setCustomerName(val);
    setErrors(prev => {
      const copy = { ...prev };
      delete copy.customerName;
      return copy;
    });
  };

  const handlePackageNameChange = (val) => {
    setPackageName(val);
    setErrors(prev => {
      const copy = { ...prev };
      delete copy.packageName;
      return copy;
    });
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="kit-builder">
      {/* Toast notifications */}
      {toast && (
        <div className={`toast-message ${toast.type}`}>
          {toast.message}
        </div>
      )}

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
          {/* Use Case Selector */}
          <div className="use-case-section">
            <h3 style={{ marginBottom: "16px" }}>Select Use-Case Kit Bundle</h3>
            <div className="use-case-grid">
              {USE_CASE_KITS.map(kit => (
                <div 
                  key={kit.id}
                  className={`use-case-card ${selectedUseCase === kit.id ? "active" : ""}`}
                  onClick={() => selectUseCase(kit.id)}
                >
                  <div className="use-case-icon">
                    {kit.id === "hotel" && "🏨"}
                    {kit.id === "office" && "🏢"}
                    {kit.id === "hospital" && "🏥"}
                    {kit.id === "school" && "🏫"}
                  </div>
                  <h4>{kit.name}</h4>
                  <p>{kit.description}</p>
                </div>
              ))}
              <div 
                className={`use-case-card ${selectedUseCase === "custom" ? "active" : ""}`}
                onClick={() => selectUseCase("custom")}
              >
                <div className="use-case-icon">🔧</div>
                <h4>Custom Kit</h4>
                <p>Select products manually from the catalog.</p>
              </div>
            </div>
          </div>

          <div className="kb-workspace-layout">
            <div className="kb-workspace-main">
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

              {loading || skeletonLoading ? (
                <div className="products-grid">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="skeleton-card">
                      <div className="skeleton-image shinny"></div>
                      <div className="skeleton-details">
                        <div className="skeleton-line skeleton-category shinny"></div>
                        <div className="skeleton-line skeleton-title shinny"></div>
                        <div className="skeleton-line skeleton-price shinny"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : selectedUseCase === "custom" ? (
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
              ) : (
                <div className="products-grid">
                  {filteredCart.map((item) => (
                    <div key={item.product_id} className={`product-card-wrapper ${item.quantity === 0 ? "not-included" : ""}`}>
                      <ProductCard
                        image={getImageUrl(item.image)}
                        name={item.name}
                        category={item.category}
                        price={item.price}
                        stock={item.stock}
                        rating={item.rating}
                        addToCart={null}
                        quantity={item.quantity}
                        onIncrease={() => increaseQuantity(item.product_id)}
                        onDecrease={() => decreaseQuantity(item.product_id)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="kb-workspace-sidebar">
              <div className="cart-section card glass" style={{ marginTop: '0', padding: '24px' }}>
                <h2>Package Summary</h2>
                
                <div style={{ marginTop: "15px", marginBottom: "15px" }} className="form-group">
                  <label style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-secondary)" }}>Package Name *</label>
                  <input
                    type="text"
                    value={packageName}
                    onChange={(e) => handlePackageNameChange(e.target.value)}
                    placeholder="e.g. My Custom Kit"
                    className={errors.packageName ? "error-border" : ""}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "8px",
                      border: errors.packageName ? "2px solid var(--danger)" : "1px solid var(--border)",
                      marginTop: "5px"
                    }}
                  />
                  {errors.packageName && (
                    <span style={{ color: "var(--danger)", fontSize: "0.8rem", marginTop: "4px", display: "block" }}>{errors.packageName}</span>
                  )}
                </div>

                {cart.filter(item => item.quantity > 0).length === 0 ? (
                  <p style={{ color: '#6b7280', margin: '15px 0' }}>No products added to the package yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '15px 0', maxHeight: '300px', overflowY: 'auto' }}>
                    {cart.filter(item => item.quantity > 0).map((item) => (
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

                <div className="price-summary-box" style={{ borderTop: '1px solid #e5e7eb', paddingTop: '15px', marginTop: '15px' }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span>Subtotal:</span>
                    <strong>₹{totalPrice}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span>GST (18%):</span>
                    <strong>₹{Math.round(gstAmount)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", fontSize: "1.2rem", color: "var(--primary)", borderTop: "1px dashed #cbd5e1", paddingTop: "8px" }}>
                    <span>Grand Total:</span>
                    <strong>₹{Math.round(grandTotal)}</strong>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <button 
                      className="btn-primary" 
                      onClick={() => setIsCheckoutOpen(true)}
                      disabled={cart.filter(item => item.quantity > 0).length === 0}
                    >
                      🛒 Place Order
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={handleSaveKit}
                      disabled={savingKit || !packageName.trim() || cart.filter(item => item.quantity > 0).length === 0}
                      style={{ background: "var(--bg-primary)", border: "2px solid var(--primary)", color: "var(--primary)", borderRadius: "8px", padding: "0.6rem 1rem", cursor: "pointer", fontWeight: 600, fontSize: "0.95rem" }}
                    >
                      {savingKit ? "💾 Saving..." : "💾 Save Package"}
                    </button>
                    {savedKitLink && (
                      <div style={{ background: "#ecfdf5", border: "1px solid #10b981", borderRadius: "8px", padding: "0.75rem", fontSize: "0.85rem" }}>
                        <div style={{ color: "#065f46", fontWeight: 600, marginBottom: "0.4rem" }}>✅ Package saved! Share it:</div>
                        <button
                          onClick={handleCopyKitLink}
                          style={{ width: "100%", background: "#10b981", color: "#fff", border: "none", borderRadius: "6px", padding: "0.5rem", cursor: "pointer", fontWeight: 600, fontSize: "0.8rem" }}
                        >
                          📋 Copy Share Link
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quotation Summary Section */}
          {cart.filter(item => item.quantity > 0).length > 0 && (
            <div className="quotation-summary-section card glass" style={{ marginTop: '40px', padding: '24px' }}>
              <h2 style={{ marginBottom: '24px' }}>
                Quotation for {selectedUseCase === "custom" ? "Custom Cleaning Kit" : USE_CASE_KITS.find(k => k.id === selectedUseCase)?.name} – Ganga Maxx Marketplace
              </h2>
              
              <table className="quotation-summary-table" style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--border)", textAlign: "left" }}>
                    <th style={{ padding: "12px 8px" }}>Product Name</th>
                    <th style={{ padding: "12px 8px" }}>Qty</th>
                    <th style={{ padding: "12px 8px" }}>Unit Price</th>
                    <th style={{ padding: "12px 8px" }}>Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.filter(item => item.quantity > 0).map((item) => (
                    <tr key={item.product_id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px 8px" }}>{item.name}</td>
                      <td style={{ padding: "12px 8px" }}>{item.quantity}</td>
                      <td style={{ padding: "12px 8px" }}>₹{item.price}</td>
                      <td style={{ padding: "12px 8px" }}>₹{item.price * item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3" style={{ padding: "12px 8px", textAlign: "right" }}><strong>Subtotal:</strong></td>
                    <td style={{ padding: "12px 8px" }}>₹{totalPrice}</td>
                  </tr>
                  <tr>
                    <td colSpan="3" style={{ padding: "12px 8px", textAlign: "right" }}><strong>GST @18%:</strong></td>
                    <td style={{ padding: "12px 8px" }}>₹{Math.round(gstAmount)}</td>
                  </tr>
                  <tr className="grand-total-row">
                    <td colSpan="3" style={{ padding: "12px 8px", textAlign: "right", fontSize: "1.1rem" }}><strong>Grand Total:</strong></td>
                    <td style={{ padding: "12px 8px", fontSize: "1.1rem", color: "var(--primary)" }}><strong>₹{Math.round(grandTotal)}</strong></td>
                  </tr>
                </tfoot>
              </table>
              
              <div className="quotation-actions" style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
                <button className="btn-primary" onClick={handleExportPDF}>
                  📄 Export PDF
                </button>
                <a 
                  href={`https://wa.me/919876543210?text=${encodeURIComponent(`I want to inquire about ${packageName || "Custom"} Cleaning Kit`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-whatsapp"
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  💬 WhatsApp Inquiry
                </a>
              </div>
            </div>
          )}

          {/* Hidden Printable Invoice Section for PDF Export */}
          <div className="printable-invoice">
            <div className="invoice-header">
              <h1>Ganga Maxx Marketplace</h1>
              <h2>B2B Cleaning Supply Quotation</h2>
            </div>
            <hr />
            <div className="invoice-details">
              <p><strong>Kit Name:</strong> {packageName || "Custom Cleaning Kit"}</p>
              <p><strong>Use-Case:</strong> {selectedUseCase === "custom" ? "Custom (Manual)" : USE_CASE_KITS.find(k => k.id === selectedUseCase)?.name}</p>
              <p><strong>Date:</strong> {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
            </div>
            <table className="invoice-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {cart.filter(item => item.quantity > 0).map((item) => (
                  <tr key={item.product_id}>
                    <td>{item.name}</td>
                    <td>{item.quantity}</td>
                    <td>₹{item.price}</td>
                    <td>₹{item.price * item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="invoice-summary">
              <p><strong>Subtotal:</strong> ₹{totalPrice}</p>
              <p><strong>GST (18%):</strong> ₹{Math.round(gstAmount)}</p>
              <p><strong>Grand Total:</strong> ₹{Math.round(grandTotal)}</p>
            </div>
            <div className="invoice-footer">
              <p>Thank you for choosing Ganga Maxx Marketplace. For inquiries, contact support.</p>
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
                <label>Customer Name *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => handleCustomerNameChange(e.target.value)}
                  placeholder="e.g. Hotel Paradise"
                  className={errors.customerName ? "error-border" : ""}
                />
                {errors.customerName && (
                  <span className="error-message" style={{ color: "var(--danger)", fontSize: "0.8rem", marginTop: "4px" }}>{errors.customerName}</span>
                )}
              </div>

              <div className="form-group">
                <label>Package/Order Name *</label>
                <input
                  type="text"
                  value={packageName}
                  onChange={(e) => handlePackageNameChange(e.target.value)}
                  placeholder="e.g. Premium Cleaning Kit - June"
                  className={errors.packageName ? "error-border" : ""}
                />
                {errors.packageName && (
                  <span className="error-message" style={{ color: "var(--danger)", fontSize: "0.8rem", marginTop: "4px" }}>{errors.packageName}</span>
                )}
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsCheckoutOpen(false)}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={submittingOrder || Object.keys(errors).length > 0 || !packageName.trim() || !customerName.trim()}
                >
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