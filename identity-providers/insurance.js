const express = require('express')
const https = require('https')
const fs = require('fs')
const didJWT = require('did-jwt')
const WebDID = require('./did.js')

let notaryDID = new WebDID("identity-notary")
let insuranceDID = new WebDID("identity-insurance")

const httpPort = process.env.HTTP_PORT || 8083
const app = express()

insuranceDID.requestVerification(notaryDID) 
.then(vc => {
	return insuranceDID.verifyCredential(vc)
}).then(vc => {
	console.log(vc)
})

app.get('/.well-known/did.json', (req, res) => {
	res.send(insuranceDID.toJSON())
})

https.createServer({
	key: fs.readFileSync('./cert/clinic.key'),
	cert: fs.readFileSync('./cert/clinic.cert')
}, app).listen(httpPort, () => {
	console.log(`Listening on ${httpPort}`)
})