import User from "../Models/Auth.js";
import axios from "axios";
export const translator = async (req, res) => {
  try {
    const userId = req.userid;
    const { text, sourceLang, targetLang } = req.body;
    console.log("User ID from auth middleware for translation :", userId);
    console.log("Translation request body is  :", req.body);

    if (!text || !sourceLang || !targetLang) {
      return res.status(400).json({ error: "Missing text or language" });
    }

    const user = await User.findOne({ email: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Tier-based restrictions
    if (user.subscriptionTier === "free" && text.length > 500) {
      return res
        .status(403)
        .json({ error: "Basic tier limited to 500 characters" });
    }

    // Use LibreTranslate API
    const response = await axios.get(
      "https://api.mymemory.translated.net/get",
      {
        params: {
          q: text,
          langpair: `${sourceLang.toUpperCase()}|${targetLang.toUpperCase()}`,
          // Optional: Add key if registered for higher limits
          // key: process.env.MYMEMORY_API_KEY,
        },
      }
    );
    console.log("response we are getting is ", response);
    res
      .status(200)
      .json({ translatedText: response.data.responseData.translatedText });
  } catch (error) {
    console.error("Translation error:", error.message);
    res.status(500).json({ error: "Translation failed: " + error.message });
  }
};
