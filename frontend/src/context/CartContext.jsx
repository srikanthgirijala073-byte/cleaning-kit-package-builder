import { createContext, useContext, useEffect, useState } from "react";

// Create Context
const CartContext = createContext();

// Provider Component
export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem("cartItems");

    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  // Save cart whenever it changes
  useEffect(() => {
    localStorage.setItem(
      "cartItems",
      JSON.stringify(cartItems)
    );
  }, [cartItems]);

  // =========================
  // Add Item
  // =========================
  const addToCart = (product) => {
    const existingItem = cartItems.find(
      (item) => item.id === product.id
    );

    if (existingItem) {
      setCartItems(
        cartItems.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        )
      );
    } else {
      setCartItems([
        ...cartItems,
        {
          ...product,
          quantity: 1,
        },
      ]);
    }
  };

  // =========================
  // Remove Item
  // =========================
  const removeFromCart = (id) => {
    setCartItems(
      cartItems.filter((item) => item.id !== id)
    );
  };

  // =========================
  // Increase Quantity
  // =========================
  const increaseQuantity = (id) => {
    setCartItems(
      cartItems.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      )
    );
  };

  // =========================
  // Decrease Quantity
  // =========================
  const decreaseQuantity = (id) => {
    setCartItems(
      cartItems
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  // =========================
  // Clear Cart
  // =========================
  const clearCart = () => {
    setCartItems([]);
  };

  // =========================
  // Total Items
  // =========================
  const totalItems = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  // =========================
  // Total Price
  // =========================
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        increaseQuantity,
        decreaseQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Custom Hook
export const useCart = () => {
  return useContext(CartContext);
};

export default CartContext;