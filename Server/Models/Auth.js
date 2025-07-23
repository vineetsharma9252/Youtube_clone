import mongoose from "mongoose";

const userschema = mongoose.Schema({
  email: { type: String, require: true },
  name: { type: String },
  desc: { type: String },
  joinedon: { type: Date, default: Date.now },
  subscriptionTier: {
    type: String,
    enum: ["free" , "Bronze", "Silver", "Gold"],
    default: "free",
  },
});

export default mongoose.model("User", userschema);
