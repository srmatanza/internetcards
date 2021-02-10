<template>
<div :class="[rifDisplay]">
  <ul>
    <li v-for="(card,idx) in rif"
        :key="idx"
        :class="{
          selected: isSelected(card),
          redCard: isRedCard(card),
          blackCard: isBlackCard(card),
          faceDown: isFaceDown
        }"
        @click="clickCard(card, player)">
        <span :style="{ opacity: isFaceDown ? '0%' : '100%' }">{{ printCard(card) }}</span></li>
  </ul>
</div>
</template>
<script>
import { Rif, PlayerState } from '@/state.js'
export default {
  name: 'cardRif',
  data: function() {
    return {
      selCards: this.selectedCards || [],
      curPlayer: this.player || new PlayerState(),
      orderedCards: this.rif.cards.map((c, i) => Object.assign({ idx: i }, c))
    }
  },
  props: [
    'rif',
    'bDebugMode',
    'bRifSelected',
    'selectedCards',
    'playerselections',
    'player'
  ],
  mounted: function() {
    // console.debug('oc: ', this.orderedCards, this.rif)
  },
  methods: {
    printCard: function(card) {
      if(this.rif.orientation === Rif.FACE_DOWN) {
        return 'X'
      }
      return card.toString()
    },
    isRedCard: function(card) {
      return card.suit === 2 || card.suit === 3
    },
    isBlackCard: function(card) {
      return card.suit === 1 || card.suit === 4
    },
    isSelected: function(card) {
      for(const cc of this.playerSelection.selectedCards) {
        if(cc.val === card.val && cc.suit === card.suit) {
          return true
        }
      }
      return false
    },
    clickCard: function(card, player) {
      if(this.isSelectable) {
        this.$emit('__' + 'select-card', card, player)
      }
    }
  },
  computed: {
    playerSelection: function() {
      return this.playerselections[this.player.playerName] || { selectedCards: [], selectedPlayer: '', selectedRif: {} }
    },
    isFaceDown: function() {
      return this.rif.orientation === Rif.FACE_DOWN
    },
    isHorizontal: function() {
      return this.rif.display === Rif.HORIZONTAL
    },
    isVertical: function() {
      return this.rif.display === Rif.VERTICAL
    },
    isStacked: function() {
      return this.rif.display === Rif.STACKED
    },
    isSelectable: function() {
      return this.rif.selectable !== Rif.NONE
    },
    rifDisplay: function() {
      switch(this.rif.display) {
        case Rif.HORIZONTAL:
          return 'horizontal'
        case Rif.VERTICAL:
          return 'vertical'
        case Rif.STACKED:
          return 'stacked'
        default:
          return ''
      }
    },
    rifOrientation: function() {
      switch(this.rif.orientation) {
        case Rif.FACE_UP:
          return 'faceUp'
        case Rif.FACE_DOWN:
          return 'faceDown'
        case Rif.TOP_ONLY:
          return 'topOnly'
        default:
          return ''
      }
    }
  }
}
</script>

<style scoped>

div.horizontal, div.stacked {
  flex-basis: 100%;
}

.vertical ul {
  flex-flow: column wrap;
  margin-top: 2.2em;
}

.horizontal ul, .stacked ul {
  flex-flow: row wrap;
}

ul {
  font-size: 1.25em;
  display: flex;
  list-style: none;
  user-select: none;
}

.horizontal li {
  margin: .2em .2em .2em -.6em;
}

.vertical li {
  margin: -1em .2em .2em .2em;
}

.stacked li {
  margin: .2em .2em .2em -.6em;
}

li {
  background-color: whitesmoke;
  text-align: center;
  width: 1.8em;
  padding: .9em .2em;
  border-radius: 5px;
  border: 1px solid #093048;
}

li.faceDown {
  background: linear-gradient(45deg, blue, pink);
}

li.selected {
  /* color: #3d2d00; */
  background-color: #FFCA3A;
}

.blackCard {
  color: darkslategray;
}

.redCard {
  color: #ff595e;
}
</style>
