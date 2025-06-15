const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { generateTokenAndSetCookie } = require("../utils/generateToken");
const redis = require("../lib/redis");

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRATION,
  });
  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRATION,
  });
  return { accessToken, refreshToken };
};

const storeRefreshToken = async (userId, refreshToken) => {
  await redis.set(
    `refresh_token:${userId}`,
    refreshToken,
    "EX",
    7 * 24 * 60 * 60
  );
};

const setCookies = (res, accessToken, refreshToken) => {
  res.cookie("access-token", accessToken, {
    maxAge: 15 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  res.cookie("refresh-token", refreshToken, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
};

exports.signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password)
      return res
        .status(400)
        .json({ success: false, message: "Please provide all fields" });

    const emailReg = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailReg.test(email))
      return res
        .status(400)
        .json({ success: false, message: "Invalid email address" });

    if (password.length < 6)
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });

    const existingUsername = await User.findOne({ username });
    if (existingUsername)
      return res
        .status(400)
        .json({ success: false, message: "Username already taken" });

    const existingEmail = await User.findOne({ email });
    if (existingEmail)
      return res
        .status(400)
        .json({ success: false, message: "Email already taken" });

    const newUser = await User.create({
      username,
      email,
      password,
    });

    const { accessToken, refreshToken } = generateTokens(newUser._id);
    storeRefreshToken(newUser._id, refreshToken);
    setCookies(res, accessToken, refreshToken);

    const userObj = {
      id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
    };

    res.status(201).json({ success: true, user: userObj });
  } catch (error) {
    console.error(`Error in signup controller: ${error.message}`);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res
        .status(400)
        .json({ success: false, message: "Please provide all fields" });

    const emailReg = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailReg.test(email) || password.length < 6)
      return res
        .status(400)
        .json({ success: false, message: "Email or password incorrect" });

    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "Email or password incorrect" });

    const isMatch = user.comparePassword(password);
    if (!isMatch)
      return res
        .status(400)
        .json({ success: false, message: "Email or password incorrect" });

    const { accessToken, refreshToken } = generateTokens(user._id);
    storeRefreshToken(user._id, refreshToken);
    setCookies(res, accessToken, refreshToken);

    const userObj = {
      id: user._id,
      username: user.username,
      email: user.email,
    };

    res.status(200).json({ success: true, user: userObj });
  } catch (error) {
    console.error(`Error in login controller: ${error.message}`);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.logout = async (req, res) => {
  try {
    const refreshToken = req.cookies["refresh-token"];
    if (!refreshToken)
      res.status(401).json({
        success: false,
        message: "Unauthorized: No refresh token provided",
      });
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    redis.del(`refresh_token:${decoded.userId}`);
    res.clearCookie("access-token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    res.clearCookie("refresh-token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error(`Error in logout controller: ${error.message}`);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies["refresh-token"];
    if (!refreshToken)
      res.status(401).json({
        success: false,
        message: "Unauthorized: No refresh token provided",
      });

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const sortedAccessToken = await redis.get(
      `refresh_token:${decoded.userId}`
    );
    if (refreshToken !== sortedAccessToken)
      res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid refresh token",
      });

    const accessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION }
    );
    res.cookie("access-token", accessToken, {
      maxAge: 15 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res
      .status(200)
      .json({ success: true, message: "Token refreshed successfully" });
  } catch (error) {
    console.error(`Error in getMe controller: ${error.message}`);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getProfile = async (req, res) => {
  try {
    res.status(200).json({ success: true, user: req.user });
  } catch (error) {
    console.error(`Error in getMe controller: ${error.message}`);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
