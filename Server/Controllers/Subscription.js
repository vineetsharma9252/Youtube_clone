import mongoose from "mongoose";
import User from "../Models/Auth.js";
import Videofiles from "../Models/videofile.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();


// Improved transporter configuration with error handling
const createTransporter = () => {
  // Check if email credentials are available
  console.log("EMAIL_USER:", process.env.EMAIL_USER ? "set" : "not set");
  console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "set" : "not set");
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("Email credentials missing. Please set EMAIL_USER and EMAIL_PASS environment variables.");
    return null;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    return transporter;
  } catch (error) {
    console.error("Failed to create transporter:", error);
    return null;
  }
};

// Test transporter configuration
const testTransporter = () => {
  const transporter = createTransporter();
  if (!transporter) {
    console.error("Cannot test transporter - credentials missing");
    return;
  }

  transporter.verify((error, success) => {
    if (error) {
      console.error("Transporter verification failed:", error);
    } else {
      console.log("Transporter is ready to send emails");
    }
  });
};

// Call test on module load
testTransporter();

export const feed = async (req, res) => {
  try {
    const videos = await Videofiles.find()
      .sort({ createdAt: -1 })
      .populate("uploader", "email");

    res.status(200).json({ videos });
  } catch (error) {
    console.error("Feed error:", error.message);
    res.status(500).json({ error: "Something went wrong..." });
  }
};

export const upgrade_tier = async (req, res) => {
  try {
    const { email, tier } = req.body;
    console.log("Upgrade tier request body:", req.body);
    
    let subscriptionTier = "free";
    if (tier === "₹10/month") subscriptionTier = "Bronze";
    else if (tier === "₹50/month") subscriptionTier = "Silver";
    else if (tier === "₹70/month") subscriptionTier = "Gold";
    else if (["free", "Bronze", "Silver", "Gold"].includes(tier)) {
      subscriptionTier = tier;
    } else {
      return res.status(400).json({ error: "Invalid tier" });
    }

    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.subscriptionTier = subscriptionTier;
    await user.save();

    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        subscriptionTier: user.subscriptionTier,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Email sending with better error handling
    const transporter = createTransporter();
    if (transporter) {
      try {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: "Subscription Upgrade Confirmation - Your Tube",
          text: `Hello ${user.email.split("@")[0]},\n\nYour subscription has been successfully upgraded to ${subscriptionTier}!\n\nThank you for choosing Your Tube.\n\nBest,\nYour Tube Team`,
          html: `<h1>Subscription Upgrade Confirmation</h1><p>Hello ${user.email.split("@")[0]},</p><p>Your subscription has been successfully upgraded to <strong>${subscriptionTier}</strong>!</p><p>Thank you for choosing Your Tube.</p><p>Best,<br>Your Tube Team</p>`,
        };

        await transporter.sendMail(mailOptions);
        console.log("Email sent successfully to:", user.email);
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
        // Don't fail the whole request if email fails
      }
    }

    res.status(200).json({
      message: `Upgraded to ${subscriptionTier} successfully`,
      user: {
        email: user.email,
        subscriptionTier: user.subscriptionTier,
      },
      token,
    });
  } catch (error) {
    console.error("Upgrade tier error:", error.message, error.stack);
    res.status(500).json({ error: "Something went wrong...", details: error.message });
  }
};

export const getUserSubscriptionByEmail = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.status(200).json({
      subscriptionTier: user.subscriptionTier,
    });
  } catch (error) {
    console.error("Get user subscription by email error:", error.message, error.stack);
    res.status(500).json({ error: "Something went wrong...", details: error.message });
  }
};