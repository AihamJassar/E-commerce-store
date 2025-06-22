const express = require("express");
const { analyticsData } = require("../controllers/analytics.controller");
const { protectRoute, adminRoute } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/", protectRoute, adminRoute, analyticsData);

module.exports = router;
