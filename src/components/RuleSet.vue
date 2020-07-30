<template>
  <div id="divRuleSet" class="statebox">
    <h3>Rule Set</h3>
    <div>
      <div>Possible Players: <span>{{ possiblePlayers }}</span></div>
      <div>Game Variables
      <ul>
        <li v-for="(gVar, idx) in this.rules.gameVariables" :key="idx">{{ idx + ': ' + gVar }}</li>
      </ul>
      </div>
      <!-- <div>Current Phase: <span>{{ currentphase }}</span>
      </div> -->
      <div>Gameplay
      <ul>
        <li v-for="phase in this.rules.gameplay" :key="phase.name">
          <!--
          <span :class="{ 'curphase': isCurrentPhase(phase.name) }">{{ phase.name }}</span>
          -->
          <!--
          <input type="radio" @change="$emit('update:currentphase', $event.target.value)" :value="phase.name">
          -->
          <input type="radio" @change="updateCurrentPhase($event)" :checked="currentphase===phase.name" :value="phase.name">
          <label :for="phase.name">{{phase.name}}</label>
        </li>
      </ul>
      </div>
      <div>Player Actions
      </div>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
// import * as CC from '../cards.js'
// import * as Actions from '../actions.js'

export default {
  name: 'ruleSet',
  created: function() {
  },
  data: function() {
    return {
    }
  },
  props: [
    'rules',
    'currentphase'
  ],
  computed: {
    possiblePlayers: function() {
      return _.sortBy(this.rules.possiblePlayers).join(', ')
    }
  },
  methods: {
    updateCurrentPhase: function(e) {
      console.log(e)
      this.$emit('update-currentphase', e.target.value)
    },
    isCurrentPhase: function(phaseName) {
      return (this.currentphase === phaseName)
    }
  }
}
</script>

<style scoped>
.curphase {
  font-weight: bold;
}
ul {
  margin: 0;
}
</style>
