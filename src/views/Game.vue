<template>
  <div class="game">
    <h1>Let's play a game!</h1>
    <GameInstance type="hearts" />
  </div>
</template>

<script>
import GameInstance from '@/components/GameInstance.vue'

export default {
  components: {
    GameInstance
  }
}
</script>
