import { Stripe } from "stripe"

let stripe: Stripe
const getStripe = (): Stripe => {
  if (!stripe) stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2020-03-02" })
  return stripe
}

export { getStripe }
