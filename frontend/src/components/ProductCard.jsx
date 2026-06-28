import { FaHeart, FaRegHeart, FaEye } from "react-icons/fa";
import "./ProductCard.css";

function ProductCard({
  image,
  name,
  category,
  price,
  stock,
  rating,
  addToCart,
  isFavorite = false,
  onToggleFavorite,
  onQuickView,
  quantity,
  onIncrease,
  onDecrease,
}) {
  return (
    <div className="product-card">
      {/* Product Image Wrapper */}
      <div className="product-image" onClick={onQuickView} style={{ cursor: "pointer" }}>
        {quantity === 0 && (
          <span className="not-included-badge">Not included</span>
        )}
        <img
          src={image}
          alt={name}
        />
        {/* Heart icon overlay */}
        {onToggleFavorite && (
          <button 
            className="wishlist-btn" 
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            type="button"
            aria-label={isFavorite ? "Remove from wishlist" : "Add to wishlist"}
          >
            {isFavorite ? <FaHeart className="heart-filled" /> : <FaRegHeart className="heart-outline" />}
          </button>
        )}

        {/* Hover Quick View Overlay */}
        <div className="image-overlay">
          <FaEye className="quickview-icon" />
          <span>Quick View</span>
        </div>
      </div>

      {/* Product Details */}
      <div className="product-details">
        <span className="category" onClick={onQuickView} style={{ cursor: "pointer" }}>
          {category}
        </span>

        <h3 onClick={onQuickView} style={{ cursor: "pointer" }}>{name}</h3>

        <div className="price-stock">
          <h2>₹{price}</h2>
          <p className="stock">
            Stock: {stock}
          </p>
        </div>

        <div className="rating">
          ⭐ {rating || 4.5}
        </div>

        {addToCart ? (
          <button
            className="add-btn"
            onClick={(e) => {
              e.stopPropagation();
              addToCart();
            }}
            type="button"
          >
            Add to Package
          </button>
        ) : (
          <div className="product-qty-editor">
            <button 
              className="qty-btn"
              onClick={(e) => {
                e.stopPropagation();
                onDecrease();
              }}
              type="button"
            >-</button>
            <span className="qty-val">{quantity}</span>
            <button 
              className="qty-btn"
              onClick={(e) => {
                e.stopPropagation();
                onIncrease();
              }}
              type="button"
            >+</button>
            <div className="line-total">Total: ₹{price * quantity}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductCard;