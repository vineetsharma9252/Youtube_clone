import axios from "axios";

export const getSubscriptionTierFromEmail = async (token) => {
  try {
    const response = await axios.get(
      "http://localhost:5000/subscriptions/api/user/subscription-by-email",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log("Fetched subscription tier:", response.data.subscriptionTier);
    return response.data.subscriptionTier;
  } catch (error) {
    console.error("Failed to fetch subscription tier by email:", error);
    throw error;
  }
};
