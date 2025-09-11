import { z } from 'zod';

export const userInfoUpdate = z.object({
    name: z.string().min(3).max(255),
    birthday: z.string().date(),
    sex: z.enum(['male', 'female', 'Male', 'Female']),
    contact: z.string().min(11).max(12),
    role: z.string().optional(),
})
export const userPassChange = z.object({
    Currentpassword: z.string().min(8),
    password: z.string().min(8),
    confirm: z.string().min(8),
}).refine((data) => data.password === data.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
}); 
