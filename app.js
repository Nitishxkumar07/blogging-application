import 'dotenv/config';
import express from "express";
import path from "node:path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import { router as userRouter } from "./routes/user.js";
import { router as userBlog } from "./routes/blogs.js";
import { checkForAuthenticationCookie } from "./middleware/authentication.js";
import { User } from "./models/user.js"; // Importing registers the model
import { Blog } from "./models/blog.js";

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL)
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
app.use(express.static(path.resolve('./public')))
// Routes
app.get("/",async (req, res) => {
    const allBlogs = await Blog.find({});
    return res.render("home", {
        user: req.user,
        blogs: allBlogs
    });
});

app.use("/user", userRouter);
app.use("/blog", userBlog);

// Start Server
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));