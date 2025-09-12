import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, },
  username: { type: String,  },
  subscriptionTier: { type: String, default: "free" },
  subscribedChannels: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  downloadedVideos: [
    {
      videoid: { type: mongoose.Schema.Types.ObjectId, ref: "Video" },
      lastDownloaded: { type: Date },
    },
  ],
});
userSchema.pre("save", function (next) {
  if (this.isModified("username") || this.isNew) {
    if (!this.username) {
      return next(new Error("Username is required"));
    }
  }
  next();
});
export default mongoose.model("User", userSchema);
