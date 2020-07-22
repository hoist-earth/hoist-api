import jwt from "express-jwt";
import { Request, Response, NextFunction } from "express";
declare const getJWTCheck: () => jwt.RequestHandler;
declare const checkRoles: (roles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
export { getJWTCheck, checkRoles };
