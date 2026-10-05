import { Router } from "express";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Blog } from "../models/blog.js";
import { Comment } from "../models/comment.js";

export const router = Router();

router.get("/add-new", (req, res) => {
  return res.render("addBlogs", {
    user: req.user,
  });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.resolve("./public/uploads");
    // if (!fs.existsSync(uploadPath)) {
    //   fs.mkdirSync(uploadPath, { recursive: true });
    // }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  }
});

export const upload = multer({ storage });

// View Single Blog & Comments
router.get("/:id", async (req, res) => {
  const blog = await Blog.findById(req.params.id).populate("createdBy");

  // Find all comments associated with this blog ID and populate commenter info
  const comments = await Comment.find({ blogid: req.params.id }).populate("createdBy");

  return res.render("blog", {
    user: req.user,
    blog,
    comments, // Pass plural 'comments'
  });
});

// Post a New Comment
router.post("/comment/:blogid", async (req, res) => {
  await Comment.create({
    content: req.body.content,
    blogid: req.params.blogid, // ✅ Changed blogId to blogid
    createdBy: req.user._id,
  });
  return res.redirect(`/blog/${req.params.blogid}`);
});

// Create New Blog Post
router.post("/", upload.single("coverImage"), async (req, res) => {
  const { title, body } = req.body;
  const blog = await Blog.create({
    body,
    title,
    createdBy: req.user._id,
    coverImageURL: `/uploads/${req.file.filename}`
  });
  return res.redirect(`/blog/${blog._id}`);
});

router.get("/edit/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).send("Blog not found");
    }
    // Render your edit form view and pass the blog data to it
    res.render("edit", { blog });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

router.put("/:id", upload.single("coverImage"), async (req, res) => {
  try {
    const { title, body } = req.body;

    // Build the update object
    const updateData = { title, body };

    // If a new file is uploaded, update the coverImageURL path
    if (req.file) {
      updateData.coverImageURL = `/uploads/${req.file.filename}`;
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedBlog) {
      return res.status(404).send("Blog not found");
    }

    return res.redirect(`/blog/${updatedBlog._id}`);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Server Error");
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deletedBlog = await Blog.findByIdAndDelete(req.params.id);

    if (!deletedBlog) {
      return res.status(404).send("Blog not found");
    }

    // Optional: You can also write file system code here using `fs.unlink` 
    // to delete the physical image file from the /uploads folder if needed.

    return res.redirect("/");
  } catch (err) {
    console.error(err);
    return res.status(500).send("Server Error");
  }
});