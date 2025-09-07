import express, { Request, Response } from 'express';
import bcrypt from "bcryptjs";
import { generateToken } from '../auth/jwt';
import { authDbService } from '../app-globals';
import { LoginRequest } from '../model/shared-models/login-request.model';
import { UserRegistration } from '../model/shared-models/user-registration.model';

export const authRouter = express.Router();

// User registration endpoint
authRouter.post('/register', async (req: Request, res: Response) => {
    // res.status(503).send({ message: 'Registration is turned off at the code level.' });
    // return;

    try {
        const registration = req.body as UserRegistration;

        if (!registration.userName || !registration.password1) {
            res.status(400).json({ message: 'Username and password are required.' });
            return;
        }

        // Check if user already exists in the User collection
        const existingUser = await authDbService.getUserByUserName(registration.userName);
        if (existingUser) {
            res.status(409).json({ message: 'Username already exists.' });
            return;
        }

        // Create user and secrets
        const passwordHash = await bcrypt.hash(registration.password1, 10);

        // Save user profile
        const newUser = await authDbService.createUser({
            email: registration.email,
            userName: registration.userName,
            displayName: registration.displayName,
        });

        // Save secrets (no userName)
        await authDbService.createUserSecrets({
            _id: newUser._id,
            passwordHash
        });

        // Generate token (TokenPayload expects userId, not _id)
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

// User login endpoint
authRouter.post('/login', async (req: Request, res: Response) => {
    try {
        const { userName, password } = req.body as LoginRequest;

        if (!userName || !password) {
            res.status(400).json({ message: 'Username and password are required.' });
            return;
        }

        // Find user by userName
        const user = await authDbService.getUserByUserName(userName);
        if (!user) {
            res.status(401).json({ message: 'Invalid username or password.' });
            return;
        }

        // Find user secrets by userId
        const userSecrets = await authDbService.getUserSecretsByUserId(user._id);
        if (!userSecrets) {
            res.status(401).json({ message: 'Invalid username or password.' });
            return;
        }

        // Compare password
        const valid = await bcrypt.compare(password, userSecrets.passwordHash);
        if (!valid) {
            res.status(401).json({ message: 'Invalid username or password.' });
            return;
        }

        // Generate token (TokenPayload expects userId, not _id)
        const token = await generateToken({
            userId: user._id,
            name: user.userName,
            isAdmin: user.isAdmin,
        });

        res.json({ token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error during login.' });
    }
});
