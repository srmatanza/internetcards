<template>
<div>
  <li :class="{ currentPlayer: currentplayer }">
  {{ this.player.playerName }}
  <br/>
  <span v-if="!bEmptyHand" class="playerHand">
    <span v-for="card in this.player.hand"
          :key="printCard(card)"
          :class="{ selected: isSelected(card) }"
          @click="$emit('__' + 'select-card', card, player)"> [{{ printCard(card) }}] </span>
  </span>
  <br/>
  <ul v-if="bShowPlayers">
    <li v-for="op in this.otherplayers"
        :key="op.playerName"
        :class="{ selected: isPlayerSelected(op.playerName) }"
        @click="$emit('__' + 'select-player', op.playerName, player)">{{ op.playerName }}</li>
  </ul>
  <br/>
  <button v-if="bDebug" click="$emit('draw-card', player.playerName)">Draw</button>
  <button :disabled="!isSatisfied(obj.given)"
          @click="$emit('__'+obj.action, obj, player, playerSelection)"
          v-for="obj in this.playerActions"
          :key="obj.name">{{ obj.name ? obj.name : name }}</button>
  </li>
</div>
</template>

<script>
import _ from 'lodash'
import * as CC from '@/cards.js'
import Logic from '@/logic.js'

export default {
  name: 'player',
  data: function() {
    return {
    }
  },
  props: [
    'player',
    'bShowPlayers',
    'otherplayers',
    'gamerules',
    'playerselections',
    'currentphase',
    'currentplayer',
    'globalvars'
  ],
  methods: {
    printCard: function(card) {
      // console.log('Printing card')
      return CC.printCard(card)
    },
    isPlayerSelected: function(opName) {
      return _.isEqual(opName, this.playerSelection.selectedPlayer)
    },
    isSelected: function(card) {
      for(const cc of this.playerSelection.selectedCards) {
        if(cc.val === card.val && cc.suit === card.suit) {
          return true
        }
      }
      return false
    },
    isSatisfied: function(given) {
      // console.log('isSatisfied: ', given)
      if(!_.isUndefined(given)) {
        const phaseVars = {}
        const playerVars = {
          $player: this.player,
          $isYourTurn: this.currentplayer
        }
        const globalVarsForPlayer = {
          $possiblePlayers: this.gamerules.possiblePlayers
        }
        playerVars.$selectedCards = this.playerSelection.selectedCards
        const sp = this.otherplayers.filter(p => p.playerName === this.playerSelection.selectedPlayer)[0]
        playerVars.$selectedPlayer = sp || {}

        _.assign(playerVars, this.player.playerVariables)
        _.assign(globalVarsForPlayer, this.globalvars)

        const glomVars = _.assign({}, this.gamerules.gameVariables, globalVarsForPlayer, phaseVars, playerVars)

        const bSat = Logic.isSatisfied(given, glomVars)
        // console.log('isSatisfied: ', given, bSat, glomVars)
        return !_.includes(bSat, false)
      }
      return true
    }
  },
  computed: {
    bDebug: function() {
      return false
    },
    playerSelection: function() {
      return this.playerselections[this.player.playerName] || { selectedCards: [], selectedPlayer: '' }
    },
    bEmptyHand: function() {
      return (this.player.hand.length === 0)
    },
    playerActions: function() {
      for(const phase in this.gamerules.gameplay) {
        if(this.gamerules.gameplay[phase].name === this.currentphase) {
          return this.gamerules.gameplay[phase].playerActions
        }
      }
      return []
    }
  }
}
</script>

<style scoped>

.playerHand {
  font-size: 1.25em;
}

li.currentPlayer {
  border: 2px solid forestgreen;
}

.selected {
  background-color: lightcoral;
}

button {
  margin-left: 1em;
}
</style>
