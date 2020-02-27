const express = require('express')
const https = require('https')
const fs = require('fs')
const WebDID = require('./did.js')

const notaryDID = new WebDID("identity-notary")
const insuranceDID = new WebDID("identity-insurance")

// Set a resolvable url for identity's agent service
insuranceDID.setAgentService("https://identity-insurance/agent")

let app = express()

// This is a default route for resolving web DIDs
app.get('/.well-known/did.json', (req, res) => {
	res.send(insuranceDID.toJSON())
})

// This is a route for this DIDs cloud agent
app.get('/agent/:msg', (req, res) => {
	// First verify that request comes from the user by jwt signature
	insuranceDID.verifyRequest(req.params.msg)
	.then(req => {
		switch (req.payload.iss) {
			case 'did:web:identity-user':
			console.log(req)
			return "ok"
			break;

			default:
				throw 'Unknown entity'
		}

	})
	.then(cred => {
		res.send(cred)
	})
})

// Open a https port to listen incoming connections and be resolvable from other entities
https.createServer({
	key: fs.readFileSync('./cert/clinic.key'),
	cert: fs.readFileSync('./cert/clinic.cert')
}, app).listen(process.env.HTTPS_PORT, () => {
	console.log(`Listening on ${process.env.HTTPS_PORT}`)
})