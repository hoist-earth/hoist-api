"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const stripe_1 = require("./utils/stripe");
const auth_1 = require("./utils/auth");
const auth0_1 = require("./utils/auth0");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const app = express_1.default();
app.use(express_1.default.json());
app.use(cors_1.default());
app.post("/checkout/create", auth_1.getJWTCheck(), (req, res) => {
    auth0_1.getStripeCustomerIdFromAuth0(req.user.sub)
        .then((customerId) => __awaiter(void 0, void 0, void 0, function* () {
        const checkoutSession = yield stripe_1.getStripe().checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price: req.body.stripePricingPlanId,
                    quantity: 1,
                },
            ],
            customer: customerId,
            mode: "subscription",
            success_url: `${process.env.HOIST_WEBSITE}/account`,
            cancel_url: `${process.env.HOIST_WEBSITE}/account`,
        });
        res.json(checkoutSession);
    }))
        .catch(e => console.log(e));
});
app.post("/portal/create", auth_1.getJWTCheck(), (req, res) => {
    auth0_1.getStripeCustomerIdFromAuth0(req.user.sub)
        .then((customerId) => __awaiter(void 0, void 0, void 0, function* () {
        console.log(`Found customer id ${customerId}`);
        const portalSession = yield stripe_1.getStripe().billingPortal.sessions.create({
            customer: customerId,
            return_url: `${process.env.HOIST_WEBSITE}/account`,
        });
        res.json(portalSession);
    }))
        .catch(e => console.log(e));
});
app.get("/admin/test", auth_1.getJWTCheck(), auth_1.checkRoles(["admin"]), (req, res) => {
    res.json({
        user: 1,
    });
});
app.get("/", function (req, res) {
    res.json({
        audience: process.env.HOIST_API_AUDIENCE,
    });
});
console.log("App running on port " + process.env.PORT);
app.listen(process.env.PORT);
//# sourceMappingURL=index.js.map