import express from 'express';
import { getTokenPayloadFromRequest } from '../../utils/get-user-from-request.utils';


export const adminRouter = express.Router();

adminRouter.use(async (req, res, next) => {
    const user = getTokenPayloadFromRequest(req);

    // Ensure that the user has admin access.
    if (!user?.isAdmin) {
        res.status(403).send('Unauthorized');
        return;
    }

    next();
});

// Register all of the admin routers here.