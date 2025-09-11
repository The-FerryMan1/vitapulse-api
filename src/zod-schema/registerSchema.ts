import {z} from 'zod';

export const registerSchema = z.object({
    name: z.string().min(3).max(255),
    birthday: z.string().date(),
    sex: z.enum(['male', 'female', 'Male', 'Female']),
    email: z.string().email(),
    contact: z.string().min(11).max(12),
    password: z.string().min(8),
    confirm: z.string().min(8),
    role: z.string().optional()
}).refine((data)=> data.password === data.confirm, {
    message: "Passwords don't match",
    path: ["confirm"], 
}); 
