// middlewares/authMiddleware.js
import { clerkClient } from "@clerk/express";

const getAuthUserId = (req) => {
    const auth = typeof req.auth === "function" ? req.auth() : req.auth;
    return auth?.userId || null;
};

export const protectUser = (req, res, next) => {
    const userId = getAuthUserId(req);
    if (!userId) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    req.userId = userId;
    next();
};

export const protectEducator = async (req, res, next) => {
    try {
        const userId = getAuthUserId(req);
        if (!userId) {
            return res.status(401).json({ success: false, message: "Not authenticated" });
        }

        const response = await clerkClient.users.getUser(userId);
        const role = response?.publicMetadata?.role ?? response?.public_metadata?.role;

        if (role !== "educator") {
            return res.status(403).json({ success: false, message: "Unauthorized Access" });
        }

        req.userId = userId;
        next();
    } catch (error) {
        console.error("protectEducator error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
