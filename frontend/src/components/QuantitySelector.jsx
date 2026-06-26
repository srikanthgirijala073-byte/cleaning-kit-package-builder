import "./QuantitySelector.css";

function QuantitySelector({
  quantity,
  increaseQuantity,
  decreaseQuantity,
}) {
  return (
    <div className="quantity-selector">
      <button
        className="quantity-btn"
        onClick={decreaseQuantity}
      >
        -
      </button>

      <span className="quantity-value">
        {quantity}
      </span>

      <button
        className="quantity-btn"
        onClick={increaseQuantity}
      >
        +
      </button>
    </div>
  );
}

export default QuantitySelector;