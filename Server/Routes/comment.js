import express from "express";

import {
  postcomment,
  getcomment,
  deletecomment,
  editcomment,
  likecomment,
  dislikecomment,
  getlikeanddislike,
} from "../Controllers/Comment.js";
import auth from "../middleware/auth.js";
const router = express.Router();

router.post("/post", auth, postcomment);
router.get("/get", getcomment);
router.delete("/delete/:id", auth, deletecomment);
router.patch("/edit/:id", auth, editcomment);
router.post("/:id/like", auth, likecomment);
router.post("/:id/dislike", auth, dislikecomment);
router.get("/:id/reactions", auth, getlikeanddislike);

export default router;
