import "./CartItem.css";

function CartItem({
  image,
  name,
  price,
  quantity,
  increaseQuantity,
  decreaseQuantity,
  removeItem,
}) {
  return (
    <div className="cart-item">

      <div className="cart-image">
        <img src={image} alt={name} />
      </div>

      <div className="cart-details">
        <h3>{name}</h3>
        <p>Price: ₹{price}</p>

        <div className="quantity-controls">
          <button onClick={decreaseQuantity}>-</button>

          <span>{quantity}</span>

          <button onClick={increaseQuantity}>+</button>
        </div>

        <h4>Total: ₹{price * quantity}</h4>

        <button
          className="remove-btn"
          onClick={removeItem}
        >
          Remove Item
        </button>
      </div>

    </div>
  );
}

export default CartItem;