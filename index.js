require("dotenv").config()

var express = require("express")
var cors = require("cors")
var app = express()
app.use(cors())
var jwt = require("express-jwt")
var jwks = require("jwks-rsa")

var port = process.env.PORT || 3000

var jwtCheck = jwt({
  secret: jwks.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: "https://" + process.env.AUTH0_DOMAIN + "/.well-known/jwks.json",
  }),
  audience: "http://localhost:3000",
  issuer: "https://" + process.env.AUTH0_DOMAIN + "/",
  algorithms: ["RS256"],
})

const getManagementApiJwt = () => {
  var request = require("request")

  return new Promise(function (resolve, reject) {
    var options = {
      method: "POST",
      url: "https://" + process.env.AUTH0_DOMAIN + "/oauth/token",
      headers: { "content-type": "application/json" },
      body:
        '{"client_id":"' +
        process.env.AUTH0_CLIENT_ID +
        '","client_secret":"' +
        process.env.AUTH0_CLIENT_SECRET +
        '","audience":"https://' +
        process.env.AUTH0_DOMAIN +
        '/api/v2/","grant_type":"client_credentials"}',
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

app.get("/user/manifestStripeCustomer", jwtCheck, function (req, res) {
  var request = require("request")

  getManagementApiJwt()
    .then(data => {
      const token = data.access_token
      var options = {
        method: "PATCH",
        url: "https://" + process.env.AUTH0_DOMAIN + "/api/v2/users/" + req.user.sub,
        headers: { authorization: "Bearer " + token, "content-type": "application/json" },
        body: { app_metadata: { stripeCustomerId: req.user.sub } }, // This will be the Stripe Customer ID
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
      })
    })
})

app.listen(port)
