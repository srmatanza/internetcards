<template>
<div class="playerCard" :class="{ currentPlayer: currentplayer }">
  <div>
  {{ this.player.playerName }}
  </div>
  <cardRif :rif="player.rifs['hand']"
            :player="player"
            :playerselections="playerselections"
            v-on="setupListeners"></cardRif>
  <cardRif v-for="(rif,idx) in playerRifs"
            :key="idx"
            :rif="rif"
            :player="player"
            :playerselections="playerselections"
            v-on="setupListeners"></cardRif>
  <div>
    <ul v-if="bShowPlayers">
      <li v-for="op in this.otherplayers"
          :key="op.playerName"
          :class="{ selected: isPlayerSelected(op.playerName) }"
          @click="$emit('__' + 'select-player', op.playerName, player)">{{ op.playerName }}</li>
    </ul>
  </div>
  <div>
    <ul>
      <li :key="varName.name" v-for="varName in playerVariables">{{ varName.name }}: {{ varName.value }}</li>
    </ul>
  </div>
  <div>
    <button :disabled="!isSatisfied(obj.given)"
            @click="$emit('__'+getAction(obj), obj, player, playerSelection)"
            v-for="obj in this.playerActions"
            :key="obj.name">{{ obj.name ? obj.name : name }}</button>
  </div>
  <div class="msgBubble" v-show="this.player.currentMessage.msgText !== ''">
    <span>{{ this.player.currentMessage.msgText }}</span>
  </div>
</div>
</template>

<script>
import CardRif from '@/components/CardRif.vue'

import _ from 'lodash'
import * as CC from '@/cards.js'
import Logic from '@/logic.js'
import { Rif } from '@/state.js'

export default {
  name: 'player',
  data: function() {
    return {
    }
  },
  components: {
    CardRif
  },
  props: [
    'player',
    'bShowPlayers',
    'otherplayers',
    'gamerules',
    'gamevars',
    'playerselections',
    'currentphase',
    'currentplayer',
    'bDebugMode'
  ],
  methods: {
    printCard: function(card) {
      // console.log('Printing card')
      return CC.printCard(card)
    },
    isPlayerSelected: function(opName) {
      return _.isEqual(opName, this.playerSelection.selectedPlayer)
    },
    isRedCard: function(card) {
      return card.suit === 2 || card.suit === 3
    },
    isBlackCard: function(card) {
      return card.suit === 1 || card.suit === 4
    },
    isSelected: function(card) {
      for(const cc of this.playerSelection.selectedCards) {
        if(cc.val === card.val && cc.suit === card.suit) {
          return true
        }
      }
      return false
    },
    getAction: function(obj) {
      if(obj.action) {
        return obj.action
      }
      return 'custom_action'
    },
    isSatisfied: function(given) {
      // console.log('isSatisfied: ', given)
      if(!_.isUndefined(given)) {
        const phaseVars = {}
        const sp = this.otherplayers.filter(p => p.playerName === this.playerSelection.selectedPlayer)[0]
        const selectedCardsRif = new Rif()
        selectedCardsRif.cards = this.playerSelection.selectedCards
        const playerVars = {
          $player: this.player,
          $isYourTurn: this.currentplayer,
          $selectedCards: selectedCardsRif,
          $selectedPlayer: sp || {}
        }
        const globalVarsForPlayer = {
          $playerCount: this.otherplayers.length,
          $otherPlayers: this.otherplayers,
          $possiblePlayers: this.gamerules.possiblePlayers
        }

        _.assign(playerVars, this.player.playerVariables)

        const glomVars = _.assign({}, this.gamevars, globalVarsForPlayer, phaseVars, playerVars)

        const bSat = [Logic.isSatisfied(given, glomVars)]
        // console.log('isSatisfied: ', given, bSat, glomVars)
        return !_.includes(bSat, false)
      }
      return true
    }
  },
  computed: {
    playerSelection: function() {
      return this.playerselections[this.player.playerName] || { selectedCards: [], selectedPlayer: '', selectedRif: {} }
    },
    bEmptyHand: function() {
      return (this.player.rifs.hand.length === 0)
    },
    playerHand: function() {
      if(this.player.rifs.hand) {
        return this.player.rifs.hand.cards
      }
      return []
    },
    playerRifs: function() {
      const ret = []
      for(const rif of this.player.rifs) {
        if(rif.name !== 'hand') {
          if(this.bDebugMode || !rif.name.startsWith('_')) {
            ret.push(rif)
          }
        }
      }
      return ret
    },
    playerVariables: function() {
      const ret = []
      for(const idx in this.player.playerVariables) {
        const vv = {
          name: idx,
          value: this.player.playerVariables[idx]
        }
        if(this.bDebugMode || !vv.name.startsWith('_')) {
          ret.push(vv)
        }
      }
      return ret
    },
    playerActions: function() {
      for(const phase of this.gamerules.gameplay) {
        if (phase.name === this.currentphase) {
          return phase.playerActions
        }
      }
      return []
    },
    setupListeners: function() {
      const vm = this
      return {
        '__select-card': (card, player) => vm.$emit('__select-card', card, player),
        '__select-rif': (idx, player) => vm.$emit('__select-rif', idx, player)
      }
    }
  }
}
</script>

<style scoped>
.playerHand {
  font-size: 1.25em;
  display: flex;
  flex-flow: row wrap;
  margin-left: .8em;
}

.playerHand > span {
  background-color: whitesmoke;
  text-align: center;
  width: 1.8em;
  margin: .2em .2em .2em -.6em;
  padding: .9em .2em;
  border-radius: 5px;
  border: 1px solid #093048;
}

.msgBubble {
  background-color: #ff595e;
  border-radius: 5px;
  padding: 5px;
  margin: 15px 5px 5px 5px;
}

.playerCard {
  color: #edf7fd;
  background-color: #1982C4;
  width: 545px;
  border-radius: 5px;
  padding: 15px;
  margin: 8px;
}

.currentPlayer {
  border: 5px solid #FF595E;
  padding: 10px;
}

span.selected {
  /* color: #3d2d00; */
  background-color: #FFCA3A;
}

.blackCard {
  color: darkslategray;
}

.redCard {
  color: #ff595e;
}

button {
  margin-left: 1em;
}
</style>
