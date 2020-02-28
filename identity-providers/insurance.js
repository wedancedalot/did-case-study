const express = require('express')
const https = require('https')
const fs = require('fs')
const WebDID = require('./lib/did.js')

const notaryDID = new WebDID("did:web:identity-notary")
const insuranceDID = new WebDID("did:web:identity-insurance")

// Set a resolvable url for identity's agent service
insuranceDID.setAgentService("https://identity-insurance/agent")

let app = express()

// This is a default route for resolving web DIDs
app.get('/.well-known/did.json', (req, res, next) => {
	res.send(insuranceDID.toJSON())
})

// This is a route for this DIDs cloud agent
app.get('/agent/:msg', (req, res, next) => {
	let invoiceData = {};

	// First verify that request comes from the user by jwt signature
	insuranceDID.verifyRequest(req.params.msg)
	.then(req => {
		if (req.payload.iss != 'did:web:identity-user') {
			throw new Error("identity does not match")
		}

		console.log("Verifying user identity")

		// Next step: verify the user credentials
		return insuranceDID.verifyCredentialFromJSON(req.payload.claims)
	})
	.then(claims => {
		// Check if proper claim type has been passed
		let vc = claims.payload.vc
		if (vc.type[0] != "VerifiableCredential" || vc.type[1] != "InvoiceCredential") {
			throw new Error("Bad credentials type")
		}

		let invoiceData = claims.payload

		console.log("Verifying who issued an invoice")

		// Resolve issuer and subject and verify it's credentials
		let subject = new WebDID(claims.payload.sub)
		let issuer = new WebDID(claims.payload.iss)

		let subjectIdentity = {}

		return subject.requestAndVerifyClaims()
		.then(sId => {
			subjectIdentity = sId
			return issuer.requestAndVerifyClaims()
		})
		.then(issuerIdentity => {
			return {
				invoiceData, 
				subjectIdentity,
				issuerIdentity,
			}
		})
	})
	.then(cred => {

		console.log("All checks passed")

		res.send(cred)
	})
	.catch(next)
})

// Open a https port to listen incoming connections and be resolvable from other entities
https.createServer({
	key: fs.readFileSync('./cert/clinic.key'),
	cert: fs.readFileSync('./cert/clinic.cert')
}, app).listen(process.env.HTTPS_PORT, () => {
	console.log(`Listening on ${process.env.HTTPS_PORT}`)
})