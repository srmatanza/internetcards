import Vue from 'vue'
import VueSession from 'vue-session'
import App from './App.vue'
import router from './router'

Vue.use(VueSession, {})

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
