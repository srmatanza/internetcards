<template>
  <div>
    <h1>RifTest!</h1>
    <div class="rifBox">
      <cardRif v-for="(rif, idx) in testRifs" :key="idx" :rif="rif" :player="newPlayer()" :playerselections="playerselections"></cardRif>
    </div>
  </div>
</template>

<script>
import CardRif from '@/components/CardRif.vue'

import { PlayerState, Rif } from '@/state.js'
import { Card } from '@/cards.js'

export default {
  name: 'rifTest',
  data: function() {
    return {
    }
  },
  components: {
    CardRif
  },
  methods: {
    newPlayer: function() {
      return new PlayerState('__dealer')
    }
  },
  computed: {
    playerselections: function() {
      return { selectedCards: [], selectedPlayer: '', selectedRif: {} }
    },
    testRifs: function() {
      const aceRun = [1, 2, 3, 4, 5].map(c => new Card(2, c))
      const rifArray = [
        new Rif('hand', Rif.FACE_UP, Rif.HORIZONTAL, Rif.SINGLE),
        new Rif('_score'),
        new Rif('', Rif.TOP_ONLY, Rif.VERTICAL),
        new Rif('', Rif.FACE_UP, Rif.VERTICAL, Rif.SINGLE),
        new Rif('', Rif.FACE_DOWN, Rif.VERTICAL),
        new Rif('', Rif.FACE_UP, Rif.HORIZONTAL, Rif.RANGE),
        new Rif('', Rif.TOP_ONLY, Rif.HORIZONTAL, Rif.MULTIPLE),
        new Rif('draw', Rif.TOP_ONLY, Rif.STACKED),
        new Rif('discard', Rif.FACE_DOWN, Rif.STACKED)
      ]
      return rifArray.map(rif => {
        rif.cards = Object.assign([], aceRun)
        return rif
      })
    }
  }
}
</script>

<style scoped>
div.rifBox {
  display: flex;
  flex-flow: row wrap;
  width: 50%;
}
</style>
