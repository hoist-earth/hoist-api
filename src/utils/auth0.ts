import fetch from "node-fetch"
import { Auth0User } from "../types"
import { getStripe } from "./stripe"

const getAuth0ManagementApiToken = () => {
  let token: string

  return new Promise(function (resolve, reject) {
    if (token) resolve(token)

    fetch(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
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
        token = json.access_token
        resolve(token)
      })
      .catch(e => reject(e))
  })
}

const getAuth0User = (sub: string) => {
  return new Promise(function (resolve, reject) {
    getAuth0ManagementApiToken().then(token => {
      fetch(`https://${process.env.AUTH0_DOMAIN}/api/v2/users/${sub}`, {
        method: "GET",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      })
        .then(res => res.json())
        .then(json => resolve(json))
        .catch(e => reject(e))
    })
  })
}

const getStripeCustomerIdFromAuth0 = (sub: string): Promise<string> => {
  return new Promise(function (resolve, reject) {
    getAuth0User(sub).then(async user => {
      // If StripeCustomerId is set already, return it
      if ((user as Auth0User).app_metadata?.stripeCustomerId) {
        resolve((user as Auth0User).app_metadata.stripeCustomerId)
      } else {
        // Else create a new Stripe Customer
        const customer = await getStripe().customers.create({
          metadata: {
            auth0sub: sub,
          },
        })

        // Save Stripe Customer ID to App Metadata and return new Stripe Customer ID
        getAuth0ManagementApiToken().then(token => {
          fetch(`https://${process.env.AUTH0_DOMAIN}/api/v2/users/${sub}`, {
            method: "PATCH",
            headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
            body: JSON.stringify({ app_metadata: { stripeCustomerId: customer.id } }),
          })
            .then(() => resolve(customer.id))
            .catch(e => reject(e))
        })
      }
    })
  })
}

export { getStripeCustomerIdFromAuth0 }
