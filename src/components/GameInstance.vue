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
      <br/>
      <button v-if="!bGameSetup" @click="shuffleDeck()">Shuffle Deck</button>
    </div>

    <GameState v-if="!bGameSetup" :state="currentGame"/>
    <RuleSet :rules="currentGame.currentRuleSet" :currentphase="currentphase" @update-currentphase="this.changePhase"/>

    <div id="divPlayers" class="statebox player" v-if="numPlayers">
      <h3>Players</h3>
      <ul>
        <Player v-for="player in currentGame.players"
            :key="player.playerName"
            :player="player"
            :otherplayers="otherPlayers"
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

import Actions from '@/actions.js'
import Effects from '@/effects.js'
import Logic from '@/logic.js'

import Hearts from '@/rulesets/hearts.js'

import * as CC from '@/cards.js'
import * as State from '@/state.js'

export default {
  name: 'gameInstance',
  data: function() {
    return {
      currentGame: {},
      phaseorder: 0,
      newPlayerName: '',
      Cards: CC
    }
  },
  components: {
    GameState,
    RuleSet,
    Player
  },
  created: function() {
    this.setupGameState(Hearts)
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
      this.currentGame = new State.GameState()
      if(ruleset) {
        this.currentGame.currentRuleSet = ruleset
        this.currentGame.currentPhase = ruleset.initialPhase
      }
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
    handleEffect: function(effect, player) {
      if(this.isSatisfied(effect.given, player)) {
        for(const ef in effect) {
          const fn = this.setupEffectHandlers[ef]
          if(typeof fn === 'function') {
            this.currentGame = fn.call({}, this.currentGame, effect[ef], player)
          } else if(_.isUndefined(fn)) {
            console.error('Undefined function for effect: ', ef)
          }
        }
      }
    },
    handleEffects: function(effects, player) {
      if(Array.isArray(effects)) {
        for(const ef in effects) {
          this.handleEffect(effects[ef], player)
        }
      } else {
        this.handleEffect(effects, player)
      }
    },
    glomVars: function(player) {
      return this.currentGame.glomVars(player)
    },
    isSatisfied: function(given, player) {
      // console.log('isSatisfied: ', given)
      if(!_.isUndefined(given)) {
        const bSat = Logic.isSatisfied(given, this.glomVars(player))
        return !_.includes(bSat, false)
      }
      return true
    },
    paSelectCard: function(card, playerName) {
      // console.log('paSelectCard event handler', card, playerName)
      const pIdx = this.getIdxForPlayerName(playerName)
      const player = this.currentGame.players[pIdx]
      let sc
      if(_.includes(player.selectedCards, card)) {
        sc = _.filter(player.selectedCards, c => !_.isEqual(c, card))
      } else {
        sc = _.concat(player.selectedCards, card)
      }
      this.currentGame.players[pIdx].selectedCards = sc
    },
    paSelectPlayer: function(otherPlayer, thisPlayer) {
      // console.log('paSelectPlayer event handler', otherPlayer, thisPlayer)
      const pIdx = this.getIdxForPlayerName(thisPlayer)
      const player = this.currentGame.players[pIdx]
      if(_.isEqual(player.selectedPlayer, otherPlayer)) {
        this.currentGame.players[pIdx].selectedPlayer = ''
      } else {
        this.currentGame.players[pIdx].selectedPlayer = otherPlayer
      }
    },
    shuffleDeck: function() {
      const newDeck = CC.shuffleDeck(this.currentGame.deck)
      this.currentGame.deck = newDeck
    }
  },
  computed: {
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
    setupEffectHandlers: function() {
      return {
        set_var: Effects.setVar,
        set_var_player: Effects.setVarPlayer,
        set_var_each_player: Effects.setVarEachPlayer,
        change_phase: Effects.changePhase,
        increment_var: Effects.incrementVar,
        advance_player: Effects.advancePlayer,
        set_player: Effects.setPlayer,
        given: Symbol('given')
      }
    },
    setupListeners: function() {
      const mm = this
      function wrapListener(fn, name) {
        return (e, p) => {
          console.log(name + ' event handler: ', e, p)
          mm.currentGame = fn.call(mm, mm.currentGame, e, p.idx)
          mm.handleEffects(e.effect, p)
        }
      }
      return {
        'draw-card': this.drawCard,
        __deal: wrapListener(Actions.deal, '__deal'),
        __pass: wrapListener(Actions.pass, '__pass'),
        __lead: wrapListener(Actions.playCard, '__lead'),
        __play_card: wrapListener(Actions.playCard, '__play_card'),
        __take_trick: wrapListener(Actions.takeTrick, '__take_trick'),
        __new_round: wrapListener(Actions.newRound, '__new_round'),
        __custom_action: wrapListener(Actions.customAction, '__custom_action'),
        __select_card: this.paSelectCard,
        __select_player: this.paSelectPlayer
      }
    }
  }
}
</script>

<style>
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

.statebox {
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
