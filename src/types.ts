import { Request } from "express"

export interface AuthorizationResponse {
  access_token: string
}

export interface AuthenticatedRequest extends Request {
  user: Auth0User
}

export interface Auth0User {
  sub: string
}
