import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db';
import AuthRouter from './routers/authRouter';
import cookieParser from 'cookie-parser';

dotenv.config();
// Initialize Express app
const app= express();
const PORT = process.env.PORT

// Databae connection
connectDB()

//Initalize
app.use(cookieParser())
app.use(express.json())

//test case
app.get("/", (req:Request, res:Response) => {
    res.send("Hello World")
})

//Routers
app.use("/auth", AuthRouter)

//Port passing
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`)
})