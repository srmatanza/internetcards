<template>
<div>
  <TopHeader :links="links" />
  <div class="pure-g">
    <div class="pure-u-1 pure-u-md-1-3">
      &nbsp;
    </div>

    <div class="pure-u-1 pure-u-md-1-3">
      <h1>Set up a new game!</h1>
      <form id="creategame" class="pure-form pure-form-stacked" @submit.prevent="createGame">
        <fieldset>
          <div class="pure-control-group">
            <select v-model="selectedGame">
              <option disabled value="">Select a game type</option>
              <option v-for="rs in ruleSets" :key="rs">{{ rs }}</option>
            </select>
          </div>

          <div class="pure-control-group">
            <label for="savehistory" class="pure-checkbox">
            <input type="checkbox" id="savehistory" v-model="toggleHistory">
            Save history for this game.
            </label>
            <label for="checkjoin" class="pure-checkbox">
            <input type="checkbox" id="checkjoin" v-model="toggleJoin">
            Join game immediately
            </label>
            <span v-if="toggleJoin">
              <label for="form-playername">Player Name</label>
              <input type="text" v-model="playerName" id="form-playername" placeholder="Be nice" />
            </span>
          </div>

          <div class="pure-control-group">
             <button type="submit" class="pure-button pure-button-primary" :disabled="bCantSubmit">Create a New Game</button>
          </div>

          <div class="pure-control-group">
            <p>Current Games</p>
            <ul>
              <li v-for="game in this.currentGames" :key="game.gameId">{{ game.gameId }}</li>
            </ul>
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
import _ from 'lodash'
import axios from 'axios'
import TopHeader from '@/components/TopHeader.vue'

export default {
  name: 'dashboard',
  components: {
    TopHeader
  },
  data: function() {
    return {
      currentGames: [],
      ruleSets: [],
      selectedGame: '',
      toggleJoin: false,
      toggleHistory: false,
      playerName: '',
      bSubmitted: false,
      whoami: {}
    }
  },
  created: function() {
    axios
      .get('/api/rulesets')
      .then(res => {
        if(!_.isUndefined(res.data)) {
          this.ruleSets = res.data
        }
      })
    axios
      .get('/api/whoami')
      .then(res => {
        if(!res.data.authd) {
          console.debug('You don\'t appear to be logged in.')
          this.$router.push('/login')
        }
        this.whoami = res.data
      })
      .catch(err => {
        console.debug('Catch: ', err.response)
        this.$router.push('/login')
      })
  },
  computed: {
    links: function() {
      const ret = [{
        name: 'Home',
        href: '/'
      }]
      if(this.whoami.gid) {
        ret.push({
          name: 'Rejoin Game',
          href: '/game'
        })
      }
      return ret
    },
    bCantSubmit: function() {
      if(this.toggleJoin) {
        return (this.selectedGame === '' || !this.bPlayerNameValid || this.bSubmitted)
      } else {
        return (this.selectedGame === '' || this.bSubmitted)
      }
    },
    bPlayerNameValid: function() {
      return /^[a-zA-Z]+$/.test(this.playerName.trim())
    }
  },
  methods: {
    createGame: function() {
      this.bSubmitted = true
      const postData = {
        ruleset: this.selectedGame,
        saveHistory: this.toggleHistory
      }
      if(this.toggleJoin) {
        postData.playerName = this.playerName.trim()
      }
      console.log('Creating game: ', postData)
      axios
        .post('/api/newgame', postData)
        .then(response => {
          console.log('We created a new game!', response)
          if(this.toggleJoin) {
            this.$router.push('/game')
          } else {
            this.currentGames.push(response.data)
            this.bSubmitted = false
          }
        })
        .catch(err => {
          console.debug('Catch: ', err.response)
        })
    }
  }
}
</script>
<style scoped>
.pure-g div {
  padding: 5px;
}
</style>
