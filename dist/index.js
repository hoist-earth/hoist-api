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
const node_fetch_1 = __importDefault(require("node-fetch"));
const cors_1 = __importDefault(require("cors"));
const stripe_1 = require("./utils/stripe");
const auth_1 = require("./utils/auth");
const auth0_1 = require("./utils/auth0");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const app = express_1.default();
app.use(express_1.default.json());
app.use(cors_1.default());
app.get("/user/:userid", auth_1.getJWTCheck(), (req, res) => {
    startFetchMyQuery(req.user.sub)
        .then(userProfile => {
        console.log(userProfile);
        res.json(userProfile);
    });
});
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
        .catch(e => console.log({ e, message: "line 39" }));
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
        .catch(e => console.log({ e, message: "line 52" }));
});
app.get("/admin/test", auth_1.getJWTCheck(), auth_1.checkRoles(["admin"]), (req, res) => {
    res.json({
        user: 1,
    });
});
app.post("/hooks/stripe/subscription", function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const stripeData = req.body;
        const eventType = stripeData.type;
        const productId = stripeData.data.object.plan.product;
        const product = yield stripe_1.getStripe().products.retrieve(productId);
        const stripeCustomer = yield stripe_1.getStripe().customers.retrieve(stripeData.data.object.customer);
        const auth0UserId = "auth0|5f0d30c02eb3030019c87379"; //(stripeCustomer as any).metadata.auth0sub
        console.log(stripeData.data.object);
        const payload = {
            query: `
      mutation($id: String!, $plan: PlanRef) {
      updateUser(input: {filter: {auth0UserId: {eq:$id}}, set: {plans: [$plan]}}) {
        numUids
      }
    }`,
            variables: {
                id: auth0UserId,
                plan: {
                    productId: product.id,
                    name: product.name,
                    startDate: stripeData.data.object.created,
                    expiryDate: stripeData.data.object.current_period_end,
                },
            },
        };
        node_fetch_1.default(process.env.DGRAPH_URL || "", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        })
            .then(res => res.json())
            .then(console.log);
        // console.log(stripeData)
        res.json({});
    });
});
app.get("/", function (req, res) {
    res.json({
        audience: process.env.HOIST_API_AUDIENCE,
    });
});
console.log("App running on port " + process.env.PORT);
app.listen(process.env.PORT);
function fetchGraphQL(operationsDoc, operationName, variables) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield node_fetch_1.default("https://ultra-letters-8759.us-west-2.aws.cloud.dgraph.io/graphql", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                query: operationsDoc,
                variables: variables,
                operationName: operationName
            })
        });
        return yield result.json();
    });
}
function fetchMyQuery(sub) {
    const operationsDoc = `
  query MyQuery {
    getUser(auth0UserId: "${sub}") {
      displayName
      plans {
        id
        name
        productId
        startDate
      }
    }
  }
`;
    return fetchGraphQL(operationsDoc, "MyQuery", {});
}
function startFetchMyQuery(sub) {
    return __awaiter(this, void 0, void 0, function* () {
        const { errors, data } = yield fetchMyQuery(sub);
        if (errors) {
            console.error(errors);
        }
        return data.getUser;
    });
}
//# sourceMappingURL=index.js.map