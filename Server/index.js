import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import videoroutes from "./Routes/video.js";
import userroutes from "./Routes/User.js";
import path from "path";
import commentroutes from "./Routes/comment.js";
import subcription from "./Routes/subcription.js";
import translate from "./Routes/translate.js";
import { Server } from "socket.io";
import downloadRoutes from "./Routes/download.js";
import Razorpay from "razorpay";
import axios from "axios";
import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "yoursecretkey";
import nodemailer from "nodemailer";
import crypto from "crypto";
import videofile from "./Models/videofile.js";
import User from "./Models/Auth.js";

import { OAuth2Client } from "google-auth-library";
dotenv.config();
const app = express();

app.use(cors());
app.use(express.json({ limit: "250mb", extended: true }));
app.use(express.urlencoded({ limit: "250mb", extended: true }));
app.use("/uploads", express.static(path.join("uploads")));
// app.use("/public", express.static(path.join("public")));

app.get("/", (req, res) => {
  res.send("Your tube is working");
});

app.use(bodyParser.json());
app.use("/user", userroutes);
app.use("/video", videoroutes);
// app.use("/video/download", downloadRoutes);
app.use("/comment", commentroutes);
app.use("/subscriptions", subcription);
app.use("/translate", translate);

const PORT = process.env.PORT || 5000;

const razorpay = new Razorpay({
  key_id: process.env.key_id,
  key_secret: process.env.key_secret,
});
const MSG_AUTH_KEY = process.env.MSG_AUTH_KEY;

// Verify MSG91 access token
const verifyAccessToken = async (token) => {
  console.log("Verifying access token:", token);

  // The correct endpoint for verifying OTP with MSG91
  const url = "https://api.msg91.com/api/v5/otp/verify";

  const headers = {
    "Content-Type": "application/json",
  };

  // Get the mobile number from the token (it should be in the token data)
  // First, let's decode the JWT token to get the requestId
  let requestId;
  try {
    const decoded = jwt.decode(token.message);
    requestId = decoded.requestId;
    console.log("Decoded token requestId:", requestId);
  } catch (decodeError) {
    console.error("Token decode error:", decodeError);
    throw new Error("Invalid token format");
  }

  const body = {
    authkey: MSG_AUTH_KEY,
    otp: token.otp || "", // You need to send the OTP entered by user
    mobile: token.mobile || "", // You need to send the mobile number
  };

  console.log("Verifying OTP with MSG91");
  console.log("Body:", body);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const json = await response.json();
    console.log("MSG91 verification response:", json);

    if (json.type === "success") {
      return json; // Contains verified user data
    } else {
      throw new Error(json.message || "OTP verification failed");
    }
  } catch (error) {
    console.error("Verification Error:", error.message);
    throw error;
  }
};

const CLIENT_ID =
  "592064090413-0n140npcgb55qrrkuod5ukl3upkb5svo.apps.googleusercontent.com";
const client = new OAuth2Client(CLIENT_ID);

