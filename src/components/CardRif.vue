<template>
<div :class="[rifDisplay]">
  <ul :class="{ selected: bSelected}" @click="clickRif()">
    <li v-if="isStacked" :class="['card', { faceDown: isFaceDown }]"></li>
    <li v-for="(card,idx) in cardsInRif"
        :key="idx"
        :class="[{
          selected: isSelected(idx),
          redCard: isRedCard(card),
          blackCard: isBlackCard(card),
          faceDown: isFaceDown
        },'card']"
        @click.stop="clickCard(idx)">
        <span :style="{ opacity: isFaceDown ? '0%' : '100%' }">{{ printCard(card) }}</span></li>
    <li v-if="isStacked" class="cardCount">x{{ rif.length }}</li>
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
    'playerName',
    'bSelected',
    'cardSelections'
  ],
  mounted: function() {
    // console.log('mounting rif: ', this.rif.getId(), this.cardsInRif, this.rif instanceof Rif)
  },
  methods: {
    printCard: function(card) {
      if(this.rif.orientation === Rif.FACE_DOWN) {
        return 'X'
      }
      return card.toString()
    },
    isRedCard: function(card) {
      if(card) {
        return card.suit === 2 || card.suit === 3
      }
      return false
    },
    isBlackCard: function(card) {
      if(card) {
        return card.suit === 1 || card.suit === 4
      }
      return false
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
        this.$emit('__' + 'select-rif', this.rif, this.playerName)
      }
    },
    clickCard: function(cardIdx) {
      if(this.isSelectable) {
        this.$emit('__' + 'select-card', cardIdx, this.rif, this.playerName)
      }
    }
  },
  computed: {
    rifId: function() {
      return this.rif.getId()
    },
    cardsInRif: function() {
      if(this.isStacked) {
        return [this.rif[0]]
      }
      return this.rif.cards
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

/*
div.horizontal, div.stacked {
  flex-basis: 100%;
}
*/

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
  border-radius: 1em;
  list-style: none;
  user-select: none;
  margin: .5em;
}

.horizontal li {
  margin: .2em .2em .2em -.6em;
}

.stacked li:nth-child(1) {
  margin: .2em .2em .2em .2em;
}
.stacked li:nth-child(2) {
  margin-left: -2.25em;
  margin-top: .4em;
}

.vertical li {
  margin: -1.4em .2em .2em .2em;
}

li.card {
  background-color: whitesmoke;
  text-align: center;
  width: 1.8em;
  padding: .9em .2em;
  border-radius: 5px;
  border: 1px solid #093048;
}

li.cardCount {
  color: whitesmoke;
  background-color: #ff595e;
  font-size: .75em;
  height: 1.2em;
  border: solid .05em whitesmoke;
  border-radius: .6em;
  margin-left: -.4em;
  margin-top: -.2em;
  padding: .2em;
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
