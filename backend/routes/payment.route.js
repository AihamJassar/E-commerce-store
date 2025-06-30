const express = require("express");
const { protectRoute } = require("../middlewares/auth.middleware");
const {
  createCheckoutSession,
  checkoutSuccess,
} = require("../controllers/payment.controller");

const router = express.Router();

router.post("/create-checkout-session", protectRoute, createCheckoutSession);
router.post("/checkout-success", protectRoute, checkoutSuccess);

module.exports = router;
