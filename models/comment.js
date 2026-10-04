import mongoose, { model, Schema } from "mongoose";

const commentSchema = new Schema({
    content: {
        type: String,
        required: true,
    },
    blogid: {
        type: Schema.Types.ObjectId,
        ref: 'Blog',
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    }
}, {timestamps: true})

export const Comment = model("comment", commentSchema)


