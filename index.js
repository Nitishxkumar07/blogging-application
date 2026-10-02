import express from "express";
import path from "node:path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import { router as userRouter } from "./routes/user.js";
import { router as userBlog } from "./routes/blogs.js";
import { checkForAuthenticationCookie } from "./middleware/authentication.js";

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL || "mongodb://127.0.0.1:27017/blogging")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

const PORT = process.env.PORT || 4000;
const app = express();

// View Engine Setup
app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

// Middlewares
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(checkForAuthenticationCookie("token"));

// Routes
app.get("/", (req, res) => {
    return res.render("home", {
        user: req.user,
    });
});

app.use("/user", userRouter);
app.use("/blog", userBlog);

// Start Server
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));