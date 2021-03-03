<template>
<div id="tableSurface">
  <div id="otherPlayers">
    <SeatedPlayer v-for="player in otherplayers"
                  :key="player.playerName"
                  :selectionTree="selectionTree"
                  :isCurrentPlayer="false"
                  :player="player" />
  </div>
  <div id="tableRifs" class="rifRack">
    <cardRif :rif="deckRif" />
    <cardRif v-for="(rif,idx) in tableRifs"
             :key="idx"
             :rif="rif"
             :bSelected="isSelected(rif)"
             :cardSelections="getSelectedCards(rif, '__dealer')"
             :playerName="'__dealer'"
             v-on="setupListeners" />
  </div>
  <div class="playerCard" :class="{ currentPlayer: currentplayer }">
    <div>
    {{ this.player.playerName }}
    </div>
    <div class="rifRack">
      <cardRif v-for="(rif,idx) in playerRifs"
                :key="idx"
                :rif="rif"
                :playerName="player.playerName"
                :bSelected="isSelected(rif)"
                :cardSelections="getSelectedCards(rif)"
                v-on="setupListeners" />
    </div>
    <div>
      <ul v-if="false">
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
</div>
</template>

<script>
import CardRif from '@/components/CardRif.vue'
import SeatedPlayer from '@/components/SeatedPlayer.vue'

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
    CardRif,
    SeatedPlayer
  },
  props: [
    'player',
    'instance',
    'playerselections',
    'selectionTree',
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
    isSelected: function(rif) {
      return this.selectionTree.isRifSelected(rif.getId(), this.player.playerName)
    },
    getSelectedCards: function(rif, playerName) {
      const pn = playerName || this.player.playerName
      return this.selectionTree.getCardsForRif(rif.getId(), pn)
    },
    getAction: function(obj) {
      if(obj.action) {
        return obj.action
      }
      return 'custom_action'
    },
    isSatisfied: function(given) {
      if(!_.isUndefined(given)) {
        const ps = this.playerSelection
        this.player = Object.assign(this.player, ps)
        const glomVars = this.instance.glomVars(this.player)
        const bSat = [Logic.isSatisfied(given, glomVars)]
        // console.debug('isSatisfied: ', given, bSat, glomVars)
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
    deckRif: function() {
      const ret = new Rif('deck', Rif.FACE_DOWN, Rif.STACKED)
      ret.cards = this.instance.gs.deck.cards
      return ret
    },
    tableRifs: function() {
      let ret = [...this.instance.gs.rifs]
      if(this.bDebugMode) {
        ret = ret.filter(rif => !rif.name.startsWith('_'))
      }
      return ret
    },
    playerRifs: function() {
      const ret = []
      for(const rif of this.player.rifs) {
        if(this.bDebugMode || !rif.name.startsWith('_')) {
          ret.push(rif)
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
    otherplayers: function() {
      return this.instance.gs.players.filter(p => p.playerName !== this.player.playerName)
    },
    gamerules: function() {
      return this.instance.currentRuleSet
    },
    currentphase: function() {
      return this.instance.gs.currentPhase
    },
    currentplayer: function() {
      return this.instance.isCurrentPlayer(this.player.playerName)
    },
    setupListeners: function() {
      const vm = this
      return {
        '__select-card': function() { vm.$emit('__select-card', ...arguments) },
        '__select-rif': function() { vm.$emit('__select-rif', ...arguments) }
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

#tableSurface {
  border: 5px solid #76ab21;
  background-color: #8ac926;
  border-radius: 5px;
  padding: 0px 15px 15px;
  margin: 0px 8px 8px;
}

.rifRack {
  display: flex;
  flex-flow: row wrap;
}
</style>
