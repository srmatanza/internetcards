<template>
  <div class="historyBox">
    <span class="histHeading">Action Log</span>
    <!--
    <span class="msg">Player did a action with selectedCards to selectedPlayer</span>
    -->
    <span class="msg" v-for="(log,idx) in this.lastThree" :key="idx">{{ logMessage(log) }}</span>
  </div>
</template>
<script>
export default {
  data: function() {
    return {
    }
  },
  props: [
    'history'
  ],
  computed: {
    lastThree: function() {
      const start = Math.max(0, this.history.length-3)
      return this.history.slice(start)
    }
  },
  methods: {
    logMessage: function(log) {
      let ret = `${log.playerName} did a ${log.action}`
      if(log.selectedCards.length) {
        ret += ` with ${log.selectedCards}`
      }
      if(log.selectedPlayer.length) {
        ret += ` to ${log.selectedPlayer}`
      }
      return ret
    }
  }
}
</script>
<style scoped>
.historyBox {
  padding: 4px;
}
.histHeading {
  background-color: lightgray;
}

.historyBox > span {
  display: block;
}
</style>
