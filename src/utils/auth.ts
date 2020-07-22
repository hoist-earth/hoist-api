import jwt from "express-jwt"
import jwks from "jwks-rsa"
import { Request, Response, NextFunction } from "express"
import { AuthenticatedRequest } from "../types"

let jwtCheck
const getJWTCheck = (): jwt.RequestHandler => {
  if (!jwtCheck)
    jwtCheck = jwt({
      secret: jwks.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
      }),
      audience: process.env.HOIST_API_AUDIENCE,
      issuer: `https://${process.env.AUTH0_DOMAIN}/`,
      algorithms: ["RS256"],
    })
  return jwtCheck
}

const checkRoles = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRoles = (req as AuthenticatedRequest).user["https://hoist.earth/roles"]
    let found = false
    roles.forEach(role => {
      console.log(".")
      if (userRoles.includes(role)) {
        found = true
      }
    })
    if (found) next()
    else res.status(401).json({ message: "Insufficient permissions" })
  }
}

export { getJWTCheck, checkRoles }
