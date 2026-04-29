console.log("Initialize role Check......")

//@ts-expect-error
export const Authorization = (Role) => {
    //@ts-expect-error
    return (req, res, next) => {
        console.log("Allowed Roles:", Role)
        console.log("User Role from Token", req.user.role)
        if (!Role.includes(req.user.role)) {
            return res.status(403).send({
                message: "Access denied"
            })
        }
        console.log("Role match success please proceed")
        next()
    }
}