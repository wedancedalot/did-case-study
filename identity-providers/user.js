const express = require('express')
const https = require('https')
const fs = require('fs')
const WebDID = require('./lib/did.js')
const bodyParser = require('body-parser')

let notaryDID = new WebDID("did:web:identity-notary")
let clinicDID = new WebDID("did:web:identity-clinic")
let insuranceDID = new WebDID("did:web:identity-insurance")
let userDID = new WebDID("did:web:identity-user")
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
app.get('/.well-known/did.json', (req, res, next) => {
	res.send(userDID.toJSON())
})

// This is a route for this DIDs verifiable credentials service
app.get('/vc', (req, res, next) => {
	res.send(userDID.getIdentityCredential())
})

// Open a https port to listen incoming connections and be resolvable from other entities
https.createServer({
	key: fs.readFileSync('./cert/user.key'),
	cert: fs.readFileSync('./cert/user.cert')
}, app).listen(process.env.HTTPS_PORT, () => {
	console.log(`Listening on ${process.env.HTTPS_PORT}`)
})

app.get('/identity', (req, res, next) => {
	console.log("Requesting user credentials from notary")

	userDID.requestVerification(notaryDID) 
	.then(vc => {
		return userDID.verifyCredential(vc)
	}).then(vc => {
		userDID.setIdentityCredential(vc)
		res.send(vc)
	})
	.catch(next)
})

app.get('/prescription', (req, res, next) => {
	console.log("Presenting credentials to clinic and requesting the prescription")

	userDID.requestVerification(clinicDID) 
	.then(vc => {
		return userDID.verifyCredential(vc)
	}).then(vc => {
		res.send(vc)
	})
	.catch(next)

})

app.post('/insurance', (req, res, next) => {
	console.log("Presenting credentials to notary")

	userDID.requestVerification(insuranceDID, req.body.prescription) 
	.then(vc => {
		res.send(vc)
	})
	.catch(next)
})

// Open http port for the quick and dirty web ui
app.listen(process.env.HTTP_PORT, () => {
  console.log(`Listening on ${process.env.HTTP_PORT}`)
})
