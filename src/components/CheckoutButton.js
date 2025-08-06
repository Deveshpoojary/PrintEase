// CheckoutButton.js
import React from "react";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe("pk_test_51RpUezGpLMJ2tSshsofGbkLrh9nHjZeyjwnpj8ao86PRzOzRiPEAK3PIFpsKzZgpUY0BJbT77g5vxB0f6OLQnOrw003O61CcJi"); // Replace with your test publishable key

const CheckoutButton = () => {
  const handleCheckout = async () => {
    const response = await fetch("http://localhost:5000/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: 100, // ₹100
        name: "Demo Product",
      }),
    });

    const data = await response.json();
    const stripe = await stripePromise;

    const result = await stripe.redirectToCheckout({
      sessionId: data.sessionId,
    });

    if (result.error) {
      alert(result.error.message);
    }
  };

  return (
    <button onClick={handleCheckout} className="checkout-button">
      100% Secure Checkout - Pay ₹100
    </button>
  );
};

export default CheckoutButton;
