import { Response, Request, NextFunction } from 'express';
import { verifyToken } from './jwt';

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
    const token: string | undefined = req.headers['authorization'] as string || req.headers['Authorization'] as string;

    if (!token) {
        console.warn(`401 (no token) response on request: ${req.url}`);
        res.status(401).json({ message: 'Access denied. No token provided.' });
        return;
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
        console.warn(`401 (invalid token) response on request: ${req.url}`);
        res.status(401).json({ message: 'Invalid token.' });
        return;
    }

    (req as any).user = decoded;
    next();
}