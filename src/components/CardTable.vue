<template>
  <div class="cardTable">
    <h3>Table</h3>
    <div>
      <h4>Rifs</h4>
      <div :key="rif" v-for="rif in tableRifs">
        {{ rif }}
        <span v-for="card in rifs[rif]" :key="printCard(card)">[{{ printCard(card) }}]</span>
      </div>
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

export default {
  name: 'cardTable',
  data: function() {
    return {
      Cards: CC
    }
  },
  props: [
    'rifs',
    'otherplayers',
    'gameVars',
    'bDebugMode'
  ],
  methods: {
    printCard: function(card) {
      return CC.printCard(card)
    }
  },
  computed: {
    tableRifs: function() {
      const ret = []
      for(const rif in this.rifs) {
        if(Array.isArray(this.rifs[rif]) && rif !== '_cards') {
          ret.push(rif)
        }
      }
      return ret
    },
    gameVariables: function() {
      const ret = []
      for(const idx in this.gameVars) {
        const vv = {
          name: idx,
          value: this.gameVars[idx]
        }
        if(this.bDebugMode || !vv.name.startsWith('_')) {
          ret.push(vv)
        }
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
