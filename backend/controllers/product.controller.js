const Product = require("../models/product.model");
const redis = require("../lib/redis");
const cloudinary = require("../lib/cloudinary");

exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    res.status(200).json({ success: true, products });
  } catch (error) {
    console.error(`Error in getAllProducts controller: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
};

exports.getFeaturedProducts = async (req, res) => {
  try {
    let featuredProducts = await redis.get("featured_products");
    if (featuredProducts)
      return res.status(200).json({
        success: true,
        products: JSON.parse(featuredProducts),
      });

    featuredProducts = await Product.find({ isFeatured: true }).lean();
    redis.set("featured_products", JSON.stringify(featuredProducts));
    res.status(200).json({ success: true, products: featuredProducts });
  } catch (error) {
    console.error(`Error in getFeaturedProducts controller: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
};

exports.getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    
    if (!category)
      return res
        .status(400)
        .json({ success: false, message: "No category provided" });

    const products = await Product.find({ category });
    res.status(200).json({ success: true, products });
  } catch (error) {
    console.error(
      `Error in getProductsByCategory controller: ${error.message}`
    );
    res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
};

exports.getRecommendedProducts = async (req, res) => {
  try {
    const products = await Product.aggregate([
      { $sample: { size: 4 } },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          image: 1,
          price: 1,
        },
      },
    ]);
    res.status(200).json({ success: true, products });
  } catch (error) {
    console.error(
      `Error in getRecommendedProducts controller: ${error.message}`
    );
    res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, image, category } = req.body;

    if (!name || !description || !price || !image || !category)
      return res
        .status(400)
        .json({ success: false, message: "Please provide all fields" });

    let cloudinaryResponse = await cloudinary.uploader.upload(image, {
      folder: "products",
    });

    const product = await Product.create({
      name,
      description,
      price,
      image: cloudinaryResponse?.secure_url
        ? cloudinaryResponse.secure_url
        : "",
      category,
    });

    res.status(201).json({ success: true, product });
  } catch (error) {
    console.error(`Error in createProduct controller: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id)
      return res.status(400).json({ success: false, message: "No id provided" });

    const product = await Product.findById(id);
    if (!product)
      return res.status(404).json({ success: false, message: "Product not found" });

    if (product.image) {
      const publicId = product.image.split("/").pop().split(".")[0];
      try {
        await cloudinary.destroy(`products/${publicId}`);
        console.log("Deleted image from Cloudinary");
      } catch (error) {
        console.log("Error deleting image from Cloudinary");
      }
    }

    await Product.findByIdAndDelete(id);

    res
      .status(200)
      .json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error(`Error in deleteProduct controller: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
};

exports.toggleFeaturedProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id)
      return res.status(400).json({ success: false, message: "No id provided" });

    const product = await Product.findById(id);
    if (!product)
      return res.status(404).json({ success: false, message: "Product not found" });

    product.isFeatured = !product.isFeatured;
    const updatedProduct = await product.save();

    await updateFeaturedProductCash();

    res.status(200).json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error(
      `Error in toggleFeaturedProduct controller: ${error.message}`
    );
    res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
};

async function updateFeaturedProductCash() {
  try {
    const featuredProducts = await Product.find({ isFeatured: true }).lean();
    await redis.set("featured_products", JSON.stringify(featuredProducts));
  } catch (error) {
    console.log("error in update cache function: " + error.message);
  }
}
