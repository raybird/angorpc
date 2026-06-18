import { z } from 'zod';

// Hello World 驗證 Schema
export const HelloInputSchema = z.object({
  name: z.string().min(1, "名字不能為空").default("World"),
});

export const HelloOutputSchema = z.object({
  message: z.string(),
  timestamp: z.string(),
});

// 用戶登入驗證 Schema
export const LoginInputSchema = z.object({
  email: z.string().email("不合法的 Email 格式"),
  password: z.string().min(1, "密碼不能為空"),
});

export const LoginOutputSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
    role: z.enum(["USER", "ADMIN"]),
  }),
});
