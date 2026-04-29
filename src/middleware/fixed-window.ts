import { Response, Request, NextFunction } from "express"

//TODO: Remember to find a method to purge the information from (store) once tempAccount is created successfully
export const fixedWindow = (limit: number, windowMs: number) => {
    const store = new Map()

    return (req: Request, res: Response, next: NextFunction) => {
        const key = req.ip
        const now = Date.now()
        const slotStart = Math.floor(now/windowMs) * windowMs;
        let entry = store.get(key);
        if(!entry || entry.windowMs !== slotStart) {
            entry = {
                count: 0,
                windowMs: slotStart
            };
            store.set(key, entry)
        }
        entry.count++;
        if (entry.count > limit) {
            const retryAfterMs = entry.windowMs + windowMs - now;
            const retryInS = Math.ceil(retryAfterMs/1000)
            res.setHeader("Retry-After", Math.max(retryInS))
            return res.status(429).json({
                message:`Account already generated for ${req.body.username}, Try after ${Math.max(retryInS)}s.`
            })
        }
        next()
    }
}