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
dotenv.config();
const app = express();

app.use(cors());
app.use(express.json({ limit: "200mb", extended: true }));
app.use(express.urlencoded({ limit: "200mb", extended: true }));
app.use("/uploads", express.static(path.join("uploads")));

app.get("/", (req, res) => {
  res.send("Your tube is working");
});

app.use(bodyParser.json());
app.use("/user", userroutes);
app.use("/video", videoroutes);
app.use("/video/download", downloadRoutes);
app.use("/comment", commentroutes);
app.use("/subscriptions", subcription);
app.use("/translate", translate);

const PORT = process.env.PORT || 5000;

// const razorpay = new Razorpay({
//   key_id: "YOUR_KEY_ID",
//   key_secret: "YOUR_KEY_SECRET",
// });

// app.post("/create-order", async (req, res) => {
//   const { amount } = req.body;
//   const options = {
//     amount: amount * 100, // Razorpay works in paise
//     currency: "INR",
//     receipt: "receipt_order_123",
//   };

//   try {
//     const order = await razorpay.orders.create(options);
//     res.json(order);
//   } catch (err) {
//     res.status(500).send("Error creating order");
//   }
// });

// app.listen(5000, () => console.log("Server running on port 5000"));

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
