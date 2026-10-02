import { Router } from "express";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Blog } from "../models/blog.js";

export const router = Router();

router.get("/add-new", (req, res) => {
  return res.render("addBlogs", {
    user: req.user,
  });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure destination directory exists before saving
    const uploadPath = path.resolve(`./public/uploads/`);
    // fs.mkdirSync(uploadPath, { recursive: true });
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Extract file extension (.jpg, .png, etc.)
      const fileName = `${Date.now()}-${file.originalname}`;
    
    // Name file strictly using Date.now() + extension
    cb(null, fileName);
  }
});

export const upload = multer({ storage });

router.post("/", upload.single("coverImage"), async (req, res) => {

    const {title, body} = req.body
    const blog = await Blog.create({
        body, 
        title,
        createdBy : req.user._id,
        coverImageURl : `/uploads/${req.file.filename}`
    })
  return res.redirect(`/blog/${blog._id}`);
});