import mongoose from "mongoose";
import { createHmac, randomBytes } from "crypto";
import { error } from "console";
import { createTokenForUser } from "../services/authentication.js";

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    salt: {
        type: String,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    profileImageURL: {
        type: String,
        default: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTjEOEOzppBYVwUUAFc-qb38tnY8gaS_ltDsQZxxpg_Xw&s=10"
    },
    role: {
        type: String,
        enum: ["admin", "user"],
        default: "user"
    }
}, { timestamps: true });

// Do NOT pass `next`. Just use an async function and return/finish execution.
userSchema.pre("save", function () {
    const user = this;

    if (!user.isModified("password")) return;

    const salt = randomBytes(16).toString();
    const hashedPassword = createHmac('sha256', salt).update(user.password).digest("hex");

    this.salt = salt;
    this.password = hashedPassword;
});

userSchema.static("matchpasswordAndGenerateTokens", async function (email, password) {
    const user = await this.findOne({ email });
    if (!user) throw new Error("User not found!");

    const salt = user.salt;
    const hashedPassword = user.password;

    const userProvidedHash = createHmac("sha256", salt)
        .update(password)
        .digest("hex")

    if( hashedPassword !== userProvidedHash) throw new Error('Incorrect password');
    const token = createTokenForUser(user) ;

    return token
})

export const User = mongoose.model("User", userSchema);