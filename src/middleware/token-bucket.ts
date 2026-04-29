import { Request, Response, NextFunction } from "express";

//TODO: Remember to find a method to purge the information from (store) once user logs in successfully
export const tokenBucket = (refill:number, rate:number, burst:number) => {
    const store = new Map();
    return (req: Request, res: Response, next: NextFunction) => {
        const key = req.body.username || req.ip;
        const now = Date.now();

        let bucket = store.get(key);

        if (!bucket) {
            bucket = {
                tokens: burst,
                lastRefill: now,
            }
            store.set(key, bucket)
        };

        const intervalsElapsed = Math.floor((now - bucket.lastRefill)/rate);
        if(intervalsElapsed > 0) {
            bucket.tokens = Math.min(
                burst,
                bucket.tokens + intervalsElapsed * refill
            )
            bucket.lastRefill += intervalsElapsed * rate
        }

        if (bucket.tokens < 1) {
            const retryAfterMs = Math.ceil((bucket.lastRefill + rate) - now);
            res.setHeader("Retry-After", Math.max(1, retryAfterMs/1000));
            return res.status(429).json({
                message: `Login failed. Please try again after ${Math.max(1, Math.ceil(retryAfterMs/1000))}`
            })
        }
        bucket.tokens -= 1;
        next()
    }
}