import { Request } from "express";
export interface AuthenticatedRequest extends Request {
    user: Auth0User;
}
export interface Auth0User {
    sub: string;
    app_metadata: Auth0AppMetadata;
}
export interface Auth0AppMetadata {
    stripeCustomerId: string;
}
