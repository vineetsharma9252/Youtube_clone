import express from "express";
import User from "../Models/Auth.js";
import jwt from "jsonwebtoken";

const router = express.Router();

router.get("/api/user/profile/:email", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.email !== req.params.email) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const user = await User.findOne({ email: req.params.email }).select(
      "email username subscriptionTier downloadedVideos"
    );
    if (!user) return res.status(404).json({ error: "User not found" });

    // Populate video titles (assuming a Video model with title)
    const videosWithTitles = await Promise.all(
      user.downloadedVideos.map(async (dv) => {
        const video = await Video.findById(dv.videoid).select("title");
        return { ...dv.toObject(), title: video?.title || "Untitled" };
      })
    );

    res.status(200).json({
      email: user.email,
      username: user.username,
      subscriptionTier: user.subscriptionTier,
      downloadedVideos: videosWithTitles,
    });
  } catch (error) {
    console.error("Profile error:", error.message);
    res.status(500).json({ error: "Something went wrong...", details: error.message });
  }
});

export default router;