const express = require('express')
const https = require('https')
const fs = require('fs')
const WebDID = require('./lib/did.js')
const types = require('./lib/types.js')

let notaryDID = new WebDID("did:web:identity-notary")
let clinicDID = new WebDID("did:web:identity-clinic")

// Set a resolvable url for identity's agent service
clinicDID.setAgentService("https://identity-clinic/agent")
clinicDID.setVCService("https://identity-clinic/vc")

const app = express()

// This is a default route for resolving web DIDs
app.get('/.well-known/did.json', (req, res, next) => {
	res.send(clinicDID.toJSON())
})

// This is a route for this DIDs cloud agent
app.get('/agent/:msg', (req, res, next) => {
	console.log("Requesting identity from Notary cloud agent")
	clinicDID.requestVerification(notaryDID) 
	.then(vc => {
		return clinicDID.verifyCredential(vc)
	})
	.then(vc => {
		console.log("Identity has been recieved")
		clinicDID.setIdentityCredential(vc)
		return	clinicDID.verifyRequest(req.params.msg)
	})
	.then(req => {
		if (req.payload.iss != 'did:web:identity-user') {
			throw new Error("Unknown entity")
		}

		let issuer = new WebDID(req.payload.iss)

		return issuer.requestAndVerifyClaims()
	})
	.then(req => {
		console.log("User credentials have been checked and validated. Invoice has beed issued")
		let inv = new types.InvoiceCredential(req.sub, 5423, "Invoice #5243 from Medical Clinic", 1024.25, "USD")
		return clinicDID.signCredential(inv.toJSON())
	})
	.then(cred => {
		res.send(cred)
	})
	.catch(next)
})

// This is a route for this DIDs verifiable credentials service
app.get('/vc', (req, res, next) => {
	res.send(clinicDID.getIdentityCredential())
})


// Open a https port to listen incoming connections and be resolvable from other entities
https.createServer({
	key: fs.readFileSync('./cert/clinic.key'),
	cert: fs.readFileSync('./cert/clinic.cert')
}, app).listen(process.env.HTTPS_PORT, () => {
	console.log(`Listening on ${process.env.HTTPS_PORT}`)
})