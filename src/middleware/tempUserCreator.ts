import { Request, Response } from "express";
import { tempSchema } from "./Schema";
import { tempUser } from "../models/verification.model";
import { hmacProcess } from "../utils/hasher";
import dotenv from "dotenv";

dotenv.config()

export const tempRegistration = async (req: Request, res: Response) => {
    const {username} = req.body;
    try {
        const {error, value} = await tempSchema.validate(req.body)
        if (error) {
            return res.status(400).json({
                message: error.details?.[0]?.message
            })
        }
        //1. Try to find existing account
        let temporaryAccount = await tempUser.findOne({username})

        //2. If it doesn't exist, create instance
        if (!temporaryAccount) {
            temporaryAccount = new tempUser({username, role:"student"})
        }

        //3. Generate and assign the new code (works for both new and existing temporary accounts)
        const codeValue = Math.floor(100000 + Math.random()*900000).toString();
        const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_SECRET!);

        temporaryAccount.code = hashedCodeValue;
        const result = await temporaryAccount.save()

        return res.status(200).json({
            message: 'Temporary Profile Created',
            codeValue,//The raw code for the user
            result
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({message:"Internal Server Error"})
    }
}