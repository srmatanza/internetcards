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
      new Rif('hand', Rif.SEL_SINGLE),
      new Rif('_score'),
      new Rif('discard', Rif.ORIENT_FACEDOWN | Rif.DISP_STACKED),
      new Rif('draw', Rif.ORIENT_TOPONLY | Rif.DISP_STACKED)
    ]
    const headlessRifs = [
      new Rif('', Rif.ORIENT_TOPONLY | Rif.DISP_VERTICAL),
      new Rif('', Rif.DISP_VERTICAL | Rif.SEL_SINGLE),
      new Rif('', Rif.ORIENT_FACEDOWN | Rif.DISP_VERTICAL),
      new Rif('', Rif.SEL_SINGLE),
      new Rif('', Rif.SEL_RANGE),
      new Rif('', Rif.SEL_MULTIPLE)
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
      if(rif.flags & Rif.SEL_SINGLE) {
        this.selectionTree.selectCard(cardIdx, rif.getId(), playerName)
      } else if(rif.flags & Rif.SEL_MULTIPLE) {
        this.selectionTree.appendCard(cardIdx, rif.getId(), playerName)
      } else if(rif.flags & Rif.SEL_RANGE) {
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
