<template>
  <div id="divGameState" class="statebox">
    <h3>Game State</h3>
    <div>
      <div>
        <span>currentPlayer: </span>
        <span>{{ this.state.currentPlayerIdx }}</span>
        <span>&nbsp;of&nbsp;</span>
        <span>{{ this.state.players.length }}</span>
      </div>
      <div><span>deck: </span><span>{{ this.state.deck.cards.length }}</span></div>
      <div><span>discardPile: </span><span>{{ this.state.discard.length }}</span></div>
      <div><span v-for="card in this.state.trick" :key="printCard(card)">[{{ printCard(card) }}]</span></div>
    </div>
  </div>
</template>

<script>

import * as CC from '@/cards.js'

export default {
  name: 'gameState',
  data: function() {
    return {
    }
  },
  props: [
    'state'
  ],
  created: function() {
  },
  methods: {
    printCard: function(card) {
      // console.log('Printing card')
      return CC.printCard(card)
    }
  }
}
</script>

<style scoped>
</style>
