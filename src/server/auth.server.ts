import express, { Request, Response } from 'express';
import { generateToken } from '../auth/jwt';
import { authService } from '../app-globals';
import { LoginRequest } from '../model/shared-models/login-request.model';

export const authRouter = express.Router();


authRouter.post('/login', async (req: Request, res: Response) => {
    // const { userName, website } = req.body as LoginRequest;

    // // Validate companyName and website (add your own validation logic)
    // if (!userName || !website) {
    //     console.warn(`401 response on request: ${req.url}`);
    //     res.status(400).json({ message: 'Company name and website are required.' });
    //     return;
    // }

    // // Attempt to validate a user, and if they exist, returns an ID for them.  If not, then returns undefined.
    // const tokenInfo = await authService.login(userName, website);

    // // If we don't have a user, then this login attempt is denied.
    // if (!tokenInfo) {
    //     console.warn(`403 response on request: ${req.url}`);
    //     res.status(403).json({ message: 'Invalid company name or website.' });
    //     return;
    // }

    // // Generate token
    // const token = await generateToken(tokenInfo);
    // res.json(token);
});
