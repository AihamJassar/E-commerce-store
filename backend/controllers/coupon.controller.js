const Coupon = require("../models/coupon.model");
const coupon = require("../models/coupon.model");

exports.getCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findOne({
      userId: req.user._id,
      isActive: true,
    });
    res.status(200).json({ success: true, coupon: coupon || null });
  } catch (error) {
    console.error(`Error in getCoupon controller: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
};

exports.validateCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    const coupon = Coupon.findOne({
      code,
      userId: req.user._id,
      isActive: true,
    });

    if (!coupon)
      return res.status(404).json({ success: false, message: "Coupon not found" });

    if (coupon.expirationDate < new Date()) {
      coupon.isActive = false;
      await coupon.save();
      return res.status(404).json({ success: false, message: "Coupon expired" });
    }

    res
      .status(200)
      .json({
        success: true,
        coupon: {
          message: "Coupon is valid",
          code: coupon.code,
          discountPercentage: coupon.discountPercentage,
        },
      });
  } catch (error) {
    console.error(`Error in validateCoupon controller: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
};
