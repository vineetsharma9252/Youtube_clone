import express from "express";
import auth from "../middleware/auth.js";
import User from "../Models/Auth.js";
import axios from "axios";
import { translator } from "../Controllers/Translator.js";

const router = express.Router();

router.post("/", auth, translator);

export default router;
