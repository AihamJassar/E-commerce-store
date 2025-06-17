const Coupon = require("../models/coupon.model");
const Order = require("../models/order.model");
const stripe = require("../lib/stripe");

exports.createCheckoutSession = async (req, res) => {
  try {
    const { products, couponCode } = req.body;

    if (!Array.isArray(products) || products.length === 0)
      return res
        .status(400)
        .json({ success: false, message: "Invalid or empty products array" });

    let totalAmount = 0;

    const lineItem = products.map((product) => {
      const amount = Math.round(product.price * 100);
      totalAmount += amount * product.quantity;

      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            images: [product.image],
          },
          unit_amount: amount,
        },
        quantity: product.quantity || 1,
      };
    });

    let coupon = null;
    if (couponCode) {
      coupon = await Coupon.findOne({
        code: couponCode,
        userId: req.user_id,
        isActive: true,
      });
      totalAmount -= Math.round(
        (totalAmount * coupon.discountPercentage) / 100
      );
    }

    const session = await stripe.checkout.session.create({
      payment_method_types: ["card"],
      line_items: lineItem,
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/purchase-success?session_id=[CHECKOUT_SESSION_ID]`,
      cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
      discounts: coupon
        ? [
            {
              coupon: await createStripeCoupon(coupon.discountPercentage),
            },
          ]
        : [],
      metadata: {
        userId: req.user._id.toString(),
        couponCode: couponCode || "",
        products: JSON.stringify(
          products.map((p) => ({
            id: p._id,
            quantity: p.quantity,
            price: p.price,
          }))
        ),
      },
    });

    if (totalAmount > 20000) await createNewCoupon(req.user_id);

    res.status(200).json({
      success: true,
      data: { id: session.id, totalAmount: totalAmount / 100 },
    });
  } catch (error) {
    console.error(
      `Error in createCheckoutSession controller: ${error.message}`
    );
    res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
};

exports.checkoutSuccess = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await stripe.checkout.session.retrieve(sessionId);

    if (session.payment_status === "paid") {
      if (session.metadata.couponCode) {
        await Coupon.findOneAndUpdate(
          {
            code: session.metadata.couponCode,
            userId: session.metadata.userId,
          },
          {
            isActive: false,
          }
        );
      }

      const products = JSON.parse(session.metadata.products);
      const newOrder = new Order({
        user: session.metadata.userId,
        products: products.map((product) => ({
          product: product.id,
          quantity: product.quantity,
          price: product.price,
        })),
        totalAmount: session.amount_total / 100,
        stripeSessionId: sessionId,
      });

      await Order.create(newOrder);

      res.status(200).json({
        success: true,
        data: {
          message:
            "Payment successful, order created, and coupon deactivated if used.",
          orderId: newOrder._id,
        },
      });
    }
  } catch (error) {
    console.error(`Error in checkoutSuccess controller: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
};

async function createStripeCoupon(discountPercentage) {
  const coupon = await stripe.coupon.create({
    percent_off: discountPercentage,
    duration: "once",
  });
  return coupon.id;
}

async function createNewCoupon(userId) {
  await Coupon.findOneAndDelete({ userId });

  const newCoupon = await Coupon.create({
    code: "GIFT" + Math.random().toString(36).substring(2, 8).toUpperCase(),
    discountPercentage: 10,
    expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    userId: userId,
  });

  return newCoupon;
}
