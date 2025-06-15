const express = require('express');
const { protectRoute, adminRoute } = require('../middlewares/auth.middleware');
const {getAllProducts } = require('../controllers/product.controller');

const router = express.Router();

router.getAll('/',protectRoute,adminRoute, getAllProducts);

module.exports = router;