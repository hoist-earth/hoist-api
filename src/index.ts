import express from "express"

import { NowRequest, NowResponse } from "@vercel/node"
import fetch from "node-fetch"

import cors from "cors"
import { AuthenticatedRequest } from "./types"

import { getStripe } from "./utils/stripe"
import { getJWTCheck, checkRoles } from "./utils/auth"
import { getStripeCustomerIdFromAuth0 } from "./utils/auth0"

import * as dotenv from "dotenv"

dotenv.config()

const app = express()
app.use(express.json())
app.use(cors())

app.get("/user/:userid", getJWTCheck(), (req: NowRequest, res: NowResponse) => {
  startFetchMyQuery((req as AuthenticatedRequest).user.sub)
  .then(userProfile => {
    console.log(userProfile)
    res.json(userProfile)

  })

})

app.post("/checkout/create", getJWTCheck(), (req: NowRequest, res: NowResponse) => {
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
    .catch(e => console.log({ e, message: "line 39" }))
})

app.post("/portal/create", getJWTCheck(), (req: NowRequest, res: NowResponse) => {
  getStripeCustomerIdFromAuth0((req as AuthenticatedRequest).user.sub)
    .then(async customerId => {
      console.log(`Found customer id ${customerId}`)
      const portalSession = await getStripe().billingPortal.sessions.create({
        customer: customerId as string,
        return_url: `${process.env.HOIST_WEBSITE}/account`,
      })
      res.json(portalSession)
    })
    .catch(e => console.log({ e, message: "line 52" }))
})

app.get("/admin/test", getJWTCheck(), checkRoles(["admin"]), (req: NowRequest, res: NowResponse) => {
  res.json({
    user: 1,
  })
})

app.post("/hooks/stripe/subscription", async function (req, res) {
  const stripeData = req.body
  const eventType = stripeData.type
  const productId = stripeData.data.object.plan.product
  const product = await getStripe().products.retrieve(productId)
  const stripeCustomer = await getStripe().customers.retrieve(stripeData.data.object.customer)
  const auth0UserId = "auth0|5f0d30c02eb3030019c87379" //(stripeCustomer as any).metadata.auth0sub

  console.log(stripeData.data.object)
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
  }

  fetch(process.env.DGRAPH_URL || "", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
    .then(res => res.json())
    .then(console.log)

  // console.log(stripeData)
  res.json({})
})

app.get("/", function (req, res) {
  res.json({
    audience: process.env.HOIST_API_AUDIENCE,
  })
})

console.log("App running on port " + process.env.PORT)
app.listen(process.env.PORT)








async function fetchGraphQL(operationsDoc, operationName, variables) {
  const result = await fetch(
    "https://ultra-letters-8759.us-west-2.aws.cloud.dgraph.io/graphql",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: operationsDoc,
        variables: variables,
        operationName: operationName
      })
    }
  );

  return await result.json();
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
  return fetchGraphQL(
    operationsDoc,
    "MyQuery",
    {}
  );
}

async function startFetchMyQuery(sub) {
  const { errors, data } = await fetchMyQuery(sub);

  if (errors) {
    console.error(errors);
  }

  return data.getUser;
}

