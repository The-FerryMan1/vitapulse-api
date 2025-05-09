import {z} from 'zod';

export const loginSchema = z.object({
    email: z.string().email().nonempty(),
    password: z.string().min(8),
})