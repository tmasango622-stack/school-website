import {Schema, model} from "mongoose";

const userSchema = new Schema({
    username: {
        type: String,
        required: false,
        minlength: 6,
        maxlength: 60,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
        select: false,
    },
    role: {
        type: String,
        required: true,
        enum: ["admin","teacher", "student"]
    },
    verified: {
        type: Boolean,
        default: false,
    }
},{timestamps:true})

export const User = model("User", userSchema)