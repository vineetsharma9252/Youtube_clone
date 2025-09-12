import users from "../Models/Auth.js";
import jwt from "jsonwebtoken";
export const login = async (req, res) => {
  const { email } = req.body;
  console.log(email);
  try {
    const extinguser = await users.findOne({ email });
    console.log("existing user", extinguser);
    if (!extinguser) {
      try {
        const newuser = await users.create({
          email,
          username: email.trim().split("@")[0],
          subscriptionTier: "free",
        });
        const token = jwt.sign(
          {
            email: newuser.email,
            id: newuser._id,
            subscriptionTier: newuser.subscriptionTier,
          },
          process.env.JWT_SECRET,
          {
            expiresIn: "1h",
          }
        );
        console.log("yeah it is working the token is " + token);
        console.log("new user created", newuser);

        res.status(200).json({ result: newuser, token });
      } catch (error) {
        res.status(500).json({ mess: "something went wrong..." });
        return;
      }
    } else {
      const token = jwt.sign(
        {
          email: extinguser.email,
          id: extinguser._id,
          subscriptionTier: extinguser.subscriptionTier,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "1h",
        }
      );
      console.log("yeah it is working the token is " + token);
      console.log("existing user", extinguser);

      res.status(200).json({ result: extinguser, token });
    }
  } catch (error) {
    res.status(500).json({ mess: "something went wrong..." });
    return;
  }
};
