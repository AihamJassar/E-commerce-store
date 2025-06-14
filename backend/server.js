const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require('cookie-parser');

const authRoute = require("./routes/auth.route");

const { connectDB } = require("./db/config");

dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/users", authRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});
