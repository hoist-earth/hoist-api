"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStripe = void 0;
const stripe_1 = require("stripe");
let stripe;
const getStripe = () => {
    if (!stripe)
        stripe = new stripe_1.Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2020-03-02" });
    return stripe;
};
exports.getStripe = getStripe;
//# sourceMappingURL=stripe.js.map