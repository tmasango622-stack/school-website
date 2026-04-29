console.log("Initialize role Check......")

import { Request, Response, NextFunction } from "express"
export const Authorization = (Role: string[]) => {
    return (req: Request, res:Response, next: NextFunction) => {
        console.log("Allowed Roles:" , Role)
        console.log("User Role from Token", req.body.role)
        if (!Role.includes(req.body.role)) {
            return res.status(403).send({
                message: "Access denied"
            })
        }
        console.log("Role match success please proceed")
        next()
    }
}