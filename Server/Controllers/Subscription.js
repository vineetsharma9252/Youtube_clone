import mongoose from "mongoose";
import User from "../Models/Auth.js";
import Videofiles from "../Models/videofile.js";
import jwt from "jsonwebtoken";
// export const subscribe = async (req, res) => {
//   try {
//     const userId = req.userid;
//     const { channelId } = req.params;

//     if (userId === channelId) {
//       return res.status(400).json({ error: "Cannot subscribe to yourself" });
//     }

//     const user = await User.findById(userId);
//     const channel = await User.findById(channelId);

//     if (!channel) {
//       return res.status(404).json({ error: "Channel not found" });
//     }

//     const isSubscribed = user.subscribedChannels.includes(channelId);
//     if (isSubscribed) {
//       user.subscribedChannels = user.subscribedChannels.filter(
//         (id) => id.toString() !== channelId
//       );
//     } else {
//       user.subscribedChannels.push(channelId);
//     }
//     await user.save();

//     res.status(200).json({
//       message: isSubscribed
//         ? "Unsubscribed successfully"
//         : "Subscribed successfully",
//       subscribed: !isSubscribed,
//     });
//   } catch (error) {
//     console.error("Subscription error:", error.message);
//     res.status(500).json({ error: "Something went wrong..." });
//   }
// };

export const feed = async (req, res) => {
  try {
    const videos = await Videofiles.find()
      .sort({ createdAt: -1 })
      .populate("uploader", "email");

    res.status(200).json({ videos });
  } catch (error) {
    console.error("Feed error:", error.message);
    res.status(500).json({ error: "Something went wrong..." });
  }
};

export const upgrade_tier = async (req, res) => {
  try {
    const userId = req.userid;
    console.log("user id we are getting is ", userId);
    const { tier } = req.body;
    console.log("Requested tier:", tier);
    if (!["free", "Bronze", "Silver", "Gold"].includes(tier)) {
      return res.status(400).json({ error: "Invalid tier" });
    }

    const user = await User.findById(userId);
    user.subscriptionTier = tier;
    await user.save();

    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        subscriptionTier: user.subscriptionTier,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res
      .status(200)
      .json({ message: `Upgraded to ${tier} successfully`, user, token });
  } catch (error) {
    console.error("Upgrade tier error:", error.message);
    res.status(500).json({ error: "Something went wrong..." });
  }
};
