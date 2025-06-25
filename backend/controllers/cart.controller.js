const Product = require("../models/product.model");

exports.getCartProducts = async (req, res) => {
  try {
    const ids = req.user.cartItems.map((item) => item.product);
    const products = await Product.find({ _id: { $in: ids } });

    const cartItems = products.map((product) => {
      const item = req.user.cartItems.find(
        (item) => item?.product.toString() === product.id
      );
      return { ...product.toJSON(), quantity: item.quantity };
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

    const existingItem = user.cartItems.find(
      (item) => item.product && item?.product.toString() === productId
    );
    if (existingItem) existingItem.quantity += 1;
    else user.cartItems.push({ product: productId.toString() });

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
    const { id: productId } = req.params;
    const user = req.user;

    if (!productId) user.cartItems = [];
    else
      user.cartItems = user.cartItems.filter(
        (item) => item?.product.toString() !== productId
      );

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
    const existingItem = user.cartItems.find(
      (item) => item?.product.toString() === productId
    );
    if (!existingItem)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    if (quantity === 0)
      user.cartItems = user.cartItems.filter(
        (item) => item?.product.toString() !== productId
      );
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
