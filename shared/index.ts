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

// 用戶註冊驗證 Schema
export const RegisterInputSchema = z.object({
  email: z.string().email("不合法的 Email 格式").max(255),
  password: z.string().min(8, "密碼長度至少需 8 碼").max(100),
  firstName: z.string().min(1, "名字不能為空").max(100),
  lastName: z.string().min(1, "姓氏不能為空").max(100),
  phone: z.string().regex(/^\+?[0-9]{8,15}$/, "不合法的電話號碼格式").optional(),
});

export const RegisterOutputSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
    role: z.enum(["USER", "ADMIN"]),
  }),
});

// 會員個人資料驗證 Schema
export const ProfileOutputSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  phone: z.string().nullable(),
  role: z.enum(["USER", "ADMIN"]),
  createdAt: z.date().or(z.string()),
});
