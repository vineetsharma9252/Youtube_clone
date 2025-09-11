import express from "express";
import auth from "../middleware/auth.js";
import User from "../Models/Auth.js";
// import Videofiles from "../Models/Videofiles.js";
// import { subscribe } from "../Controllers/Subscription.js";
import { feed } from "../Controllers/Subscription.js";
import { upgrade_tier } from "../Controllers/Subscription.js";
import { getUserSubscriptionByEmail } from "../Controllers/Subscription.js";
const router = express.Router();

// router.post("/:channelId", auth, subscribe);

router.get("/feed", auth, feed);

router.post("/upgrade-tier", auth, upgrade_tier);

router.get("/api/user/subscription-by-email", getUserSubscriptionByEmail);

export default router;
