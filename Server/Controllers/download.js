// import User from '../Models/Auth' ;
import User from "../Models/Auth.js";
import Videofiles from "../Models/videofile.js";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import axios from "axios";

export const download = async (req, res) => {
  try {
    const userId = req.userid;
    const { id } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Restrict downloads to Gold tier
    if (user.subscriptionTier !== "Gold") {
      return res.status(403).json({
        error: "Downloads are available only for Gold tier subscribers",
      });
    }

    const video = await Videofiles.findById(id);
    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    console.log("Video file path (URL) is: ", video.filepath);

    // Fetch video from URL
    const response = await axios({
      method: "get",
      url: video.filepath,
      responseType: "stream",
    });

    // Set headers for file download
    res.setHeader("Content-Type", "video/mp4");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${video.title}.mp4"`
    );

    // Stream the video to the client
    response.data.pipe(res);

    // Handle stream errors
    response.data.on("error", (error) => {
      console.error("Stream error:", error.message);
      res.status(500).json({ error: "Download failed: " + error.message });
    });
  } catch (error) {
    console.error("Download error:", error.message);
    res.status(500).json({ error: "Download failed: " + error.message });
  }
};
