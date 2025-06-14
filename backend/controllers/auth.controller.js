const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const { generateTokenAndSetCookie } = require("../utils/generateToken");

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

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    generateTokenAndSetCookie(newUser._id, res);

    const userObj = {
      id: newUser._id,
      username: newUser.username,
      email: newUser.email,
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
    if (!emailReg.test(email))
      return res
        .status(400)
        .json({ success: false, message: "Email or password incorrect" });

    if (password.length < 6)
      return res
        .status(400)
        .json({ success: false, message: "Email or password incorrect" });

    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "Email or password incorrect" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res
        .status(400)
        .json({ success: false, message: "Email or password incorrect" });

    generateTokenAndSetCookie(user._id, res);

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
    res.clearCookie("jwt-e-commerce-store", {
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

exports.getMe = async (req, res) => {
  try {
    res.status(200).json({ success: true, user: req.user });
  } catch (error) {
    console.error(`Error in getMe controller: ${error.message}`);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
