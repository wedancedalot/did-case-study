const express = require('express')
const https = require('https')
const fs = require('fs')
const WebDID = require('./lib/did.js')
const types = require('./lib/types.js')

// Initialize own DID
const notaryDID = new WebDID("did:web:identity-notary")

// Set a resolvable url for identity's agent service
notaryDID.setAgentService("https://identity-notary/agent")

const app = express()

// This is a default route for resolving web DIDs
app.get('/.well-known/did.json', (req, res, next) => {
  res.send(notaryDID.toJSON())
})

// This is a route for this DIDs cloud agent
app.get('/agent/:msg', (req, res, next) => {
	notaryDID.verifyRequest(req.params.msg)
	.then(req => {
		// this is a very simplified DID agent, as it has the id of entities which make requests to him and liberally sends the the credentials
		// in practice, though, the process of attaining VC is much more complex and involves real interaction between the entities
		switch (req.payload.iss) {
			case 'did:web:identity-clinic':
				let med = new types.OrganizationCredential(req.payload.iss, "Columbia University Medical Center", 1020034, "1790 Broadway, New York, NY 10019, United States")
				console.log("Medical center credentials issued")
				return notaryDID.signCredential(med.toJSON())
			break;

			case 'did:web:identity-insurance':
				console.log("Insurance company credentials issued")
				let ins = new types.OrganizationCredential(req.payload.iss, "Greater New York Insurance Co", 7449563, "200 Madison Ave #3, New York, NY 10016, United States")
				return notaryDID.signCredential(ins.toJSON())
			break;

			case 'did:web:identity-user':
				console.log("Citized identity credentials issued")
				let usr = new types.IdentityCredential(req.payload.iss, "Linus Torvalds", "28.12.1969")
				return notaryDID.signCredential(usr.toJSON())
			break;

			default:
				throw new Error('Unknown entity')
		}

	})
	.then(cred => {
		res.send(cred)
	})
	.catch(next)
})

// Open a https port to listen incoming connections and be resolvable from other entities
https.createServer({
  key: fs.readFileSync('./cert/notary.key'),
  cert: fs.readFileSync('./cert/notary.cert')
}, app).listen(process.env.HTTPS_PORT, () => {
  console.log(`Listening on ${process.env.HTTPS_PORT}`)
})
