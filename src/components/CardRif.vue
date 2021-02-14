<template>
<div :class="[rifDisplay]">
  <ul :class="{ selected: bSelected}" @click="clickRif()">
    <li v-for="(card,idx) in rif"
        :key="idx"
        :class="{
          selected: isSelected(idx),
          redCard: isRedCard(card),
          blackCard: isBlackCard(card),
          faceDown: isFaceDown
        }"
        @click.stop="clickCard(idx)">
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
    'selectedCards',
    'playerselections',
    'playerName',
    'bSelected',
    'cardSelections'
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
    isSelected: function(idx) {
      if(this.cardSelections) {
        return this.cardSelections.includes(idx)
      }
      return false
    },
    clickRif: function() {
      //
      if(this.isSelectable) {
        this.$emit('__' + 'select-rif', this.rifId, this.playerName)
      }
    },
    clickCard: function(cardIdx) {
      if(this.isSelectable) {
        this.$emit('__' + 'select-card', cardIdx, this.rifId, this.playerName)
      }
    }
  },
  computed: {
    rifId: function() {
      return this.rif.getId()
    },
    playerSelection: function() {
      const defaultSel = { selectedCards: [], selectedPlayer: '', selectedRif: {} }
      if(this.playerselections) {
        return this.playerselections[this.playerName] || defaultSel
      }
      return defaultSel
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
  padding: 2.5em 1em 1em 1em;
}

.horizontal ul, .stacked ul {
  flex-flow: row wrap;
  padding: 1em 1em 1em 1.6em;
}

ul.selected {
  background: linear-gradient(0deg, #a993c8, #ff8589);
}

ul {
  font-size: 1.25em;
  display: flex;
  background-color: #156ca2;
  list-style: none;
  user-select: none;
  margin: 1em;
}

.horizontal li, .stacked li {
  margin: .2em .2em .2em -.6em;
}

.vertical li {
  margin: -1.4em .2em .2em .2em;
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
