import { Schema, model } from "mongoose";

const verficationSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique:true,
    },
    code: {
        type: String,
        required: true,
    },
    role: {
        type :String,
        required: true,
        enum:["admin", "teacher", "student"]
    }
}, {timestamps: true});

export const tempUser = model("tempUser", verficationSchema);