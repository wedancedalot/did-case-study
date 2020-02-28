const elliptic = require('elliptic')
const secp256k1 = elliptic.ec('secp256k1')
const didJWT = require('did-jwt')
const didVC = require('did-jwt-vc')
const axios = require('axios')
const { Resolver } = require('did-resolver')
const webResolver = require('web-did-resolver')

const resolver = new Resolver(webResolver.getResolver())

const DID_CONTEXT = "https://w3id.org/did/v1"
const VC_CONTEXT = "https://www.w3.org/2018/credentials/v1"
const PUBLIC_KEY_TYPE = "Secp256k1VerificationKey2018"
const JWT_ALG = 'ES256K-R'

// A helper class for DID-related functionality, such as doc resolving and VC issuing and signing
// based on did-jwt and did-jwt-vc libs
class WebDID {
    constructor(name) {
        if (!name) {
            throw "Name not provided"
        }

        this.id = name
        this.keypair = this.randomKeypair()
    }

    setIdentityCredential(vc) {
        this.identity = vc
    }

    getIdentityCredential() {
        return this.identity
    }

    getID () {
        return this.id
    }

    /**
     * @param  {string} uri for DID agent service, this will be displayed as a part of DID doc
     */
    setAgentService(endpoint) {
        this.agentServiceEndpoint = endpoint
    }


    /**
     * @param  {string} uri for DID verified credentials service, this will be displayed as a part of DID doc
     */
    setVCService(endpoint) {
        this.vcServiceEndpoint = endpoint
    }

    randomKeypair () {
        const kp = secp256k1.genKeyPair()

        return {
            pub: kp.getPublic('hex'),
            priv: kp.getPrivate('hex'),
        }
    }

    toJSON () {
        let did = {
          "@context": DID_CONTEXT,
          "id": this.getID() ,
          "publicKey": [
            {
              "id": this.getID() + "#owner",
              "type": PUBLIC_KEY_TYPE,
              "owner": this.getID(),
              "publicKeyHex": this.keypair.pub
            }
          ]
        }

        var services = [];

        if (this.agentServiceEndpoint != null) {
            services.push({
                "id": this.getID() + "#agent",
                "type": "AgentService",
                "serviceEndpoint": this.agentServiceEndpoint
            })
        }

        if (this.vcServiceEndpoint != null) {
            services.push({
                "id": this.getID() + "#vcs",
                "type": "VerifiableCredentialService",
                "serviceEndpoint": this.vcServiceEndpoint
            })
        }

        if (services.length > 0) {
            did.service = services
        }

        return did
    }

    /**
     * @param  {WebDID} DID document to request verification from
     * @param  {Object} list of claims to be sent as a part of verification request
     */
    requestVerification(aud, claims = {}) {
        let signer = didJWT.SimpleSigner(this.keypair.priv)

        return didJWT.createJWT({
            aud: aud.getID(), 
            exp: this.expirationTimestamp(1), 
            claims,
        }, {
            alg: JWT_ALG, 
            issuer: this.getID(), 
            signer
        }).then(jwt => {
            return this.sendToAgentService(jwt, aud)
        }).then(resp => {
            return resp.data 
        })
    }

    /**
     * There's no js resolver for web which resolves services propertly, thus - quick and dirty solution :)
     * This function is analogous to uport's messageToURI but uses the DID of target to resolve it's address 
     * using the AgentService endpoint

     * @param  {WebDID} DID document to request verification from
     * @param  {Object} list of claims to be sent as a part of verification request
     */
    sendToAgentService(msg, did) {
        return did.resolveAgentServiceEndpoint(resolver)
        .then(endpoint => {
            return axios.get(endpoint + "/" + msg)
        })
    }

    /**
     * Resolve AgentService url from DID 'service' field
     */
    resolveAgentServiceEndpoint() {
        return this.resolve(resolver)
        .then(did => {
            if (did != null && typeof did == 'object' && did.hasOwnProperty('service')) {
                for (var i = 0; i < did.service.length; i++) {
                    if (did.service[i].type == "AgentService") {
                        return did.service[i].serviceEndpoint
                    }
                }
            }

            throw "No AgentService resolved for this DID";
        })
    }

    /**
     * Resolve VerifiableCredentialService url from DID 'service' field
     */
    resolveVCServiceEndpoint() {
        return this.resolve(resolver)
        .then(did => {
            if (did != null && typeof did == 'object' && did.hasOwnProperty('service')) {
                for (var i = 0; i < did.service.length; i++) {
                    if (did.service[i].type == "VerifiableCredentialService") {
                        return did.service[i].serviceEndpoint
                    }
                }
            }

            throw "No VerifiableCredentialService resolved for this DID";
        })
    }

    /**
     * Send request to VerifiableCredentialService endpoint and verify the response
     */
    requestAndVerifyClaims() {
        return this.resolveVCServiceEndpoint()
        .then(axios.get)
        .then(resp => {
            return this.verifyCredentialFromJSON(resp.data)
        })
        .then(resp => {
            return resp.payload
        })
    }

    /**
     * Verifies the request issuer's signature using JWT
     * @param  {string} JWT to verify
     */
    verifyRequest(msg) {
        return didJWT.verifyJWT(msg, {resolver, audience: this.getID()})
    }
 
    /**
     * Packs VC into JWT payload and signs with the private key
     * @param  {Object} list of verified claims
     */
    signCredential(vcPayload) {
        let signer = didJWT.SimpleSigner(this.keypair.priv)

        return didVC.createVerifiableCredential(vcPayload, {did: this.getID(), signer: signer})
    }

    /**
     * Verifies VC JWT issuer's signature
     * @param  {string} JWT to verify
     */
    verifyCredential(vcJwt) {
        return didVC.verifyCredential(vcJwt, resolver)
            .then(vc => {
                return didJWT.decodeJWT(vcJwt)
            })
    }

    verifyCredentialFromJSON(vcJSON) {
        return this.verifyCredential(vcJSON.data + "." + vcJSON.signature)
    }

    expirationTimestamp(days){
        return Math.floor(new Date().getTime() / 1000) + days * 24 * 60 * 60
    }

    resolve () {
        return resolver.resolve(this.getID())
    }
}


module.exports = WebDID;