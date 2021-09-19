<template>
  <div>
    <TopHeader :links="links"/>
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
  </div>
</template>

<script>
import axios from 'axios'
import TopHeader from '@/components/TopHeader.vue'

export default {
  name: 'Home',
  components: {
    TopHeader
  },
  data: function() {
    return {
      gameId: '',
      playerName: '',
      strJoinError: '',
      bSubmitted: false,
      whoami: {}
    }
  },
  mounted: function() {
    console.log('Home.vue: ', this.$session, this.$session.exists(), this.$session.getAll())
  },
  created() {
    axios
      .get('/api/whoami')
      .then(res => {
        this.whoami = res.data
        console.log('whoami: ', this.whoami)
      })
  },
  computed: {
    links: function() {
      const ret = []
      if(this.whoami.gid) {
        ret.push({
          name: 'Rejoin Game',
          href: '/game'
        })
      }
      return ret
    },
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
.home div {
  padding: 0.5em;
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
