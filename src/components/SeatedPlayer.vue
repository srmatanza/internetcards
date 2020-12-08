<template>
  <div class="seatedPlayerBox"
      :style="{ width: playerWidth + '%'}">
    <div class="playerBox" :class="{ curplayer: isCurrentPlayer }">
      <div>{{ this.playerName }}</div>
      <div>
        <ul>
          <li v-for="(hand,idx) in hands" :key="idx">{{ hand }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'seatedPlayer',
  data: function() {
    return {
    }
  },
  props: [
    'playerName',
    'isCurrentPlayer',
    'numPlayers',
    'totalPlayers',
    'hands'
  ],
  computed: {
    playerWidth: function() {
      return (1 / this.numPlayers) * 200
    }
  }
}
</script>
<style scoped>
.seatedPlayerBox > div {
  padding: 4px;
  margin: 2px;
}
</style>
