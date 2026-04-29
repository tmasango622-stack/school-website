import express from "express";
import { login, register, signout, success } from "../controller/authController";
import { Authorization } from "../middleware/rbac";
import { verifyToken } from "../middleware/verifyToken";
import { tempRegistration } from "../middleware/tempUserCreator";
import { fixedWindow } from "../middleware/fixed-window";
import { slidingWindow } from "../middleware/sliding-window";
import { tokenBucket } from "../middleware/token-bucket";

const router = express.Router()


router.post("/register", slidingWindow(5, 18000000),register)

router.post("/login", tokenBucket(1, 30000, 5), login)

router.post("/onboard-student", fixedWindow(1, 10000), verifyToken, Authorization(["teacher"]), tempRegistration)

router.get("/dashboard", verifyToken, Authorization(["student"]), success)

router.post("/signout", signout)

const AuthRouter = router
export default AuthRouter;