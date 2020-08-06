<template>
  <div class="home">
    <h1>Let's play a game!</h1>
    <form id="joingame" @submit.prevent="joingame">
      <table>
        <tr>
          <td><label>Room Code</label></td>
          <td><input v-model="gameId" placeholder="4-letter ID"/></td>
        </tr>
        <tr>
          <td><label>Player Name</label></td>
          <td><input v-model="playerName" placeholder="Be nice" /></td>
        </tr>
        <tr>
          <td colspan=2>
            <button name="join">Join!</button>
          </td>
        </tr>
        <tr v-if="this.bJoinError">
          <td colspan=2 class="errRow">
            <span class="errMsg">{{ this.strJoinError }}</span>
          </td>
        </tr>
      </table>
    </form>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'Home',
  data: function() {
    return {
      gameId: '',
      playerName: '',
      strJoinError: ''
    }
  },
  mounted: function() {
    console.log('Home.vue: ', this.$session, this.$session.exists(), this.$session.getAll())
  },
  computed: {
    bGameIdValid: function() {
      return /^[a-zA-Z]{4}$/.test(this.gameId.trim())
    },
    bPlayerNameValid: function() {
      return /^[a-zA-Z]+$/.test(this.playerName.trim())
    },
    bJoinError: function() {
      return this.strJoinError.length > 0
    }
  },
  methods: {
    joingame: function() {
      this.strJoinError = ''
      if(!this.bGameIdValid) {
        console.error('The Room Code must be four letters, no numbers')
        return
      }
      if(!this.bPlayerNameValid) {
        console.error('The Player name must only contain letters')
        return
      }
      const comp = this
      console.log('submitting: ', this.gameId, this.playerName)
      axios
        .post('/api/joingame/'+this.gameId.toUpperCase().trim(), { playerName: this.playerName.trim() })
        .then(response => {
          console.log('Success: ', response)
          comp.$router.push('/game')
        })
        .catch(function(error) {
          console.debug('Catch: ', error.response.status, error.response.data)
          comp.strJoinError = error.response.data.Msg
        })
    }
  }
}
</script>
<style scoped>
.errRow {
  border: 1px solid lightcoral;
  background-color: lightpink;
  color: darkred;
  padding: 5px;
}

.errRow {
  text-align: center;
}

td {
  padding: 5px;
}

table {
  width: 25%;
}
td label {
  text-align: right;
}
</style>
