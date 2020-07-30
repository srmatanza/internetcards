<template>
<div>
  <li :class="{ currentPlayer: currentplayer }">
  {{ this.player.playerName }}
  <br/>
  <span v-if="!bEmptyHand">
    <span v-for="card in this.player.hand"
          :key="printCard(card)"
          :class="{ selected: isSelected(card) }"
          @click="$emit('__select_card', card, player.playerName)">[{{ printCard(card) }}]</span>
  </span>
  <br/>
  <ul>
    <li v-for="op in this.otherplayers"
        :key="op.playerName"
        :class="{ selected: isPlayerSelected(op.playerName) }"
        @click="$emit('__select_player', op.playerName, player.playerName)">{{ op.playerName }}</li>
  </ul>
  <br/>
  <button v-if="bDebug" click="$emit('draw-card', player.playerName)">Draw</button>
  <button :disabled="!isSatisfied(obj.given)" @click="$emit('__'+name, obj, player)" v-for="(obj, name) in this.playerActions" :key="name">{{ obj.name ? obj.name : name }}</button>
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
    'otherplayers',
    'gamerules',
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
      return _.isEqual(opName, this.player.selectedPlayer)
    },
    isSelected: function(card) {
      return _.includes(this.player.selectedCards, card)
    },
    isSatisfied: function(given) {
      // console.log('isSatisfied: ', given)
      if(!_.isUndefined(given)) {
        const phaseVars = {}
        const playerVars = {
          $player: this.player,
          $isYourTurn: this.currentplayer
        }
        _.assign(playerVars, this.player.playerVariables)

        const glomVars = _.assign({}, this.gamerules.gameVariables, this.globalvars, phaseVars, playerVars)

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
