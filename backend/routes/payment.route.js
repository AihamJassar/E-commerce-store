const express = require("express");
const { protectRoute } = require("../middlewares/auth.middleware");
const {
  createCheckoutSession,
  checkoutSuccess,
} = require("../controllers/payment.controller");
const { validate } = require("../models/coupon.model");

const router = express.Router();

router.post("/", protectRoute, createCheckoutSession);
router.post("/validate", protectRoute, checkoutSuccess);

module.exports = router;
