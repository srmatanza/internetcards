<template>
  <div>
    <h1>RifTest!</h1>
    <div class="rifBox">
      <cardRif v-for="(rif, idx) in testRifs"
               :key="idx"
               :rif="rif"
               :playerName="'__dealer'"
               :bSelected="isSelected(rif)"
               :cardSelections="getSelNode(rif)"
               :playerselections="playerselections"
               v-on="selectionListeners"></cardRif>
    </div>
  </div>
</template>

<script>
import CardRif from '@/components/CardRif.vue'

import { PlayerState, Rif } from '@/state.js'
import { Card } from '@/cards.js'
import { SelectionTree } from '@/selection.js'

export default {
  name: 'rifTest',
  data: function() {
    const rifArray = [
      new Rif('hand', Rif.FACE_UP, Rif.HORIZONTAL, Rif.SINGLE),
      new Rif('_score'),
      new Rif('discard', Rif.FACE_DOWN, Rif.STACKED),
      new Rif('draw', Rif.TOP_ONLY, Rif.STACKED)
    ]
    const headlessRifs = [
      new Rif('', Rif.TOP_ONLY, Rif.VERTICAL),
      new Rif('', Rif.FACE_UP, Rif.VERTICAL, Rif.SINGLE),
      new Rif('', Rif.FACE_DOWN, Rif.VERTICAL),
      new Rif('', Rif.FACE_UP, Rif.HORIZONTAL, Rif.SINGLE),
      new Rif('', Rif.FACE_UP, Rif.HORIZONTAL, Rif.RANGE),
      new Rif('', Rif.FACE_UP, Rif.HORIZONTAL, Rif.MULTIPLE)
    ]
    headlessRifs.forEach((rif, idx) => { rif.idx = idx; return rif })
    rifArray.push(...headlessRifs)

    const newTree = new SelectionTree()
    return {
      rifArray: rifArray,
      selectionTree: newTree
    }
  },
  components: {
    CardRif
  },
  methods: {
    newPlayer: function() {
      return new PlayerState('__dealer')
    },
    getSelNode(rif) {
      const ret = this.getTree.getCardsForRif(rif.getId(), '__dealer')
      return ret
    },
    isSelected(rif) {
      const bRet = this.selectionTree.isRifSelected(rif.getId(), '__dealer')
      return bRet
    },
    paSelectRif(rif, playerName) {
      this.selectionTree.appendRif(rif.getId(), playerName)
    },
    paSelectCard(cardIdx, rif, playerName) {
      console.log('select card: ', ...arguments)
      if(rif.selectable === Rif.SINGLE) {
        this.selectionTree.selectCard(cardIdx, rif.getId(), playerName)
      } else if(rif.selectable === Rif.MULTIPLE) {
        this.selectionTree.appendCard(cardIdx, rif.getId(), playerName)
      } else if(rif.selectable === Rif.RANGE) {
        this.selectionTree.rangeCard(cardIdx, rif.length, rif.getId(), playerName)
      }
    }
  },
  computed: {
    getTree: function() {
      return this.selectionTree
    },
    getTreeRifs: function() {
      return this.selectionTree.rifs
    },
    getTreeCards: function() {
      return this.selectionTree.cards
    },
    playerselections: function() {
      return { selectedCards: [], selectedPlayer: '', selectedRif: {} }
    },
    testRifs: function() {
      const aceRun = [1, 2, 3, 4, 5].map(c => new Card(2, c))
      return this.rifArray.map(rif => {
        rif.cards = Object.assign([], aceRun)
        return rif
      })
    },
    selectionListeners: function() {
      const vm = this
      return {
        '__select-rif': vm.paSelectRif,
        '__select-card': vm.paSelectCard
      }
    }
  }
}
</script>

<style scoped>
div.rifBox {
  display: flex;
  flex-flow: row wrap;
}
</style>
