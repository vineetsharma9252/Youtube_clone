import React from "react";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { setcurrentuser } from "../../action/currentuser";
import "./SubscriptionTiers.css";

const SubscriptionTiers = () => {
  const currentuser = useSelector((state) => state.currentuserreducer);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const tiers = [
    {
      name: "free",
      description: "Free access with limited features",
      benefits: ["No amount to provide"],
      price: "₹0/month",
    },
    {
      name: "Bronze",
      description: "Free access with limited features.",
      benefits: [
        "Watch up to 5 minutes of videos",
        "Access to standard content",
        "Limited channel subscriptions",
      ],
      price: "₹10/month",
    },
    {
      name: "Silver",
      description: "Enhanced access for casual viewers.",
      benefits: [
        "Watch up to 10 minutes of videos",
        "Priority access to new content",
        "Unlimited channel subscriptions",
      ],
      price: "₹50/month",
    },
    {
      name: "Gold",
      description: "Premium access for avid users.",
      benefits: [
        "Watch full videos without restrictions",
        "Exclusive content access",
        "Unlimited channel subscriptions",
        "Priority support",
      ],
      price: "₹70/month",
    },
  ];

  const handleUpgradeTier = async (tier) => {
    if (!currentuser) {
      alert("Please sign in to upgrade");
      return;
    }
    if (currentuser.subscriptionTier === tier) {
      alert("You are already enrolled in this plan");
      return;
    }
    // Extract amount from price (remove ₹ and /month)
    const amount =
      parseInt(tier.replace("₹", "").replace("/month", "").trim()) * 100; // Convert to paise

    console.log("Selected tier:", tier, "Amount in paise:", amount);
    if (amount > 0) {
      // Navigate to payment page with tier details
      navigate("/payment", { state: { tier, amount } });
    } else {
      // Handle free tier upgrade directly
      tier = "free";
      console.log("Current user:", currentuser);
      try {
        const response = await axios.post(
          "http://localhost:5000/subscriptions/upgrade-tier",
          { tier },
          { headers: { Authorization: `Bearer ${currentuser.token}` } }
        );
        console.log("Upgrade response:", response.data);
        const { user, token } = response.data;
        localStorage.setItem(
          "Profile",
          JSON.stringify({
            username: user.email.split("@")[0],
            token,
            email: user.email,
            subscriptionTier: user.subscriptionTier,
          })
        );
        dispatch(
          setcurrentuser({
            username: user.email.split("@")[0],
            token,
            email: user.email,
            subscriptionTier: user.subscriptionTier,
          })
        );
        alert(`Successfully upgraded to ${tier}`);
      } catch (error) {
        console.error(
          "Upgrade failed:",
          error.response?.data?.error || error.message
        );
        alert(
          "Upgrade failed: " +
            (error.response?.data?.error || "Something went wrong")
        );
      }
    }
  };

  return (
    <div className="subscription-tiers-container">
      <h1>Choose Your Subscription Plan</h1>
      {!currentuser && (
        <p className="login-prompt">
          Please sign in to manage your subscription.
        </p>
      )}
      <div className="tiers-grid">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`tier-card ${
              currentuser?.subscriptionTier === tier.name ? "active-tier" : ""
            }`}
          >
            <h2>{tier.name}</h2>
            <p className="tier-description">{tier.description}</p>
            <ul className="tier-benefits">
              {tier.benefits.map((benefit, index) => (
                <li key={index}>{benefit}</li>
              ))}
            </ul>
            <p className="tier-price">{tier.price}</p>
            {currentuser?.subscriptionTier === tier.name ? (
              <button className="tier-button current-plan" disabled>
                Current Plan
              </button>
            ) : (
              <button
                className="tier-button"
                onClick={() => handleUpgradeTier(tier.price)}
              >
                {currentuser?.subscriptionTier === "Gold" &&
                tier.name !== "Gold"
                  ? "Downgrade"
                  : "Upgrade"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubscriptionTiers;
