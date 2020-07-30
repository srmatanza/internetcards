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
    <RuleSet :rules="currentGame.currentRuleSet" :currentphase="currentphase" @update-currentphase="this.efChangePhase"/>

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
    isCurrentPlayer: function(playerName) {
      return this.getPlayerNameForIdx(this.currentGame.currentPlayerIdx) === playerName
    },
    getPlayerNameForIdx: function(pidx) {
      if(pidx>=0) {
        return this.currentGame.players[pidx].playerName
      }
      return ''
    },
    drawCard: function(playerName) {
      const pIdx = this.getIdxForPlayerName(playerName)
      const numCards = 1
      console.log('drawing card for ', playerName, pIdx)
      const _n = numCards || 1
      Actions.draw(this.currentGame, pIdx, _n)
    },
    efSetVar: function(vars, player) {
      console.log('set var', vars)
      for(const vn in vars) {
        if(typeof vars[vn] === 'object') {
          vars[vn] = Logic.computeRule(vars[vn], this.glomVars(player))
        }
      }
      this.currentGame = Effects.setVar(this.currentGame, vars)
    },
    efSetVarPlayer: function(vars, player) {
      console.log('set var for player', vars, player)
      const newVars = _.cloneDeep(vars)
      for(const vn in newVars) {
        if(typeof newVars[vn] === 'object') {
          newVars[vn] = Logic.computeRule(newVars[vn], this.glomVars(player))
        }
      }

      this.currentGame = Effects.setVarPlayer(this.currentGame, newVars, player)
    },
    efSetVarEachPlayer: function(vars, fromPlayer) {
      console.log('set each var for player', vars)
      for(const player of this.currentGame.players) {
        this.efSetVarPlayer(vars, player)
      }
    },
    efChangePhase: function(newPhase, player) {
      console.debug('change phase', arguments)
      this.currentGame = Effects.changePhase(this.currentGame, newPhase)
    },
    efIncrementVar: function(vars, player) {
      console.debug('increment var', arguments)
      for(const vn in vars) {
        if(typeof vars[vn] === 'object') {
          vars[vn] = Logic.computeRule(vars[vn], this.glomVars(player))
        }
      }
      this.currentGame = Effects.incrementVar(this.currentGame, vars)
    },
    efAdvancePlayer: function(incr, player) {
      console.debug('advance player', incr)
      if(typeof incr === 'object') {
        incr = Logic.computeRule(incr, this.glomVars(player))
      }
      this.currentGame = Effects.advancePlayer(this.currentGame, incr)
    },
    efSetPlayer: function(idx, player) {
      console.debug('set player', idx)
      let newIdx = idx
      if(typeof newIdx === 'object') {
        newIdx = Logic.computeRule(newIdx, this.glomVars(player))
      }
      newIdx = parseInt(newIdx)
      this.currentGame = Effects.setPlayer(this.currentGame, newIdx)
    },
    handleEffect: function(effect, player) {
      if(this.isSatisfied(effect.given, player)) {
        for(const ef in effect) {
          const fn = this.setupEffectHandlers[ef]
          if(typeof fn === 'function') {
            fn.call(this, effect[ef], player)
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
      const phaseVars = {}
      const playerVars = _.clone(this.currentGame.currentRuleSet.playerVars)
      const pv = {
        $player: player,
        $playerVars: _.assign(playerVars, player.playerVariables),
        $isYourTurn: this.isCurrentPlayer(player.playerName)
      }

      return _.assign({}, this.gameRules.gameVariables, this.globalVarsForPlayer, phaseVars, pv)
    },
    isSatisfied: function(given, player, bIsYourTurn, gameRules, globalVars) {
      // console.log('isSatisfied: ', given)
      if(!_.isUndefined(given)) {
        const bSat = Logic.isSatisfied(given, this.glomVars(player))
        return !_.includes(bSat, false)
      }
      return true
    },
    paNewRound: function(e, player) {
      const newGame = Actions.newRound(this.currentGame)
      this.currentGame = newGame
    },
    paCustomAction: function(e, player) {
      const newGame = Actions.customAction(this.currentGame)
      this.currentGame = newGame
    },
    paDeal: function(e, player) {
      const newGame = Actions.deal(this.currentGame, e.cards)
      this.currentGame = newGame
    },
    paPass: function(e, player) {
      const fromPlayerIdx = this.getIdxForPlayerName(player.playerName)
      const toPlayerIdx = this.getIdxForPlayerName(player.selectedPlayer)
      const newGame = Actions.pass(this.currentGame, fromPlayerIdx, player.selectedCards, toPlayerIdx)
      this.currentGame = newGame

      this.currentGame.players[fromPlayerIdx].selectedPlayer = ''
      this.currentGame.players[fromPlayerIdx].selectedCards = []
    },
    paLead: function(e, player) {
      const playerIdx = this.getIdxForPlayerName(player.playerName)
      this.currentGame = Actions.playCard(this.currentGame, playerIdx, player.selectedCards[0])

      this.currentGame.players[playerIdx].selectedPlayer = ''
      this.currentGame.players[playerIdx].selectedCards = []
    },
    paPlayCard: function(e, player) {
      const playerIdx = this.getIdxForPlayerName(player.playerName)
      this.currentGame = Actions.playCard(this.currentGame, playerIdx, player.selectedCards[0])

      this.currentGame.players[playerIdx].selectedPlayer = ''
      this.currentGame.players[playerIdx].selectedCards = []
    },
    paTakeTrick: function(e, player) {
      const playerIdx = this.getIdxForPlayerName(player.playerName)
      this.currentGame = Actions.takeTrick(this.currentGame, playerIdx, this.currentGame.trick)
      this.currentGame.trick = []
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
        set_var: this.efSetVar,
        set_var_player: this.efSetVarPlayer,
        set_var_each_player: this.efSetVarEachPlayer,
        change_phase: this.efChangePhase,
        increment_var: this.efIncrementVar,
        advance_player: this.efAdvancePlayer,
        set_player: this.efSetPlayer,
        given: Symbol('given')
      }
    },
    setupListeners: function() {
      const mm = this
      function wrapListener(fn, name) {
        return (e, p) => {
          console.log(name + ' event handler: ', e, p)
          fn.call(mm, e, p)
          mm.handleEffects(e.effect, p)
        }
      }
      return {
        'draw-card': this.drawCard,
        __deal: wrapListener(this.paDeal, '__deal'),
        __pass: wrapListener(this.paPass, '__pass'),
        __lead: wrapListener(this.paLead, '__lead'),
        __play_card: wrapListener(this.paPlayCard, '__play_card'),
        __take_trick: wrapListener(this.paTakeTrick, '__take_trick'),
        __new_round: wrapListener(this.paNewRound, '__new_round'),
        __custom_action: wrapListener(this.paCustomAction, '__custom_action'),
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
