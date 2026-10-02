import { validateToken } from "../services/authentication.js";

export function checkForAuthenticationCookie(cookieName) {
    return (req, res, next) => {
        const tokenCookieValue = req.cookies[cookieName];

        if (!tokenCookieValue) {
            return next(); // Fixed: return to stop execution
        }

        try {
            const userPayload = validateToken(tokenCookieValue);
            req.user = userPayload;
        } catch (error) {
            // Optional: clear bad token if validation fails
            res.clearCookie(cookieName);
        }

        return next(); // Fixed: explicitly call next() and return
    };
}