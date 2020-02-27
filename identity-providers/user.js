const express = require('express')
const https = require('https')
const fs = require('fs')
const WebDID = require('./did.js')
const bodyParser = require('body-parser')

let notaryDID = new WebDID("identity-notary")
let clinicDID = new WebDID("identity-clinic")
let insuranceDID = new WebDID("identity-insurance")
let userDID = new WebDID("identity-user")
userDID.setVCService("https://identity-user/vc")


const app = express()

// Add CORS headers
app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')
    res.setHeader('Access-Control-Allow-Credentials', true)
	next()
})

app.use(bodyParser.json()); 

// This is a default route for resolving web DIDs
app.get('/.well-known/did.json', (req, res) => {
	res.send(userDID.toJSON())
})

// This is a route for this DIDs verifiable credentials service
app.get('/vc', (req, res) => {
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

// Open a https port to listen incoming connections and be resolvable from other entities
https.createServer({
	key: fs.readFileSync('./cert/user.key'),
	cert: fs.readFileSync('./cert/user.cert')
}, app).listen(process.env.HTTPS_PORT, () => {
	console.log(`Listening on ${process.env.HTTPS_PORT}`)
})

let identityVC = null;

app.get('/identity', (req, res) => {
	userDID.requestVerification(notaryDID) 
		.then(vc => {
			return userDID.verifyCredential(vc)
		}).then(vc => {
			identityVC = vc
			res.send(vc)
		})
})

app.get('/prescription', (req, res) => {
	userDID.requestVerification(clinicDID) 
		.then(vc => {
			return userDID.verifyCredential(vc)
		}).then(vc => {
			res.send(vc)
		})
})

app.post('/insurance', (req, res) => {
	console.log(req.body)
	userDID.requestVerification(insuranceDID) 
		.then(vc => {
			res.send(vc)
		})
})

// Open http port for the quick and dirty web ui
app.listen(process.env.HTTP_PORT, () => {
  console.log(`Listening on ${process.env.HTTP_PORT}`)
})
