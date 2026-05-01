import express, { Request, Response } from 'express';
import bcrypt from "bcryptjs";
import { z } from 'zod';
import { generateToken } from '../auth/jwt';
import { AuthDbService } from '../database/auth-db.service';
import { validateBody } from './middleware/validate-body.middleware';

const loginSchema = z.object({
    userName: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
});

const registrationSchema = z.object({
    userName: z.string().min(1, 'Username is required'),
    password1: z.string().min(8, 'Password must be at least 8 characters'),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    displayName: z.string().optional(),
});

export function createAuthRouter(authDbService: AuthDbService) {
    const authRouter = express.Router();

    authRouter.post('/register', validateBody(registrationSchema), async (req: Request, res: Response) => {
        try {
            const registration = req.body;

            const existingUser = await authDbService.getUserByUserName(registration.userName);
            if (existingUser) {
                res.status(409).json({ message: 'Username already exists.' });
                return;
            }

            const passwordHash = await bcrypt.hash(registration.password1, 10);

            const newUser = await authDbService.createUser({
                email: registration.email,
                userName: registration.userName,
                displayName: registration.displayName,
            });

            await authDbService.createUserSecrets({
                _id: newUser._id,
                passwordHash
            });

            const token = await generateToken({
                userId: newUser._id,
                name: newUser.userName,
                isAdmin: newUser.isAdmin,
            });

            res.status(201).json({ token });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ message: 'Internal server error during registration.' });
        }
    });

    authRouter.post('/login', validateBody(loginSchema), async (req: Request, res: Response) => {
        try {
            const { userName, password } = req.body;

            const user = await authDbService.getUserByUserName(userName);
            if (!user) {
                res.status(401).json({ message: 'Invalid username or password.' });
                return;
            }

            const userSecrets = await authDbService.getUserSecretsByUserId(user._id);
            if (!userSecrets) {
                res.status(401).json({ message: 'Invalid username or password.' });
                return;
            }

            const valid = await bcrypt.compare(password, userSecrets.passwordHash);
            if (!valid) {
                res.status(401).json({ message: 'Invalid username or password.' });
                return;
            }

            const token = await generateToken({
                userId: user._id,
                name: user.userName,
                isAdmin: user.isAdmin,
                permissions: user.permissions,
            });

            res.json({ token });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ message: 'Internal server error during login.' });
        }
    });

    return authRouter;
}
