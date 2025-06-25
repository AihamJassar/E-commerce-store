const express = require("express");
const { protectRoute } = require("../middlewares/auth.middleware");
const {
  getCartProducts,
  addToCart,
  removeAllFromCart,
  updateQuantity,
} = require("../controllers/cart.controller");

const router = express.Router();

router.get("/", protectRoute, getCartProducts);
router.post("/", protectRoute, addToCart);
router.delete("/:id", protectRoute, removeAllFromCart);
router.put("/:id", protectRoute, updateQuantity);

module.exports = router;
