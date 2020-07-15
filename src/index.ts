import { AuthorizationResponse, AuthenticatedRequest } from "./types"

import { config } from "dotenv"
config()

import express from "express"
const app = express()

import cors from "cors"
app.use(cors())

import bodyParser from "body-parser"
app.use(bodyParser.json())

import jwt from "express-jwt"
import jwks from "jwks-rsa"

import { Stripe } from "stripe"
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2020-03-02" })

import request from "request"

const port = process.env.PORT || 3000

const jwtCheck = jwt({
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

const getManagementApiJwt = () => {
  return new Promise(function (resolve, reject) {
    const options = {
      method: "POST",
      url: `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.AUTH0_CLIENT_ID,
        client_secret: process.env.AUTH0_CLIENT_SECRET,
        audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
        grant_type: "client_credentials",
      }),
    }

    request(options, function (err, resp, body) {
      if (err) {
        reject(err)
      } else {
        resolve(JSON.parse(body))
      }
    })
  })
}

app.post("/checkout/create", jwtCheck, function (req, res) {
  const authenticatedRequest = req as AuthenticatedRequest // XXX: Must be a better way!
  getManagementApiJwt().then(data => {
    const token = (data as AuthorizationResponse).access_token
    console.log(token)
    const options = {
      method: "GET",
      url: `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${authenticatedRequest.user.sub}`,
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      json: true,
    }

    request(options, async function (error, response, body) {
      if (error) throw new Error(error)
      const customerId = body.app_metadata.stripeCustomerId

      const session = await stripe.checkout.sessions.create({
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
      })

      res.json(session)
    })
  })
})

app.post("/portal/create", jwtCheck, function (req, res) {
  const authenticatedRequest = req as AuthenticatedRequest // XXX: Must be a better way!

  getManagementApiJwt().then(data => {
    const token = (data as AuthorizationResponse).access_token
    console.log(token)
    const options = {
      method: "GET",
      url: `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${authenticatedRequest.user.sub}`,
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      json: true,
    }

    request(options, async function (error, response, body) {
      if (error) throw new Error(error)
      const customerId = body.app_metadata.stripeCustomerId

      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${process.env.HOIST_WEBSITE}/account`,
      })

      res.json(session)
    })
  })
})

app.get("/user/getSubscriptions", jwtCheck, function (req, res) {
  const authenticatedRequest = req as AuthenticatedRequest // XXX: Must be a better way!

  getManagementApiJwt().then(data => {
    const token = (data as AuthorizationResponse).access_token
    console.log(token)
    const options = {
      method: "GET",
      url: `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${authenticatedRequest.user.sub}`,
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      json: true,
    }

    request(options, async function (error, response, body) {
      if (error) throw new Error(error)
      const customerId = body.app_metadata.stripeCustomerId

      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        expand: ["data.items.data.price"],
      })

      res.json(subscriptions)
    })
  })
})

app.get("/user/manifestStripeCustomer", jwtCheck, function (req, res) {
  const authenticatedRequest = req as AuthenticatedRequest // XXX: Must be a better way!

  getManagementApiJwt()
    .then(async data => {
      const token = (data as AuthorizationResponse).access_token

      // Create Stripe Customer
      const customer = await stripe.customers.create({
        metadata: {
          auth0sub: authenticatedRequest.user.sub,
        },
      })

      // Save Stripe Customer ID to App Metadata
      const options = {
        method: "PATCH",
        url: `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${authenticatedRequest.user.sub}`,
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: { app_metadata: { stripeCustomerId: customer.id } },
        json: true,
      }

      request(options, function (error, response, body) {
        if (error) throw new Error(error)
        res.json(body)
      })
    })
    .catch(e => {
      res.json({
        response: "Fail",
        error: e,
      })
    })
})

app.get("/", function (req, res) {
  res.json({
    audience: process.env.HOIST_API_AUDIENCE,
  })
})

console.log("App running on port " + port)
app.listen(port)
