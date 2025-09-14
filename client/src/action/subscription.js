import axios from "axios";

export const getSubscriptionTierFromEmail = async (token) => {
  try {
    const response = await axios.get(
      "https://youtube-clone-9.onrender.com/subscriptions/api/user/subscription-by-email",
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
