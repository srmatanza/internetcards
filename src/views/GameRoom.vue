<template>
  <div id="gameRoom">
  <div class="pure-g">
    <div class="pure-u-1 pure-u-lg-1">
      <h1>Game Joined!</h1>
      <p>{{ whoami.playerName }}: {{ whoami.gid }}</p>
    </div>
  </div>

  <div class="pure-g">
    <div class="pure-u-1 pure-u-lg-1">
      <ul>
        <li v-for="(gVar, idx) in this.getPlayerVars" :key="idx">{{ idx + ': ' + gVar }}</li>
      </ul>
      <GameState v-if="bGameLoaded" :state="this.currentGame"/>
    </div>
  </div>

  <div class="pure-g">
    <div class="pure-u-1 pure-u-lg-1">
      <ul v-if="bGameLoaded">
        <Player
            :player="player"
            :otherplayers="otherPlayers"
            :playerselections="playerSelections"
            :gamerules="gameRules"
            :currentphase="currentphase"
            :currentplayer="isCurrentPlayer(player.playerName)"
            :globalvars="globalVarsForPlayer"
            v-on="setupListeners" />
      </ul>
    </div>
  </div>

  </div>
</template>
<script>
import GameState from '@/components/GameState.vue'
import Player from '@/components/Player.vue'
import _ from 'lodash'
import axios from 'axios'

import * as State from '@/state.js'

export default {
  name: 'gameRoom',
  components: {
    Player,
    GameState
  },
  data() {
    return {
      whoami: {},
      instance: {},
      playerSelections: {},
      rtms: 1000
    }
  },
  created() {
    axios
      .get('/api/whoami')
      .then(res => {
        if(_.isUndefined(res.data.gid) || _.isUndefined(res.data.playerName)) {
          this.$router.push('/')
        }
        this.whoami = res.data
      })
    this.reloadGameState()
    console.log('pure: ', pure)
  },
  computed: {
    bGameLoaded: function() {
      return !_.isUndefined(this.currentGame)
    },
    currentGame: {
      get: function() {
        return this.instance.gs
      },
      set: function(newGS) {
        this.instance.gs = newGS
      }
    },
    player: function() {
      if(this.bGameLoaded) {
        const p = this.currentGame.getPlayer(this.whoami.playerName)
        console.log('player cv: ', this.currentGame, p, this.whoami.playerName)
        return p
      }
      return undefined
    },
    getPlayerVars: function() {
      if(this.player) {
        return this.player.playerVariables
      }
      return []
    },
    numPlayers: function() {
      if(this.bGameLoaded) {
        return this.currentGame.players.length
      }
      return -1
    },
    otherPlayers: function() {
      if(this.bGameLoaded) {
        return this.currentGame.players
      }
      return []
    },
    currentphase: function() {
      return this.currentGame.currentPhase
    },
    gameRules: function() {
      if(this.currentGame && this.currentGame.currentRuleSet) {
        return this.currentGame.currentRuleSet
      }
      return {}
    },
    globalVarsForPlayer: function() {
      return {
        $playerCount: this.currentGame.getPlayerCount(),
        $otherPlayers: this.otherPlayers
      }
    },
    setupListeners: function() {
      const mm = this
      function wrapListener(name) {
        return (e, p) => {
          console.log(name + ' client event handler: ', e, p)
          axios
            .post('/api/playeraction/' + name, mm.playerSelections[mm.player.playerName])
            .then(response => {
              mm.setGameState(response.data)
            })
          mm.playerSelections = {}
        }
      }
      return {
        __deal: wrapListener('deal'),
        __pass: wrapListener('pass'),
        __lead: wrapListener('lead'),
        __play_card: wrapListener('play_card'),
        __take_trick: wrapListener('take_trick'),
        __new_round: wrapListener('new_round'),
        __custom_action: wrapListener('custom_action'),
        '__select-card': this.paSelectCard,
        '__select-player': this.paSelectPlayer
      }
    }
  },
  methods: {
    setGameState: function(newState) {
      this.instance = newState
      this.currentGame = _.assign(new State.GameState(), newState.instance.gs)
    },
    reloadGameState: function() {
      console.log('Reloading gamestate...')
      axios
        .get('/api/gamestate')
        .then(res => {
          console.log('then: ', res)
          this.setGameState(res.data)
          if(this.rtms < 20000) {
            this.rtms += 1000
            setTimeout(this.reloadGameState.bind(this), this.rtms)
          }
        })
        .catch(err => {
          console.error('Reload catch: ', err)
          this.$router.push('/')
        })
    },
    isCurrentPlayer: function(pn) {
      return this.currentGame.isCurrentPlayer(pn)
    },
    paSelectCard: function(card, thisPlayer) {
      const player = this.playerSelections[thisPlayer.playerName] || { selectedCards: [], selectedPlayer: '' }
      let sc
      if(_.includes(player.selectedCards, card)) {
        sc = _.filter(player.selectedCards, c => !_.isEqual(c, card))
      } else {
        sc = _.concat(player.selectedCards, card)
      }
      player.selectedCards = sc
      this.playerSelections[thisPlayer.playerName] = player
      this.playerSelections = _.assign({}, this.playerSelections)
      console.log('paSelectCard event handler', card, sc, this.playerSelections)
    },
    paSelectPlayer: function(otherPlayer, thisPlayer) {
      const player = this.playerSelections[thisPlayer.playerName] || { selectedCards: [], selectedPlayer: '' }
      if(_.isEqual(player.selectedPlayer, otherPlayer)) {
        player.selectedPlayer = ''
      } else {
        player.selectedPlayer = otherPlayer
      }
      this.playerSelections[thisPlayer.playerName] = player
      this.playerSelections = _.assign({}, this.playerSelections)
      console.log('paSelectPlayer event handler', otherPlayer, this.playerSelections)
    }
  }
}
</script>
<style>

div {
  padding: 2px;
}

button {
  margin: 2px;
}

.player ul {
  list-style-type: none;
  padding: 2px;
}

.player li {
  border: 1px solid chartreuse;
  margin: 4px;
  padding: 6px 8px;
}

</style>
