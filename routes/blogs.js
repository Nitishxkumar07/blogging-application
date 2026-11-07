import { Router } from "express";
import multer from "multer";
import { Blog } from "../models/blog.js";
import { Comment } from "../models/comment.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";

export const router = Router();

/* ---------- Multer: keep the file in memory, validate it ---------- */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) =>
    file.mimetype.startsWith("image/")
      ? cb(null, true)
      : cb(new Error("Only image files are allowed")),
});

// wrapper so upload errors (too big, wrong type) give a clean message
const uploadCover = (req, res, next) =>
  upload.single("coverImage")(req, res, (err) => {
    if (err) return res.status(400).send(err.message);
    next();
  });

/* ---------- Auth helpers ---------- */
const requireLogin = (req, res, next) => {
  if (!req.user) return res.redirect("/user/signin"); // change to your login URL
  next();
};

// loads the blog and checks the logged-in user owns it
const requireOwner = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).send("Blog not found");
    if (String(blog.createdBy) !== String(req.user._id)) {
      return res.status(403).send("You can only change your own blogs");
    }
    req.blog = blog;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

/* ---------- Pages ---------- */
router.get("/add-new", requireLogin, (req, res) => {
  return res.render("addBlogs", { user: req.user });
});

router.get("/edit/:id", requireLogin, requireOwner, (req, res) => {
  return res.render("edit", { user: req.user, blog: req.blog });
});

/* ---------- Create ---------- */
router.post("/", requireLogin, uploadCover, async (req, res) => {
  try {
    const { title, body } = req.body;
    if (!req.file) return res.status(400).send("Cover image is required");

    const result = await uploadToCloudinary(req.file.buffer);

    const blog = await Blog.create({
      title,
      body,
      createdBy: req.user._id,
      coverImageURL: result.secure_url,
      coverImagePublicId: result.public_id,
    });

    return res.redirect(`/blog/${blog._id}`);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Could not create blog");
  }
});

/* ---------- Update ---------- */
router.put("/:id", requireLogin, requireOwner, uploadCover, async (req, res) => {
  try {
    const { title, body } = req.body;
    const blog = req.blog;

    blog.title = title;
    blog.body = body;

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      await deleteFromCloudinary(blog.coverImagePublicId); // remove the old one
      blog.coverImageURL = result.secure_url;
      blog.coverImagePublicId = result.public_id;
    }

    await blog.save();
    return res.redirect(`/blog/${blog._id}`);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Could not update blog");
  }
});

/* ---------- Delete ---------- */
router.delete("/:id", requireLogin, requireOwner, async (req, res) => {
  try {
    await deleteFromCloudinary(req.blog.coverImagePublicId);
    await Comment.deleteMany({ blogid: req.blog._id });
    await req.blog.deleteOne();
    return res.redirect("/");
  } catch (err) {
    console.error(err);
    return res.status(500).send("Could not delete blog");
  }
});

/* ---------- Comments ---------- */
router.post("/comment/:blogid", requireLogin, async (req, res) => {
  try {
    await Comment.create({
      content: req.body.content,
      blogid: req.params.blogid,
      createdBy: req.user._id,
    });
    return res.redirect(`/blog/${req.params.blogid}`);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Could not post comment");
  }
});

/* ---------- View single blog (keep LAST, it matches any /:id) ---------- */
router.get("/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate("createdBy");
    if (!blog) return res.status(404).send("Blog not found");

    const comments = await Comment.find({ blogid: req.params.id }).populate("createdBy");
    return res.render("blog", { user: req.user, blog, comments });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Server Error");
  }
});