const Product = require("../models/product.model");

exports.getCartProducts = async (req, res) => {
  try {
    const products = await Product.find({ _id: { $in: req.user.cartItems } });

    const cartItems = products.map((product) => {
      const item = req.user.cartItems.find((item) => item.id === product.id);
      return { ...item, quantity: item.quantity };
    });

    res.status(200).json({ success: true, cartItems });
  } catch (error) {
    console.error(`Error in getCartProducts controller: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = req.user;

    const existingItem = user.cartItems.find((item) => item.id === productId);
    if (existingItem) existingItem.quantity += 1;
    else user.cartItems.push(productId);

    await user.save();
    res.status(200).json({ success: true, cartItems: user.cartItems });
  } catch (error) {
    console.error(`Error in addToCart controller: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
};

exports.removeAllFromCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = req.user;

    if (!productId) user.cartItems = [];
    else
      user.cartItems = user.cartItems.filter((item) => item.id !== productId);

    await user.save();
    res.status(200).json({ success: true, cartItems: user.cartItems });
  } catch (error) {
    console.error(`Error in removeAllFromCart controller: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
};

exports.updateQuantity = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { quantity } = req.body;
    const user = req.user;

    const existingItem = user.cartItems.find((item) => item.id === productId);
    if (!existingItem)
      return res.status(404).json({ success: false, message: "Product not found" });

    if (quantity === 0)
      user.cartItems = user.cartItems.filter((item) => item.id !== productId);
    else existingItem.quantity = quantity;

    await user.save();
    res.status(200).json({ success: true, cartItems: user.cartItems });
  } catch (error) {
    console.error(`Error in updateQuantity controller: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
};
