<template>
  <div class="gameInstance">
    <div id="divActions" class="statebox">
      <h3>Global Actions</h3>
      <button v-if="bGameSetup" @click="setupGameState">Create Game State</button>&nbsp;
      <div v-if="!bGameSetup">
        <input v-model="newPlayerName" placeholder="Player Name" ref="playerNameInput"/>
        <br/>
        <button :disabled="newPlayerName === ''" @click="addPlayer(newPlayerName)">Add Player</button>
      </div>
    </div>

    <GameState v-if="!bGameSetup" :state="currentGame"/>
    <RuleSet v-if="bRuleSetLoaded" :rules="currentGame.currentRuleSet" :currentphase="currentphase" @update-currentphase="this.changePhase"/>
    <GameHistory :history="actionLog" />

    <div id="divPlayers" class="statebox player" v-if="numPlayers">
      <h3>Players</h3>
      <ul>
        <Player v-for="player in currentGame.players"
            :key="player.playerName"
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
</template>

<script>
import _ from 'lodash'

import GameState from '@/components/GameState.vue'
import RuleSet from '@/components/RuleSet.vue'
import Player from '@/components/Player.vue'
import GameHistory from '@/components/GameHistory.vue'

import Actions from '@/actions.js'
import Effects from '@/effects.js'

import * as CC from '@/cards.js'
import Instance from '@/instance.js'
import axios from 'axios'

export default {
  name: 'gameInstance',
  data: function() {
    return {
      instance: new Instance(),
      playerSelections: {},
      phaseorder: 0,
      newPlayerName: '',
      actionLog: [],
      Cards: CC
    }
  },
  components: {
    GameState,
    RuleSet,
    Player,
    GameHistory
  },
  created: function() {
    axios
      .get('/api/rulesets/hearts')
      .then(res => {
        if(!_.isUndefined(res.data)) {
          this.setupGameState(res.data)
        }
      })
  },
  methods: {
    addPlayer: function(playerName) {
      console.log('method: addPlayer', playerName)
      if(playerName !== '') {
        this.$refs.playerNameInput.focus()
        this.newPlayerName = ''
        this.currentGame.addPlayer(playerName)
      } else {
        console.error('Player name cannot be empty')
      }
    },
    setupGameState: function(ruleset) {
      console.log('method: setupGameState')
      this.instance.setupGameState(ruleset)
    },
    getIdxForPlayerName: function(playerName) {
      for(const pidx in this.currentGame.players) {
        const player = this.currentGame.players[pidx]
        if(playerName === player.playerName) {
          return pidx
        }
      }
      return -1
    },
    getPlayerNameForIdx: function(pidx) {
      if(pidx>=0) {
        return this.currentGame.players[pidx].playerName
      }
      return ''
    },
    isCurrentPlayer: function(pn) {
      return this.currentGame.isCurrentPlayer(pn)
    },
    changePhase: function(newPhase) {
      this.currentGame = Effects.changePhase(this.currentGame, newPhase)
    },
    drawCard: function(playerName) {
      const pIdx = this.getIdxForPlayerName(playerName)
      const numCards = 1
      console.log('drawing card for ', playerName, pIdx)
      const _n = numCards || 1
      Actions.draw(this.currentGame, pIdx, _n)
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
    },
    shuffleDeck: function() {
      const newDeck = CC.shuffleDeck(this.currentGame.deck)
      this.currentGame.deck = newDeck
    }
  },
  computed: {
    currentGame: {
      get: function() {
        return this.instance.gs
      },
      set: function(newGS) {
        this.instance.setGameState(newGS)
      }
    },
    bRuleSetLoaded: function() {
      return this.currentGame.currentRuleSet !== undefined
    },
    bGameSetup: function() {
      return _.isEqual({}, this.currentGame)
    },
    numPlayers: function() {
      if(!this.bGameSetup) {
        return this.currentGame.players.length
      }
      return -1
    },
    otherPlayers: function() {
      return this.currentGame.players
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
      const ret = this.instance.paListeners((event, player) => {
        this.actionLog.push({
          action: event.id,
          playerName: player.playerName,
          selectedCards: player.selectedCards || [],
          selectedPlayer: player.selectedPlayer || ''
        })
        this.playerSelections = {}
      })
      const giHandlers = {
        '__select-card': this.paSelectCard,
        '__select-player': this.paSelectPlayer
      }
      return _.assign(ret, giHandlers)
    }
  }
}
</script>

<style>
button {
  margin: 2px;
}

.gameInstance {
  padding: 12px;
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

.statebox, .historyBox {
  /*
    border: 1px solid black;
    margin: 10px;
    padding: 4px;
  */
  width: 22em;
  text-align: start;
  float: left;
}

#divPlayers {
  clear: both;
}
</style>
