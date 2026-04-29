import {hash, compare} from "bcryptjs";
import { createHmac } from "crypto";

//Password hashing
export const doHash = async (password: string, saltValue=12) => {
    const result = await hash(password, saltValue)
    return result
}

//Validation
export const validateHashedPassword = async (value: string, hashedValue: string) => {
    const result = await compare(value, hashedValue)
    return result
}

//TODO: add role based code validation.
export const hmacProcess = (value: string, key: string) => {
    const result = createHmac("sha512", key).update(value).digest("hex");
    return result;
}