"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginOutputSchema = exports.LoginInputSchema = exports.HelloOutputSchema = exports.HelloInputSchema = void 0;
const zod_1 = require("zod");
// Hello World 驗證 Schema
exports.HelloInputSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "名字不能為空").default("World"),
});
exports.HelloOutputSchema = zod_1.z.object({
    message: zod_1.z.string(),
    timestamp: zod_1.z.string(),
});
// 用戶登入驗證 Schema
exports.LoginInputSchema = zod_1.z.object({
    email: zod_1.z.string().email("不合法的 Email 格式"),
    password: zod_1.z.string().min(1, "密碼不能為空"),
});
exports.LoginOutputSchema = zod_1.z.object({
    token: zod_1.z.string(),
    user: zod_1.z.object({
        id: zod_1.z.string().uuid(),
        email: zod_1.z.string().email(),
        firstName: zod_1.z.string(),
        lastName: zod_1.z.string(),
        role: zod_1.z.enum(["USER", "ADMIN"]),
    }),
});
