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
        return res.render("signin", {
            error: "Invalid email or password",
        });
    }
});

router.post("/signup", async (req, res) => {
    const { fullName, email, password } = req.body || {};

    try {
        await User.create({ fullName, email, password });
        return res.redirect("/user/signin");
    } catch (error) {
        console.error("SIGNUP ERROR:", error);          // <-- shows the real cause in logs

        let message = "Failed to create account. Please try again.";
        if (error.code === 11000) message = "An account with this email already exists.";
        else if (error.name === "ValidationError") message = Object.values(error.errors).map(e => e.message).join(", ");

        return res.render("signup", { error: message });
    }
});

router.get("/logout", (req, res) => {
    return res.clearCookie("token").redirect("/");
});
