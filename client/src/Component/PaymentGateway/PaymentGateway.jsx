import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import { setcurrentuser } from "../../action/currentuser";
import "./PaymentGateway.css";

function Payment() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentuser = useSelector((state) => state.currentuserreducer);
  const [message, setMessage] = useState("");
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [checkboxChecked, setCheckboxChecked] = useState(false);

  useEffect(() => {
    if (!state || !state.tier || !state.amount || !state.email) {
      setMessage("Invalid payment request");
      navigate("/");
      return;
    }

    // Dynamically load Razorpay script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      console.log("Razorpay SDK loaded successfully");
      setRazorpayLoaded(true);
    };
    script.onerror = () => {
      console.error("Failed to load Razorpay SDK");
      setMessage("Failed to load payment gateway");
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [state, navigate]);

  const handleCheckboxClick = (e) => {
    setCheckboxChecked(e.target.checked);
  };

  const loadRazorpay = () => {
    if (!currentuser) {
      setMessage("Please sign in to proceed with payment");
      return;
    }

    if (!razorpayLoaded) {
      setMessage("Payment gateway is loading, please wait...");
      return;
    }

    fetch("http://localhost:5000/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: state.amount / 100 }), // Amount in paise
    })
      .then((res) => res.json())
      .then((order) => {
        if (!window.Razorpay) {
          setMessage("Razorpay SDK not loaded");
          console.error("window.Razorpay is undefined");
          return;
        }

        const options = {
          key: "rzp_live_nkIz2AeHKHH7n5", // Replace with your Razorpay key ID
          amount: order.amount / 1000,
          currency: order.currency,
          name: "Your Tube",
          description: `Subscription to ${state.tier}`,
          order_id: order.id,
          handler: async function (response) {
            try {
              const upgradeResponse = await axios.post(
                "http://localhost:5000/subscriptions/upgrade-tier",
                { email: state.email, tier: state.tier },
                { headers: { Authorization: `Bearer ${currentuser.token}` } }
              );
              const { user, token } = upgradeResponse.data;
              // Update both Profile and authToken in localStorage
              localStorage.setItem(
                "Profile",
                JSON.stringify({
                  username: user.email.split("@")[0],
                  token,
                  email: user.email,
                  subscriptionTier: user.subscriptionTier,
                })
              );
              localStorage.setItem("authToken", token); // Update authToken
              dispatch(
                setcurrentuser({
                  username: user.email.split("@")[0],
                  token,
                  email: user.email,
                  subscriptionTier: user.subscriptionTier,
                })
              );
              setMessage(`Payment Successful! Upgraded to ${state.tier}`);
              alert("Successfully upgraded!");
              setTimeout(() => navigate("/"), 2000); // Redirect after 2 seconds
            } catch (error) {
              setMessage(
                "Payment succeeded but upgrade failed: " +
                  (error.response?.data?.error || error.message)
              );
              console.error("Upgrade error:", error);
            }
          },
          prefill: {
            name: currentuser.username,
            email: currentuser.email,
            contact: currentuser.email.split("@")[0], // Adjust as needed
          },
          theme: {
            color: "#3399cc",
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", function (response) {
          setMessage(`Payment failed: ${response.error.description}`);
          console.error("Payment failed:", response.error);
        });
        rzp.open();
      })
      .catch((error) => {
        setMessage("Error creating order: " + error.message);
        console.error("Order creation error:", error);
      });
  };

  return (
    <div className="payment-page">
      <div className="payment-container">
        <h1>Payment for {state?.tier} Subscription</h1>
        {message ? (
          <p>{message}</p>
        ) : (
          <>
            <div className="payment-summary">
              <h2>Payment Summary</h2>
              <p>
                <strong>Plan:</strong> {state?.tier}
              </p>
              <p>
                <strong>Amount:</strong> ₹{(state?.amount / 100).toFixed(2)} /
                month
              </p>
              <p>
                <strong>Billing Cycle:</strong> Monthly (Auto-renewal)
              </p>
              <p className="save-note">
                You save 10% by choosing an annual plan! (Coming soon)
              </p>
            </div>
            <div className="benefits-preview">
              <h2>Benefits of {state?.tier}</h2>
              <ul>
                {state?.tier === "Silver" && (
                  <>
                    <li>Watch up to 10 minutes of videos</li>
                    <li>Priority access to new content</li>
                    <li>Unlimited channel subscriptions</li>
                  </>
                )}
                {state?.tier === "Gold" && (
                  <>
                    <li>Watch full videos without restrictions</li>
                    <li>Exclusive content access</li>
                    <li>Unlimited channel subscriptions</li>
                    <li>Priority support</li>
                  </>
                )}
              </ul>
            </div>
            <div className="confirmation-section">
              <label>
                <input type="checkbox" required onClick={handleCheckboxClick} />
                I agree to the{" "}
                <a href="/terms" target="_blank">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="/privacy" target="_blank">
                  Privacy Policy
                </a>
              </label>
              <p className="note">
                This is a secure transaction. You will receive a confirmation
                email after payment.
              </p>
              {checkboxChecked && (
                <button
                  onClick={loadRazorpay}
                  className="payment-button"
                  disabled={!razorpayLoaded}
                >
                  Proceed to Pay ₹{(state?.amount / 100).toFixed(2)}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Payment;
