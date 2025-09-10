// middlewares/authMiddleware.js
import { clerkClient } from "@clerk/express";

export const protectEducator = async (req, res, next) => {
    try {
        const auth = (typeof req.auth === 'function') ? req.auth() : req.auth;
        const userId = auth?.userId;
        if (!userId) return res.status(401).json({ success: false, message: 'Not authenticated' });

        const response = await clerkClient.users.getUser(userId);

        // Clerk uses publicMetadata (or public_metadata) depending on SDK version; check both
        const role = response?.publicMetadata?.role ?? response?.public_metadata?.role;

        if (role !== 'educator') {
            return res.status(403).json({ success: false, message: 'Unauthorized Access' });
        }

        next();
    } catch (error) {
        console.error('protectEducator error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
