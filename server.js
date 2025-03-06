require("dotenv").config();
require("./config/firebase");

const express = require("express");
const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    credentials: true,
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
  })
);

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

const identityRoutes = require("./routes/identityRoutes");
app.use("/api/identities", identityRoutes);

const userRoutes = require("./routes/userRoutes");
app.use("/api/user", userRoutes);

const dashboardRoutes = require("./routes/dashboardRoutes");
app.use("/api/dashboard", dashboardRoutes);

const errorHandler = require("./utils/errorHandler");
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
