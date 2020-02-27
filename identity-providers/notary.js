const express = require('express')
const https = require('https')
const fs = require('fs')
const didJWT = require('did-jwt')
const WebDID = require('./did.js')
const credentials = require('./types/credentials.js')

const notaryDID = new WebDID("identity-notary")
notaryDID.setAgentService("https://identity-notary/agent")

const httpPort = process.env.HTTP_PORT || 8081
const app = express()

app.get('/agent/:msg', (req, res) => {
	notaryDID.verifyRequest(req.params.msg)
	.then(req => {
		// this is a very simplified DID agent, as it has the id of entities which make requests to him and liberally sends the the credentials
		// in practice, though, the process of attaining VC is much more complex and involves real interaction between the entities
		switch (req.payload.iss) {
			case 'did:web:identity-clinic':
				let uni = new credentials.OrganizationCredential(req.payload.iss, "Columbia University Medical Center", 1020034, "1790 Broadway, New York, NY 10019, United States")
				return notaryDID.signCredential(uni.toJSON())
			break;

			case 'did:web:identity-insurance':
				let ins = new credentials.OrganizationCredential(req.payload.iss, "Greater New York Insurance Co", 7449563, "200 Madison Ave #3, New York, NY 10016, United States")
				return notaryDID.signCredential(ins.toJSON())
			break;

			default:
				throw 'Unknown entity'
		}

	})
	.then(cred => {
		res.send(cred)
	})
})

app.get('/.well-known/did.json', (req, res) => {
  res.send(notaryDID.toJSON())
})

https.createServer({
  key: fs.readFileSync('./cert/notary.key'),
  cert: fs.readFileSync('./cert/notary.cert')
}, app).listen(httpPort, () => {
  console.log(`Listening on ${httpPort}`)
})
