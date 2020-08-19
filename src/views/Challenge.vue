<template>
  <div>
    <form id="appLogin"
          @submit.prevent="checkForm">
      <p>
        <input name="username" v-show="false" v-model="challengeUser" placeholder="Username" autocomplete="username" />
      </p>
      <p>
        <input name="password" type="password" v-model="challengePass" placeholder="Password" autocomplete="current-password">
      </p>
      <p>
        <input type="submit" value="submit" />
      </p>
    </form>
  </div>
</template>
<script>
import axios from 'axios'
export default {
  data: function() {
    return {
      challengePass: '',
      challengeUser: ''
    }
  },
  mounted: function() {
  },
  methods: {
    checkForm: function() {
      const comp = this
      axios
        .post('/api/login', { username: this.challengeUser, password: this.challengePass })
        .then(function(response) {
          console.log(response)
          comp.$router.push('/dashboard')
        })
        .catch(function(error) {
          console.error(error)
        })
    }
  }
}
</script>
<style scoped>
div {
  padding: 5px;
}
</style>
