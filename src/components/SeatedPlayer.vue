<template>
  <div class="seatedPlayerBox">
    <div class="rifRack">
      <h3>{{ player.playerName }}</h3>
      <cardRif :key="'hand'"
               :rif="playerHand"
               :bSelected="false"
               :playerName="player.playerName" />
      <cardRif v-for="(rif, idx) in playerRifs"
               :key="idx"
               :rif="rif"
               :bSelected="isSelected(rif)"
               :playerName="player.playerName"
               v-on="setupListeners" />
    </div>
  </div>
</template>
<script>
import CardRif from '@/components/CardRif.vue'
import { Rif } from '@/state.js'

export default {
  name: 'seatedPlayer',
  data: function() {
    return {
    }
  },
  components: {
    CardRif
  },
  props: [
    'player',
    'isCurrentPlayer',
    'selectionTree',
    'bDebugMode'
  ],
  methods: {
    isSelected: function(rif) {
      return this.selectionTree.isRifSelected(rif.getId(), this.player.playerName)
    }
  },
  computed: {
    setupListeners: function() {
      const vm = this
      return {
        '__select-card': function() { vm.$emit('__select-card', ...arguments) },
        '__select-rif': function() { vm.$emit('__select-rif', ...arguments) }
      }
    },
    playerHand: function() {
      const ret = new Rif('hand', Rif.ORIENT_FACEDOWN | Rif.DISP_STACKED)
      ret.cards = this.player.rifs.hand.cards
      return ret
    },
    playerRifs: function() {
      return [...this.player.rifs].filter(r => {
        return (r.getId() !== 'hand' && (this.bDebugMode === true || !r.getId().startsWith('_')))
      })
    }
  }
}
</script>
<style scoped>
.rifRack {
  font-size: .75em;
  display: flex;
  flex-flow: row-reverse wrap;
}

.rifRack > h3 {
  width: 5em;
}
</style>
