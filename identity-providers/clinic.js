const express = require('express')
const https = require('https')
const fs = require('fs')
const WebDID = require('./did.js')
const credentials = require('./types/credentials.js')

let notaryDID = new WebDID("identity-notary")
let clinicDID = new WebDID("identity-clinic")

// Set a resolvable url for identity's agent service
clinicDID.setAgentService("https://identity-clinic/agent")
clinicDID.setVCService("https://identity-clinic/vc")

const app = express()

// This is a default route for resolving web DIDs
app.get('/.well-known/did.json', (req, res) => {
	res.send(clinicDID.toJSON())
})

let identityVC = null;

// This is a route for this DIDs cloud agent
app.get('/agent/:msg', (req, res) => {
	clinicDID.requestVerification(notaryDID) 
	.then(vc => {
		return clinicDID.verifyCredential(vc)
	}).then(vc => {
		identityVC = vc
		return	clinicDID.verifyRequest(req.params.msg)
	}).then(req => {
		switch (req.payload.iss) {
			case 'did:web:identity-user':
				let inv = new credentials.InvoiceCredential(req.payload.iss, 5423, "Invoice #5243 from Medical Clinic", 1024.25, "USD")
				return clinicDID.signCredential(inv.toJSON())
			break;

			default:
				throw 'Unknown entity'
		}

	}).then(cred => {
		res.send(cred)
	})
})

// This is a route for this DIDs verifiable credentials service
app.get('/vc', (req, res) => {
	return clinicDID.verifyRequest(req.params.msg)
	.then(req => {
		res.send(clinicDID.credentialsToJSON())
	})
})


// Open a https port to listen incoming connections and be resolvable from other entities
https.createServer({
	key: fs.readFileSync('./cert/clinic.key'),
	cert: fs.readFileSync('./cert/clinic.cert')
}, app).listen(process.env.HTTPS_PORT, () => {
	console.log(`Listening on ${process.env.HTTPS_PORT}`)
})