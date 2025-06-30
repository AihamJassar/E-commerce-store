const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");

const authRoute = require("./routes/auth.route");
const productRoute = require("./routes/product.route");
const cartRoute = require("./routes/cart.route");
const couponRoute = require("./routes/coupon.route");
const paymentRoute = require("./routes/payment.route");
const analyticsRoute = require("./routes/analytics.route");

const { connectDB } = require("./db/config");
// TODO condeium
// ? upstash
dotenv.config();

const app = express();

app.use(express.json({ limit: "15mb" }));
app.use(cookieParser());

app.use("/api/auth", authRoute);
app.use("/api/products", productRoute);
app.use("/api/carts", cartRoute);
app.use("/api/coupons", couponRoute);
app.use("/api/payments", paymentRoute);
app.use("/api/analytics", analyticsRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});
