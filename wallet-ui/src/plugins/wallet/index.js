import config from '../../config'
import axios from 'axios'

const Wallet = {
    install(Vue) {
        Vue.wallet = Vue.prototype.$wallet = {
            getIdentity: function() {
               return axios.get(config.apiUrl + "/identity")
                  .then(function (response) {
                    return response.data
                  })
            },

            getPrescription: function() {
               return axios.get(config.apiUrl + "/prescription")
                  .then(function (response) {
                    return response.data
                  })
            },

            getInsurance: function(prescription) {
              return axios.post(config.apiUrl + "/insurance", {
                prescription,
              }).then(function (response) {
                return response.data
              })
            },
        }
    }
};

export default Wallet;
