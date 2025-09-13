import jwt from "jsonwebtoken";

const auth = (req, res, next) => {
  try {
    // Remove localStorage; use Authorization header only
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }
    console.log("Token is : ", token);
    console.log("jwt decode  : ", jwt.decode(token)); // Added decode for debugging
    let decodedata = jwt.verify(token, process.env.JWT_SECRET); // Fixed typo
    console.log("Decoded data is : ", decodedata);
    req.userid = decodedata?.email;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res
      .status(401)
      .json({ error: "Invalid credentials, yes this is the problem" }); // Match controller error format
  }
};
export default auth;
