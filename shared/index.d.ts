import { z } from 'zod';
export declare const HelloInputSchema: z.ZodObject<{
    name: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
export declare const HelloOutputSchema: z.ZodObject<{
    message: z.ZodString;
    timestamp: z.ZodString;
}, z.core.$strip>;
export declare const LoginInputSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export declare const LoginOutputSchema: z.ZodObject<{
    token: z.ZodString;
    user: z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        firstName: z.ZodString;
        lastName: z.ZodString;
        role: z.ZodEnum<{
            USER: "USER";
            ADMIN: "ADMIN";
        }>;
    }, z.core.$strip>;
}, z.core.$strip>;
