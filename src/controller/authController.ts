import { Request, Response, NextFunction } from "express";
import {User} from "../models/users.model";
import jwt from "jsonwebtoken"
import { doHash, hmacProcess, validateHashedPassword } from "../utils/hasher";
import { loginSchema, signUpSchema } from "../middleware/Schema";
import { tempUser } from "../models/verification.model";

export const register = async (req:Request, res:Response) => {
    const { password, username, code, role} = req.body;
    try {
        //1 INPUT VALIDATION
        //Validate that the user sent the username, password and code
        const {error, value} = signUpSchema.validate(req.body, {abortEarly:false})
        if (error) {
            return res.status(401).json({
                message: error.details?.[0]?.message
            });
        }

        //2. THE GATEKEEPR CHECK (Find the Temporary Account)
        //Search the tempUser collection using username
        const potentialUser = await tempUser.findOne({username} as any)
        if (!potentialUser) {
            return res.status(401).json({
                message: "Session expired or verification not initiated. Please request a new one"
            });
        }
        //3. THE SECURITY CHECKS (Compare User Input vs Stored Data)
        //A. CHECK CODE:
        //Hash the code from the response body and compare it to the tempAccount.code
        const providedCode = code
        const hashedCode = hmacProcess(providedCode, process.env.HMAC_SECRET!)
        if (hashedCode !== potentialUser?.code) {
            return res.status(403).json({
                message: "Invalid verification code"
            });
        }
        //B. CHECK ROLE:
        //Compare response body role to tempAccount.role
        if (role !== potentialUser?.role) {
            return res.status(403).json({
                message: "Unauthorized role modification detected."
            });
        }
        //4. DUPLICATE PREVENTION (Final Database Check)
        //Check the permanent User collection to ensure the username isn't already taken.(Safety net for new user registration)
        const RegisteredUser = await User.findOne({username})
        if (RegisteredUser) {
            return res.status(400).json({
                message: "User already Exists"
            });
        }
        //5. DATA PROMOTION (The "Injection")
        //Create a new permanent User object
        //Use data from the temporary account(role, username and the password after hashing it)
        const hashedPassword = await doHash(password);
        const newUser = new User({
            username: potentialUser.username,
            password: hashedPassword,
            role: potentialUser.role,
            verified: true
        });
        const result = await newUser.save()
        if (result) {
            await tempUser.findOneAndDelete({username})
            //@ts-expect-error
            result.password = undefined;
            return res.status(201).json({
                message: "Account verified and created successfully",
                result,
        });
        }
    } catch (error) {
        console.log(error)
        return res.status(500).json({message:"Internal Server Error"});
    };
};

export const login = async (req:Request, res:Response, next: NextFunction) => {
    const { identifier, password} = req.body;
    try {
        const {error, value} = loginSchema.validate(req.body,{abortEarly:false})
        if (error) {
            return res.status(401).json({
                message: error.details?.[0]?.message
            })
        }
        const existingUser = await User.findOne({
            $or: [
                {email: identifier},
                {username: identifier}
            ]
        }).select("+password")
        if (!existingUser) {
            return res.status(401).json({
                message:"Invalid Credentials"
            })
        }
        const validatedPassword = await validateHashedPassword(password, existingUser.password)
        if (!validatedPassword) {
            return res.status(401).json({
                message: "Invalid Credentials"
            })
        }
        const token = jwt.sign(
            {
                userId: existingUser._id,
                role: existingUser.role,
            }, process.env.JWT_SECRET!, {expiresIn:"2h"}
        )
        res.cookie("Authorization", "Bearer " + token,{
            expires: new Date(Date.now() + 2*3600000),
            httpOnly: true,
            secure:process.env.NODE_ENV === "production"
        }).json({
            message: `$${existingUser.username} Granted pass, proceed to token verification`,
            token
        }) //TODO : do make a descion whether to add this line of code "".redirect("/auth/dashboard")"" if you decide to add it, do remove the one before it
    } catch (error) {
        console.log(error)
        return res.status(500).json({message:"Internal Server Error"})
    }
}

export const signout = async (req: Request,res: Response) => {
    res.clearCookie("Authorization").status(200).json({
        message: "Logged Out Successfully"
    })
}

export const success = async (req: Request, res: Response) => {
    try {
        return res.status(200).json({
            message: "True Log In achieved, all functions successfully move to the next"
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({message:"Internal Server Error"})
    }
}