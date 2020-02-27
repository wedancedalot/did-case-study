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
		    	// in practice, this uri should return the valid json-ld for the OrganizationCredential,
		    	// for the sake of simplicity this is just a dummy link
		    	"https://example.com/credentials/organization/v1" 
		    ],
		    type: ['VerifiableCredential', "OrganizationCredential"],
		    credentialSubject: {
		    	id: this.sub, 
		    	organization: {
		    		legalName: this.legalName,
					taxID: this.taxID,
					address: this.address
		    	}
		    }
		  }
		}
 	}
}

module.exports = {OrganizationCredential}
