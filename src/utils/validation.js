import { z } from 'zod';

export const registerSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters long'),
    email: z.string().email('Please enter a valid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    bio: z.string().optional(),
    profilePicUrl: z.string().optional()
});

export const loginSchema = z.object({
    email: z.string().email('Please enter a valid email format'),
    password: z.string().min(1, 'Password is required')
});

export const postSchema = z.object({
    text: z.string().min(1, 'Post text cannot be empty'),
    imageUrl: z.string().optional()
});