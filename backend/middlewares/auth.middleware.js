const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

exports.protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies["access-token"];
    if (!token)
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: NO token provided" });

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decoded.userId).select("-password");
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User Not Found" });

    req.user = user;
    next();
  } catch (error) {
    console.error(`Error in protectRoute: ${error.message}`);
    res.status(401).json({
      success: false,
      message: "Unauthorized: invalid or expired token",
    });
  }
};

exports.adminRoute = (req, res, next) => {
  try {
    if (req.user && req.user.role === "admin") return next();
    return res
      .status(403)
      .json({ success: false, message: "Access denied: admin only" });
  } catch (error) {
    console.error(`Error in adminRoute: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
