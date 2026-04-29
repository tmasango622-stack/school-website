import { Response, Request, NextFunction } from "express";

//TODO: Remember to find a method to purge the information from (store) once is user registered successfully
export const slidingWindow = (limit:number, windowMs:number) => {
    const store = new Map()

    return (req:Request, res:Response, next:NextFunction) => {
        const key = `${req.body.username || req.ip}-${req.body.code || "no-code"}`;
        const now = Date.now()
        let times = store.get(key) || [];
        if(!times.length) {
            store.set(key, times);
        }
        const cuttoff = now - windowMs;
        times = times.filter((time: number) => time > cuttoff)
        store.set(key, times)
        if (times.length >= limit) {
            const retryAfterMs = times[0] + windowMs - now;
            const retryInS = Math.ceil(retryAfterMs/1000)
            res.setHeader("Retry-After", Math.max(1,retryInS))
            return res.status(429).json({
                message:"You have exceeded Maximum Retries. Please seek Technical Help."
            })
        }
        times.push(now)
        next()
    }
}