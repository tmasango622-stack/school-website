//TODO: Create a function to verify user token
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config()

export const verifyToken = (req: any, res: any, next: any) => {
    let token;
    if (req.header.client === "not-browser") {
        token = req.headers.authorization || req.headers.Authorization
    } else {
        token = req.cookies["Authorization"]
    }
    if (!token) {
        return res.status(403).send({
            message: "No token provided"
        })
    }
    try {
        const userToken = token.includes(" ")? token.split(" ")[1]:token;
        const jwtVerification = jwt.verify(userToken, process.env.JWT_SECRET!)
        req.user = jwtVerification
        next()
    } catch (error) {
        res.status(403).send({message:["Invalid Token!", error]})
    }
}