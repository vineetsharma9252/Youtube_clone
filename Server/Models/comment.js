import mongoose from "mongoose";

const commentschema = mongoose.Schema({
  videoid: String,
  userid: String,
  commentbody: String,
  usercommented: String,
  Like: { type: Number, default: 0 },
  Dislike: { type: Number, default: 0 },
  commentedon: { type: Date, default: Date.now },
});
export default mongoose.model("Comments", commentschema);