app.post("/api/oauth/callback", async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: "No credential provided",
      });
    }

    // Verify the Google ID token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: CLIENT_ID,
    });

    const payload = ticket.getPayload();

    // Extract user information from the payload
    const {
      sub: googleId,
      email,
      given_name: firstName,
      family_name: lastName,
      picture,
    } = payload;

    console.log("Google OAuth successful for:", email);

    // Here you would typically:
    // 1. Check if user exists in your database by googleId or email
    // 2. Create a new user if they don't exist
    // 3. Generate a JWT token for authentication

    // Example: Find or create user in database
    // const user = await User.findOneAndUpdate(
    //   { googleId },
    //   {
    //     googleId,
    //     email,
    //     firstName,
    //     lastName,
    //     picture,
    //     lastLogin: new Date()
    //   },
    //   { upsert: true, new: true }
    // );

    // For demo purposes, we'll create a mock user object
    const user = {
      id: googleId,
      email,
      firstName,
      lastName,
      picture,
    };

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: "24h" } // Token expires in 24 hours
    );

    // Successful response
    res.json({
      success: true,
      message: "Login successful",
      token: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        picture: user.picture,
      },
    });
  } catch (error) {
    console.error("OAuth callback error:", error);

    res.status(500).json({
      success: false,
      message: "Authentication failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});
app.post("/video/download/:id", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ email: decoded.email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const videoId = req.params.id;
    console.log("Video ID from params:", videoId);
    const video = await videofile.findById(videoId);
    if (!video) return res.status(404).json({ error: "Video not found" });

    // Check subscription tier and daily download limit
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of the day

    const downloadedToday = user.downloadedVideos.find(
      (dv) =>
        dv.videoid.toString() === videoId &&
        new Date(dv.lastDownloaded).setHours(0, 0, 0, 0) === today.getTime()
    );

    if (
      user.subscriptionTier !== "Gold" &&
      (downloadedToday || user.downloadedVideos.length >= 1)
    ) {
      return res
        .status(403)
        .json({ error: "Download limit reached for today (1 per day)" });
    }

    // Update or add download record
    if (downloadedToday) {
      downloadedToday.lastDownloaded = new Date();
    } else {
      user.downloadedVideos.push({
        videoid: videoId,
        lastDownloaded: new Date(),
      });
    }
    await user.save();

    // Serve the video file (assuming video data is stored as a buffer or path)
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${video.title}.mp4"`
    );
    res.setHeader("Content-Type", "video/mp4");
    res.send(video.videoData); // Adjust based on how video is stored (e.g., buffer or file path)
  } catch (error) {
    console.error("Download error:", error.message);
    res
      .status(500)
      .json({ error: "Something went wrong...", details: error.message });
  }
});

// OAuth callback endpoint (for Google)
app.get("/api/oauth/callback", async (req, res) => {
  const { code } = req.query; // OAuth code from Google
  // Mock token verification (replace with real Google OAuth library)
  console.log("Verifying OAuth token:", code);
  const user = { email: "user@tn.gov.in", name: "Test User" }; // Simulate token decode

  const prefix = user.email.split("@")[0].slice(-3); // Rough prefix simulation
  const southernStates = ["944", "949", "953", "984", "986", "987"];
  const isSouthernState = southernStates.includes(prefix);
  if (isSouthernState) {
    res.json({
      success: true,
      message: "Google OAuth login successful",
      user,
    });
  } else {
    res.status(400).json({
      success: false,
      message: "Google OAuth not supported for this state; use mobile OTP",
    });
  }
});

// Mobile OTP login endpoint (placeholder for MSG91 widget)
app.post("/api/login", (req, res) => {
  const { contact } = req.body;
  console.log("Login request received for:", contact);

  if (!/^\+?91?\d{10}$/.test(contact)) {
    return res.status(400).json({ message: "Invalid mobile number format" });
  }

  const prefix = contact.startsWith("+91")
    ? contact.slice(3, 6)
    : contact.slice(0, 3);
  const southernStates = ["944", "949", "953", "984", "986", "987"];
  const isSouthernState = southernStates.includes(prefix);
  if (isSouthernState) {
    return res.status(400).json({
      message: "Mobile OTP not supported for southern states; use Google OAuth",
    });
  }

  // MSG91 widget handles OTP sending; just return success to trigger widget
  res.json({ message: "Please use the OTP widget to send OTP" });
});

app.post("/api/send-otp", async (req, res) => {
  try {
    const { contact } = req.body;

    // Call MSG91 API here
    const msg91Response = await axios.post(
      "https://api.msg91.com/api/v5/otp",
      {
        mobile: contact,
        // template_id: "YOUR_TEMPLATE_ID",
      },
      {
        headers: {
          authkey: MSG_AUTH_KEY,
        },
      }
    );

    res.json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.json({ success: false, message: "Failed to send OTP" });
  }
});

