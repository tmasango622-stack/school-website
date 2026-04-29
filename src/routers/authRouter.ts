import express from "express";
import { login, register, signout, success } from "../controller/authController";
import { Authorization } from "../middleware/rbac";
import { verifyToken } from "../middleware/verifyToken";
import { tempRegistration } from "../middleware/tempUserCreator";

const router = express.Router()


router.post("/register", register)

router.post("/login", login)

router.post("/onboard-student",  verifyToken, Authorization(["teacher"]), tempRegistration)

router.get("/dashboard", verifyToken, Authorization(["student"]), success)

router.post("/signout", signout)

const AuthRouter = router
export default AuthRouter;