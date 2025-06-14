const express = require("express");
const {
  signup,
  login,
  logout,
  getMe,
} = require("../controllers/auth.controller");
const { protectRoute } = require("../middlewares/protectRoute");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", protectRoute, getMe);

module.exports = router;
