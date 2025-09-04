import comment from "../Models/comment.js";
import mongoose from "mongoose";

export const postcomment = async (req, res) => {
  const commentdata = req.body;
  const postcomment = new comment(commentdata);
  console.log("comment data is ", postcomment);
  console.log("comment body is ", req.body);
  try {
    await postcomment.save();
    res.status(200).json("posted the comment");
  } catch (error) {
    res.status(400).json(error.message);
    return;
  }
};

export const getlikeanddislike = async (req, res) => {
  const { id: _id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("Comments unavailable..");
  }
  try {
    const commentdata = await comment.findById(_id, "Like Dislike"); // Return only Like and Dislike
    if (!commentdata) return res.status(404).send("Comment not found");
    res.status(200).json({
      likes: commentdata.Like,
      dislikes: commentdata.Dislike,
    });
  } catch (error) {
    res
      .status(400)
      .json({ error: "Error fetching reactions: " + error.message });
  }
};

export const likecomment = async (req, res) => {
  const { id: _id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("Comments unavailable..");
  }
  try {
    const commentdata = await comment.findById(_id);
    if (!commentdata) return res.status(404).send("Comment not found");

    const update = { $inc: { Like: 1 } };
    if (commentdata.Like > 0) update.$inc.Like = -1; // Toggle off if already liked
    const updatelike = await comment.findByIdAndUpdate(_id, update, {
      new: true,
    });
    res.status(200).json({
      likes: updatelike.Like,
      dislikes: updatelike.Dislike,
    });
  } catch (error) {
    res.status(400).json({ error: "Error liking comment: " + error.message });
  }
};

export const dislikecomment = async (req, res) => {
  const { id: _id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("Comments unavailable..");
  }
  try {
    const commentdata = await comment.findById(_id);
    if (!commentdata) return res.status(404).send("Comment not found");

    const update = { $inc: { Dislike: 1 } };
    if (commentdata.Dislike > 0) update.$inc.Dislike = -1; // Toggle off if already disliked
    const updatedislike = await comment.findByIdAndUpdate(_id, update, {
      new: true,
    });
    res.status(200).json({
      likes: updatedislike.Like,
      dislikes: updatedislike.Dislike,
    });
  } catch (error) {
    res
      .status(400)
      .json({ error: "Error disliking comment: " + error.message });
  }
};

export const getcomment = async (req, res) => {
  try {
    const commentlist = await comment.find();
    res.status(200).send(commentlist);
  } catch (error) {
    res.status(400).json(error.message);
    return;
  }
};

export const deletecomment = async (req, res) => {
  const { id: _id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).send("Comments unavailable..");
  }
  try {
    await comment.findByIdAndDelete(_id);
    res.status(200).json({ message: "deleted comment" });
  } catch (error) {
    res.status(400).json(error.message);
    return;
  }
};

export const editcomment = async (req, res) => {
  const { id: _id } = req.params;
  const { commentbody } = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).send("Comments unavailable..");
  }
  try {
    const updatecomment = await comment.findByIdAndUpdate(_id, {
      $set: { commentbody: commentbody },
    });
    res.status(200).json(updatecomment);
  } catch (error) {
    res.status(400).json(error.message);
    return;
  }
};
