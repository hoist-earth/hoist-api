import express from "express"
import cors from "cors"
import { AuthenticatedRequest } from "./types"

import { getStripe } from "./utils/stripe"
import { jwtCheck } from "./utils/auth"
import { getStripeCustomerIdFromAuth0 } from "./utils/auth0"

import * as dotenv from "dotenv"

dotenv.config()

const app = express()
app.use(express.json())
app.use(cors())

app.post("/checkout/create", jwtCheck, function (req, res) {
  getStripeCustomerIdFromAuth0((req as AuthenticatedRequest).user.sub)
    .then(async customerId => {
      const checkoutSession = await getStripe().checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price: req.body.stripePricingPlanId,
            quantity: 1,
          },
        ],
        customer: customerId as string,
        mode: "subscription",
        success_url: `${process.env.HOIST_WEBSITE}/account`,
        cancel_url: `${process.env.HOIST_WEBSITE}/account`,
      })
      res.json(checkoutSession)
    })
    .catch(e => console.log(e))
})

app.post("/portal/create", jwtCheck, function (req, res) {
  getStripeCustomerIdFromAuth0((req as AuthenticatedRequest).user.sub)
    .then(async customerId => {
      console.log(`Found customer id ${customerId}`)
      const portalSession = await getStripe().billingPortal.sessions.create({
        customer: customerId as string,
        return_url: `${process.env.HOIST_WEBSITE}/account`,
      })
      res.json(portalSession)
    })
    .catch(e => console.log(e))
})

app.get("/", function (req, res) {
  res.json({
    audience: process.env.HOIST_API_AUDIENCE,
  })
})

console.log("App running on port " + process.env.PORT)
app.listen(process.env.PORT)
