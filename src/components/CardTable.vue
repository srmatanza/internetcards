<template>
  <div class="cardTable">
    <h3>Table</h3>
    <div>
      <h4>Rifs</h4>
      <cardRif v-for="(rif,idx) in tableRifs" :key="idx" :rif="rif" :playerName="'__dealer'"></cardRif>
    </div>
    <div>
      <h4>Game Variables</h4>
      <ul>
      <li :key="varName.name" v-for="varName in gameVariables">{{ varName.name }}: {{ varName.value }}</li>
      </ul>
    </div>
  </div>
</template>
<script>
import * as CC from '@/cards.js'
import CardRif from '@/components/CardRif.vue'

export default {
  name: 'cardTable',
  data: function() {
    return {
      Cards: CC
    }
  },
  components: {
    CardRif
  },
  props: [
    'rifs',
    'otherplayers',
    'gamevars',
    'bDebugMode'
  ],
  methods: {
    printCard: function(card) {
      return CC.printCard(card)
    }
  },
  computed: {
    gameVariables: function() {
      const ret = []
      for(const idx in this.gamevars) {
        const vv = {
          name: idx,
          value: this.gamevars[idx]
        }
        if(this.bDebugMode || !vv.name.startsWith('_')) {
          ret.push(vv)
        }
      }
      return ret
    },
    tableRifs: function() {
      let ret = [...this.rifs].filter(rif => rif.name !== '_cards')
      if(this.bDebugMode) {
        ret = ret.filter(rif => !rif.name.startsWith('_'))
      }
      return ret
    }
  }
}
</script>
<style>
.cardTable {
  border: 5px solid #76ab21;
  background-color: #8ac926;
  width: 535px;
  border-radius: 5px;
  padding: 0px 15px 15px;
  margin: 0px 8px 8px;
}
</style>
