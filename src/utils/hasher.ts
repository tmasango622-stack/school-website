import {hash, compare} from "bcryptjs";
import { createHmac } from "crypto";

//Password hashing
export const doHash = (password:any, saltValue=12) => {
    const result = hash(password, saltValue)
    return result
}

//Validation
//@ts-expect-error
export const validateHashedPassword = (value, hashedValue) => {
    const result = compare(value, hashedValue)
    return result
}

//TODO: add role based code validation.
//@ts-expect-error
export const hmacProcess = (value, key) => {
    const result = createHmac("sha512", key).update(value).digest("hex");
    return result;
}