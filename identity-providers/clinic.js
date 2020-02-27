const express = require('express')
const https = require('https')
const fs = require('fs')
const didJWT = require('did-jwt')
const WebDID = require('./did.js')

let notaryDID = new WebDID("identity-notary")
let clinicDID = new WebDID("identity-clinic")

clinicDID.setVCService("https://identity-clinic/vcs")

const httpPort = process.env.HTTP_PORT || 8082
const app = express()

clinicDID.requestVerification(notaryDID) 
.then(vc => {
	return clinicDID.verifyCredential(vc)
}).then(vc => {
	console.log(vc)
})

/*
app.get('/vcs/:msg', (req, res) => {
	console.log("Hello from vc service")
})

app.get('/agent/:msg', (req, res) => {
	console.log("Hello from agent service")
	console.log(req.params.msg)
	console.log(didJWT.decodeJWT(req.params.msg))
})
*/


app.get('/.well-known/did.json', (req, res) => {
	res.send(clinicDID.toJSON())
})

https.createServer({
	key: fs.readFileSync('./cert/clinic.key'),
	cert: fs.readFileSync('./cert/clinic.cert')
}, app).listen(httpPort, () => {
	console.log(`Listening on ${httpPort}`)
})