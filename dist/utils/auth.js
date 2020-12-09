"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRoles = exports.getJWTCheck = void 0;
const express_jwt_1 = __importDefault(require("express-jwt"));
const jwks_rsa_1 = __importDefault(require("jwks-rsa"));
let jwtCheck;
const getJWTCheck = () => {
    if (!jwtCheck)
        jwtCheck = express_jwt_1.default({
            secret: jwks_rsa_1.default.expressJwtSecret({
                cache: true,
                rateLimit: true,
                jwksRequestsPerMinute: 5,
                jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
            }),
            audience: process.env.HOIST_API_AUDIENCE,
            issuer: `https://${process.env.AUTH0_DOMAIN}/`,
            algorithms: ["RS256"],
        });
    return jwtCheck;
};
exports.getJWTCheck = getJWTCheck;
const checkRoles = (roles) => {
    return (req, res, next) => {
        const userRoles = req.user["https://hoist.earth/roles"];
        let found = false;
        roles.forEach(role => {
            console.log(".");
            if (userRoles.includes(role)) {
                found = true;
            }
        });
        if (found)
            next();
        else
            res.status(401).json({ message: "Insufficient permissions" });
    };
};
exports.checkRoles = checkRoles;
//# sourceMappingURL=auth.js.map