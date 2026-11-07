import 'dotenv/config';
import express from "express";
import path from "node:path";
import methodOverride from "method-override";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import { router as userRouter } from "./routes/user.js";
import { router as userBlog } from "./routes/blogs.js";
import { checkForAuthenticationCookie } from "./middleware/authentication.js";
import { User } from "./models/user.js";
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
// Note: express.urlencoded only handles application/x-www-form-urlencoded.
// multipart/form-data (file uploads) is handled per-route by multer.
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());
app.use(checkForAuthenticationCookie("token"));
app.use(express.static(path.resolve('./public')))
app.use(methodOverride('_method'));
// Routes
app.get("/",async (req, res) => {
    const allBlogs = await Blog.find().sort({
      createdAt: -1,
    });
    return res.render("home", {
        user: req.user,
        blogs: allBlogs
    });
});

app.use("/user", userRouter);
app.use("/blog", userBlog);

// Start Server
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
