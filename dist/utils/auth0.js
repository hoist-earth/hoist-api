"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStripeCustomerIdFromAuth0 = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const stripe_1 = require("./stripe");
const getAuth0ManagementApiToken = () => {
    let token;
    return new Promise(function (resolve, reject) {
        if (token)
            resolve(token);
        node_fetch_1.default(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                client_id: process.env.AUTH0_CLIENT_ID,
                client_secret: process.env.AUTH0_CLIENT_SECRET,
                audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
                grant_type: "client_credentials",
            }),
        })
            .then(res => res.json())
            .then(json => {
            token = json.access_token;
            resolve(token);
        })
            .catch(e => reject(e));
    });
};
const getAuth0User = (sub) => {
    return new Promise(function (resolve, reject) {
        getAuth0ManagementApiToken().then(token => {
            node_fetch_1.default(`https://${process.env.AUTH0_DOMAIN}/api/v2/users/${sub}`, {
                method: "GET",
                headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
            })
                .then(res => res.json())
                .then(json => resolve(json))
                .catch(e => reject(e));
        });
    });
};
const getStripeCustomerIdFromAuth0 = (sub) => {
    return new Promise(function (resolve, reject) {
        getAuth0User(sub).then((user) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            // If StripeCustomerId is set already, return it
            if ((_a = user.app_metadata) === null || _a === void 0 ? void 0 : _a.stripeCustomerId) {
                resolve(user.app_metadata.stripeCustomerId);
            }
            else {
                // Else create a new Stripe Customer
                const customer = yield stripe_1.getStripe().customers.create({
                    metadata: {
                        auth0sub: sub,
                    },
                });
                // Save Stripe Customer ID to App Metadata and return new Stripe Customer ID
                getAuth0ManagementApiToken().then(token => {
                    node_fetch_1.default(`https://${process.env.AUTH0_DOMAIN}/api/v2/users/${sub}`, {
                        method: "PATCH",
                        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
                        body: JSON.stringify({ app_metadata: { stripeCustomerId: customer.id } }),
                    })
                        .then(() => resolve(customer.id))
                        .catch(e => reject(e));
                });
            }
        }));
    });
};
exports.getStripeCustomerIdFromAuth0 = getStripeCustomerIdFromAuth0;
//# sourceMappingURL=auth0.js.map