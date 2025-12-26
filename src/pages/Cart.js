import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import "./Cart.css";

function Cart() {
  const { cartItems, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();

  const handleQuantityChange = (itemId, newQuantity) => {
    updateQuantity(itemId, parseInt(newQuantity, 10) || 1);
  };

  const handleCheckout = () => {
    // Implement checkout logic here
    alert("Proceeding to checkout!");
  };

  if (cartItems.length === 0) {
    return (
      <div className="cart-empty">
        <div className="empty-cart-icon">
          <i className="fa-solid fa-cart-shopping"></i>
        </div>
        <h2>Your cart is empty</h2>
        <p>Looks like you haven't added any items to your cart yet.</p>
        <Link to="/" className="btn btn-primary">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1 className="cart-title">Shopping Cart</h1>
      
      <div className="cart-container">
        <div className="cart-items">
          {cartItems.map((item) => (
            <div className="cart-item" key={item._id}>
              <Link to={`/itemdetail/${item._id}`} className="cart-item-link">
                <div className="cart-item-image">
                  <img src={item.Item_Images} alt={item.Item_Name} />
                </div>
              </Link>
              
              <div className="cart-item-details">
                <Link to={`/itemdetail/${item._id}`}>
                  <h3 className="cart-item-title">{item.Item_Name}</h3>
                </Link>
                <p className="cart-item-category">
                  {item.Item_Category?.catagory_Name || "Other"}
                </p>
                <p className="cart-item-description">
                  {item.Item_Description?.substring(0, 100)}...
                </p>
                
                <div className="cart-item-actions">
                  <div className="quantity-selector">
                    <button 
                      onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                      className="quantity-btn"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item._id, e.target.value)}
                      className="quantity-input"
                    />
                    <button 
                      onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                      className="quantity-btn"
                    >
                      +
                    </button>
                  </div>
                  
                  <div className="cart-item-price">
                    ${(item.Item_Price * item.quantity).toLocaleString()}
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => removeFromCart(item._id)}
                className="remove-item-btn"
                title="Remove item"
              >
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
          ))}
        </div>
        
        <div className="cart-summary">
          <h2>Order Summary</h2>
          
          <div className="summary-row">
            <span>Subtotal</span>
            <span>${getCartTotal().toLocaleString()}</span>
          </div>
          
          <div className="summary-row">
            <span>Shipping</span>
            <span>Calculated at checkout</span>
          </div>
          
          <div className="summary-row total">
            <span>Total</span>
            <span>${getCartTotal().toLocaleString()}</span>
          </div>
          
          <button 
            onClick={handleCheckout}
            className="checkout-btn"
          >
            Proceed to Checkout
          </button>
          
          <button 
            onClick={clearCart}
            className="clear-cart-btn"
          >
            Clear Cart
          </button>
          
          <Link to="/" className="continue-shopping">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Cart;