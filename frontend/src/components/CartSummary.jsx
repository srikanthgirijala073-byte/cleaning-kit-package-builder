import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/helpers';

function CartSummary() {
  const { cartTotal, cartCount } = useCart();

  return (
    <div className="cart-summary card">
      <h3>Cart Summary</h3>
      <div className="summary-row">
        <span>Items ({cartCount})</span>
        <span>{formatCurrency(cartTotal)}</span>
      </div>
      <div className="summary-row">
        <span>Tax (18% GST)</span>
        <span>{formatCurrency(cartTotal * 0.18)}</span>
      </div>
      <div className="summary-divider" />
      <div className="summary-row total">
        <span>Total</span>
        <span>{formatCurrency(cartTotal * 1.18)}</span>
      </div>
    </div>
  );
}

export default CartSummary;
