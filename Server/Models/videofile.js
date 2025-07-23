import mongoose from "mongoose";
const videofileschema = new mongoose.Schema(
  {
    videotitle: {
      type: String,
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
    filetype: {
      type: String,
      required: true,
    },
    filepath: {
      type: String,
      required: true,
    },
    filesize: {
      type: String,
      required: true,
    },
    videochanel: {
      type: String,
      required: true,
    },
    Like: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    duration: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);
export default mongoose.model("Videofiles", videofileschema);
