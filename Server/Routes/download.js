import express from "express";
import auth from "../middleware/auth.js";
import { download } from "../Controllers/download.js";
import User from "../Models/Auth.js";
// import Videofiles from "../Models/Videofiles.js";
import fs from "fs";
import path from "path";

const router = express.Router();

router.post("/:id", auth, download);

export default router;