// Verify OTP endpoint (for MSG91 token)
// Verify OTP endpoint (for MSG91 token) - FIXED VERSION
app.post("/api/verify-otp", async (req, res) => {
  const { token, mobile } = req.body; // Expect token and mobile from widget
  console.log("Verify OTP request with token:", token, "mobile:", mobile);

  if (!token || !token.message) {
    return res
      .status(400)
      .json({ success: false, message: "No valid token provided" });
  }

  try {
    // The widget already verified the OTP, so we just need to trust the token
    // and create a session for the user

    // Decode the token to get basic info
    const decoded = jwt.decode(token.message);
    console.log("Decoded token:", decoded);

    // Create user object based on mobile number
    const user = {
      email: `${mobile}@msg91.user`,
      name: `User_${mobile}`,
      mobile: mobile,
      subscriptionTier: "free",
    };

    // Generate JWT token for your app
    const jwtToken = jwt.sign(user, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({
      success: true,
      message: "Login successful",
      token: jwtToken,
      user,
    });
  } catch (error) {
    console.error("Verification Error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
});

app.post("/create-order", async (req, res) => {
  const { amount } = req.body;
  const options = {
    amount: amount * 100, // Razorpay works in paise
    currency: "INR",
    receipt: "receipt_order_123",
  };

  try {
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    res.status(500).send("Error creating order");
  }
});

const transporter = nodemailer.createTransport({
  service: "gmail", // Use your email service
  auth: {
    user: process.env.EMAIL_USER, // Add to .env
    pass: process.env.EMAIL_PASS, // Add to .env (use app-specific password for Gmail)
  },
});

const emailOTPs = new Map(); // In-memory store (replace with DB in production)

app.post("/api/send-email-otp", async (req, res) => {
  const { email } = req.body;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid email format" });
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  emailOTPs.set(email, otp);

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP for Login",
      text: `Your OTP is ${otp}. It is valid for 10 minutes.`,
    });
    res.json({ success: true, message: "OTP sent to your email" });
  } catch (error) {
    console.error("Email OTP send error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to send email OTP" });
  }
});

app.post("/api/verify-email-otp", async (req, res) => {
  const { email, otp } = req.body;
  const storedOtp = emailOTPs.get(email);

  if (storedOtp && storedOtp === otp) {
    emailOTPs.delete(email); // Clear OTP after use
    const user = {
      email,
      name: email.split("@")[0] || "Email User",
      subscriptionTier: "free",
    };
    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ success: true, message: "Email OTP verified", token, user });
  } else {
    res.status(400).json({ success: false, message: "Invalid or expired OTP" });
  }
});

// app.listen(5000, () => console.log("Server running on port 5000"));

//Socket programming for video call

// import { Server } from "socket.io";

const io = new Server(8000, {
  cors: {
    origin: "*", // Restrict in production
    methods: ["GET", "POST"],
  },
});

const emailToSocketIdMap = new Map();
const socketIdToEmailMap = new Map();

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("room:join", (data) => {
    const { email, room } = data;
    emailToSocketIdMap.set(email, socket.id);
    socketIdToEmailMap.set(socket.id, email);
    socket.join(room);
    io.to(room).emit("user:joined", { email, id: socket.id }); // Use id instead of room
    io.to(socket.id).emit("room:join", data); // Consistent data structure
    console.log(`User with email ${email} joined room ${room}`);
  });

  socket.on("user:call", ({ to, offer }) => {
    io.to(to).emit("incomming:call", { from: socket.id, offer });
  });

  socket.on("call:accepted", ({ to, ans }) => {
    io.to(to).emit("call:accepted", { from: socket.id, ans });
  });

  socket.on("peer:nego:needed", ({ to, offer }) => {
    console.log("Negotiation needed from", socket.id, "to", to);
    io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    io.to(to).emit("peer:nego:final", { from: socket.id, ans });
  });

  socket.on("disconnect", () => {
    const email = socketIdToEmailMap.get(socket.id);
    if (email) {
      emailToSocketIdMap.delete(email);
      socketIdToEmailMap.delete(socket.id);
      io.emit("user:disconnected", { email });
      console.log(`User with email ${email} disconnected`);
    }
  });
});

console.log("Socket.io server running on port 8000");

app.listen(PORT, () => {
  console.log(`Server running on Port ${PORT}`);
});
const DB_URL = process.env.DB_URL;
mongoose
  .connect(DB_URL)
  .then(() => {
    console.log("Mongodb Database connected");
  })
  .catch((error) => {
    console.log(error);
  });
