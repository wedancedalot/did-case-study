import '@babel/polyfill'
import Vue from 'vue'
import VueRouter from 'vue-router'
import './plugins/vuetify'
import App from './App.vue'

import Dashboard from './components/Dashboard'

// plugins
import Wallet from './plugins/wallet';

Vue.config.productionTip = false
Vue.use(VueRouter)
Vue.use(Wallet)


var router = new VueRouter({
  routes: [
    { path: '/', component: Dashboard },
  ],
  mode: 'history'
})

new Vue({
    render: h => h(App),
    router
}).$mount('#app')