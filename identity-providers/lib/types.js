class OrganizationCredential {
 	constructor(sub, legalName, taxID, address) {
 		this.sub = sub
 		this.legalName = legalName
 		this.taxID = taxID
 		this.address = address
 	}

 	toJSON () {
 		return {
		  sub: this.sub,
		  vc: {
		    '@context': [
		    	'https://www.w3.org/2018/credentials/v1',
		    	"https://schema.org" 
		    ],
		    type: ['VerifiableCredential', "OrganizationCredential"],
		    credentialSubject: {
		    	id: this.sub, 
	    		legalName: this.legalName,
				taxID: this.taxID,
				address: this.address
		    }
		  }
		}
 	}
}

class IdentityCredential {
 	constructor(sub, name, birthDate) {
 		this.sub = sub
 		this.name = name
 		this.birthDate = birthDate
 	}

 	toJSON () {
 		return {
		  sub: this.sub,
		  vc: {
		    '@context': [
		    	'https://www.w3.org/2018/credentials/v1',
		    	"https://schema.org" 
		    ],
		    type: ['VerifiableCredential', "IdentityCredential"],
		    credentialSubject: {
		    	id: this.sub, 
	    		name: this.name,
				birthDate: this.birthDate
		    }
		  }
		}
 	}
}

class InvoiceCredential {
 	constructor(sub, identifier, description, amount, currency) {
 		this.sub = sub

 		this.identifier = identifier
 		this.description = description
 		this.amount = amount
 		this.currency = currency
 	}

 	toJSON () {
 		return {
		  sub: this.sub,
		  vc: {
		    '@context': [
		    	'https://www.w3.org/2018/credentials/v1',
		    	"https://schema.org" 
		    ],
		    type: ['VerifiableCredential', "InvoiceCredential"],
		    credentialSubject: {
		    	id: this.sub, 
				identifier: this.identifier,
				description: this.description,
				totalPaymentDue: {
					value: this.amount,
					currency: this.currency
				},
		    }
		  }
		}
 	}
}

module.exports = {OrganizationCredential, IdentityCredential, InvoiceCredential}
