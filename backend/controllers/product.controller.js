const Product = require("../models/product.model");

exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    res.status(200).json({ success: true, products });
  } catch (error) {
    console.error(`Error in getAllProducts controller: ${error.message}`);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
