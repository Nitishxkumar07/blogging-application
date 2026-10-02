import JWT from "jsonwebtoken";

const secret = process.env.JWT_SECRET || "tan_tana_tan_tantan_tara";

export function createTokenForUser(user) {
    const payload = {
        _id: user._id,
        fullName: user.fullName, // Added fullName for navbar display
        email: user.email,
        profileImageURL: user.profileImageURL,
        role: user.role,
    };
    return JWT.sign(payload, secret);
}

export function validateToken(token) {
    return JWT.verify(token, secret);
}