<template>
  <div>
    <h1>Game Dashboard</h1>
    <button @click="createGame">Create a New Game</button>
    <ul>
      <li v-for="game in this.currentGames" :key="game.gameId">{{ game.gameId }}</li>
    </ul>
  </div>
</template>
<script>
import axios from 'axios'

export default {
  data: function() {
    return {
      currentGames: []
    }
  },
  methods: {
    createGame: function() {
      axios
        .post('/api/newgame')
        .then(response => {
          console.log('We created a new game!', response)
          this.currentGames.push(response.data)
        })
        .catch(err => {
          console.debug('Catch: ', err.response)
          this.$router.push('/login')
        })
    }
  }
}
</script>
