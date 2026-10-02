import { Router } from "express";
import { User } from "../models/user.js";

export const router = Router();

router.get("/signin", (req, res) => {
    return res.render("signin");
});

router.get("/signup", (req, res) => {
    return res.render("signup");
});

router.post("/signin", async (req, res) => {
    const { email, password } = req.body;

    try {
        const token = await User.matchpasswordAndGenerateTokens(email, password);
        return res.cookie("token", token).redirect("/");
    } catch (error) {
        // Fixed: Render 'signin' with proper object syntax
        return res.render("signin", {
            error: "Invalid email or password",
        });
    }
});

router.post("/signup", async (req, res) => {
    const { fullName, email, password } = req.body;

    try {
        await User.create({
            fullName,
            email,
            password,
        });
        return res.redirect("/user/signin");
    } catch (error) {
        return res.render("signup", {
            error: "Failed to create account. Email may already exist.",
        });
    }
});

router.get("/logout", (req, res) => {
    return res.clearCookie("token").redirect("/");
});