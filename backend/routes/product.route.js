const express = require("express");
const { protectRoute, adminRoute } = require("../middlewares/auth.middleware");
const {
  getAllProducts,
  getFeaturedProducts,
  createProduct,
  getProductsByCategory,
  getRecommendedProducts,
  deleteProduct,
  toggleFeaturedProduct,
} = require("../controllers/product.controller");

const router = express.Router();

router.get("/", protectRoute, adminRoute, getAllProducts);
router.get("/featured", getFeaturedProducts);
router.get("/category/:category", getProductsByCategory);
router.get("/recommendations", getRecommendedProducts);
router.post("/", protectRoute, adminRoute, createProduct);
router.delete("/:id", protectRoute, adminRoute, deleteProduct);
router.patch("/featured/:id", protectRoute, adminRoute, toggleFeaturedProduct);

module.exports = router;
