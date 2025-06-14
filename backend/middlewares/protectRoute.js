const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

exports.protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies["jwt-e-commerce-store"];
    if (!token)
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: NO token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select("-password");
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User Not Found" });

    req.user = user;
    next();
  } catch (error) {
    console.error(`Error in protectRoute: ${error.message}`);
    res
      .status(401)
      .json({
        success: false,
        message: "Unauthorized: invalid or expired token",
      });
  }
};
