<template>
  <div class="home pure-g">
    <div class="pure-u-1 pure-u-md-1-3">
      &nbsp;
    </div>
    <div class="pure-u-1 pure-u-md-1-3">
    <h1>Let's play a game!</h1>
    <form id="joingame" class="pure-form pure-form-stacked" @submit.prevent="joingame">
      <fieldset>
        <div class="pure-control-group">
          <label for="aligned-roomcode">Room Code</label>
          <input @focus="bSubmitted = false" type="text" v-model="gameId" id="aligned-roomcode" placeholder="4-Letter ID" />
          <span v-if="!this.bGameIdValid && this.bSubmitted" class="pure-form-message-inline">{{ this.roomCodeError }}</span>
        </div>
        <div class="pure-control-group">
          <label for="aligned-playername">Player Name</label>
          <input @focus="bSubmitted = false" type="text" v-model="playerName" id="aligned-playername" placeholder="Be nice" />
          <span v-if="!this.bPlayerNameValid && this.bSubmitted" class="pure-form-message-inline">{{ this.playerNameError }}</span>
        </div>
        <div class="pure-control-group">
          <button type="submit" class="pure-button pure-button-primary">Submit</button>
        </div>
        <div v-if="this.bJoinError" class="pure-control-group">
          <label class="errRow">
            <span class="errMsg">{{ this.strJoinError }}</span>
          </label>
        </div>
      </fieldset>
    </form>
    </div>
    <div class="pure-u-1 pure-u-md-1-3">
      &nbsp;
    </div>
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
      strJoinError: '',
      bSubmitted: false
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
    },
    roomCodeError: function() {
      return 'The Room Code must be four letters, no numbers'
    },
    playerNameError: function() {
      return 'The Player name must only contain letters'
    }
  },
  methods: {
    joingame: function() {
      this.strJoinError = ''
      this.bSubmitted = true
      if(!this.bGameIdValid) {
        console.error(this.roomCodeError)
        return
      }
      if(!this.bPlayerNameValid) {
        console.error(this.playerNameError)
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
div {
  padding: 5px;
}

.errRow {
  border: 1px solid lightcoral;
  background-color: lightpink;
  color: darkred;
  padding: 5px;
}

.errRow {
  text-align: center;
}
</style>
