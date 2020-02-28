<template>
  <v-app >
    <v-toolbar color="indigo" dark fixed app>
      <v-toolbar-title>Web Wallet</v-toolbar-title>
    </v-toolbar>
    <v-content>
      <v-container fluid fill-height>
        <v-layout
          justify-center
          align-center
        >
          <v-flex sm4 v-if="!step" text-xs-center>
            <h2>Step 1: Obtain verifiable identity credential</h2>
            <p>
              To start with, you need to obtain a verifiable identity credential from a commonly trusted entity, such as notary.
              Afterwards, when you will present the VC to any Verifier, if he is sure that the issuer of the credentials is reliable enough, it will be enough for him to validate the credential cryptographically.

              Additional request to issuer DID is desirable to check for VC expiration or withdrawal, but this logics is beyond the scope of case study
            </p>
            <v-btn color="success" @click="getIdentity">Get Identity</v-btn>
          </v-flex>

          <v-flex sm4 v-if="step==STEP_IDENTITY_RECEIVED"> 
            <h2>Success</h2>
            <p>
              You've just received your first verfied credential and it looks like this. The VC should be store in a user wallet or a secure respository, but for now we just store it in broswer memory.

              What has just happened? 

              <ol>
                <li>The wallet-api resolved a notary DID document by it's name - 'did:web:identity-notary' and made a request to it's cloud agent using an encrypted request</li>
                <li>Notary's cloud agent has validated that request is recieved from the user and returned the verified identity credential</li>
                <li>Of course the whole flow in practice will be much more complex and involves real interaction between the entities and presenting the documentary proofs. For the scope of case study, the Notary would just issue whatever we ask for</li>
              </ol>
              
            </p>

            <v-card>
              <pre>{{ identityVC.payload.vc }}</pre>
            </v-card>

            <v-flex text-xs-center>
              <v-btn color="success" @click="step=STEP_GET_PRESCRIPTION">Proceed to the next step</v-btn>
            </v-flex>
          </v-flex>

          <v-flex sm4 v-if="step==STEP_GET_PRESCRIPTION" text-xs-center>
            <h2>Step 2: Obtain a medical prescription from a clinic</h2>
            <p>
              Now that you have a valid identity id you can come to medical clinic and obtain a medical card just by presenting your DID.
              As long as the issuer of the credentials is reliable enough, it is enough to validate the credential cryptographically.
            </p>
            <v-btn color="success" @click="getPrescription">Get Prescription</v-btn>
          </v-flex>

          <v-flex sm4 v-if="step==STEP_PRESCRIPTION_RECEIVED"> 
            <h2>Success</h2>
            <p>
              You've just received a medical prescription from a hospital.

              What has just happened? 

              <ol>
                <li>The wallet-api resolved a hospital DID document by it's name - 'did:web:identity-clinic' and made a request to it's cloud agent using an encrypted request</li>
                <li>Clinic's cloud agent has validated that request is recieved from the user</li>
                <li>Clinic's cloud agent has validated that request the user has a valid identity credential issued by a reliable entity</li>
                <li>Clinic's cloud agent has issued the signed medical prescription in form of verified credentials</li>
              </ol>
            </p>

            <v-card>
              <pre>{{ prescriptionVC.payload.vc }}</pre>
            </v-card>

            <v-flex text-xs-center>
              <v-btn color="success" @click="step=STEP_GET_INSURANCE">Proceed to the next step</v-btn>
            </v-flex>
          </v-flex>

          <v-flex sm4 v-if="step==STEP_GET_INSURANCE" text-xs-center>
            <h2>Step 3: Getting insurance</h2>
            <p>
              Now that you have both valid identity credentials and medical prescription from a hospital, it's now possible for an insurance company to validate the available VC and settle the case
            </p>
            <v-btn color="success" @click="getInsurance">Get Insurance</v-btn>
          </v-flex>

          <v-flex sm4 v-if="step==STEP_INSURANCE_RECEIVED"> 
            <h2>All done</h2>
            <p>
              The case has been settled
            </p>
            <p>
              Here's the output of all the credentials obtained and verified by insurance using the DIDs
            </p>
            <v-card>
              <pre>{{ invoiceData }}</pre>
            </v-card>               
            <p>
              What has happened in the background?
            </p>
            <ol>
              <li>Insurance company's cloud agent has validated that request is recieved from the user</li>
              <li>Insurance company's cloud agent has validated that request the user has a valid identity credential issued by a reliable entity</li>
              <li>Insurance company's cloud agent has validated that request the user has a valid medical prescription</li>
              <li>Insurance company's cloud agent has validated that request the organization, which issue the medical prescription has a valid credential from a trusted issued</li>
              <li>Insurance company can now apply any logics, as updating it's records in the DB and settling the case</li>
            </ol>
            <h3>Where to look next?</h3>
            <p>
              Check README.md at the root of repo and source codes of the application for more details
            </p>

          </v-flex>

        </v-layout>
      </v-container>
    </v-content>
    <v-footer color="indigo" app>
    </v-footer>
  </v-app>
</template>

<script>
  export default {
    data: () => ({
      STEP_IDENTITY_RECEIVED:1,
      STEP_GET_PRESCRIPTION:2,
      STEP_PRESCRIPTION_RECEIVED:3,
      STEP_GET_INSURANCE:4,
      STEP_INSURANCE_RECEIVED:5,

      step: null,
      identityVC: null,
      prescriptionVC: null,
      invoiceData: null,
    }),

    methods: {
      getIdentity() {
        this.$wallet.getIdentity().then(resp => {
          this.step = this.STEP_IDENTITY_RECEIVED
          this.identityVC = resp
        })
      },

      getPrescription() {
        this.$wallet.getPrescription().then(resp => {
          this.step = this.STEP_PRESCRIPTION_RECEIVED
          this.prescriptionVC = resp
        })
      },

      getInsurance() {
        this.$wallet.getInsurance(this.prescriptionVC).then(resp => {
          this.step = this.STEP_INSURANCE_RECEIVED
          this.invoiceData = resp
        })
      },
    }
  }
</script>