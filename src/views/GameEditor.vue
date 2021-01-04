<template>
  <div class="gameEditor">
    <div class="heading">
      <h3>Game Editor</h3>

      <div v-if="!bGameSetup">
        <input v-model="newPlayerName" placeholder="Player Name" ref="playerNameInput"/>
        <br/>
        <button :disabled="newPlayerName === ''" @click="addPlayer(newPlayerName)">Add Player</button>
      </div>

      <div id="divPlayers" class="statebox player" v-if="numPlayers">
        <h3>Players</h3>
        <ul>
          <Player v-for="player in currentGame.players"
            :key="player.playerName"
            :player="player"
            :otherplayers="otherPlayers"
            :playerselections="playerSelections"
            :gamerules="gameRules"
            :currentphase="currentphase"
            :currentplayer="isCurrentPlayer(player.playerName)"
            :globalvars="globalVarsForPlayer"
            v-on="setupListeners" />
        </ul>
      </div>
      <div>
        <h3>Table</h3>
        <div :key="rif" v-for="rif in visibleTableRifs">
          {{ rif }}
          <span v-for="card in currentGame.cards[rif]" :key="printCard(card)">[{{ printCard(card) }}]</span>
        </div>
      </div>
    </div>

    <div id="editorGrid" class="codeEditor">
      <div class="codeOptions">
        <h3>Card Game Rules</h3>
        <button @click="parseSharp()">Compile</button>
      </div>
      <div id="sharpEditor"></div>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'

import Player from '@/components/Player.vue'

import * as CC from '@/cards.js'
import Instance from '@/instance.js'
import sharp2json from '@/sharp/transpile.js'

export default {
  name: 'gameEditor',
  data: function() {
    return {
      instance: new Instance(),
      playerSelections: {},
      sharpContent: '',
      newPlayerName: '',
      actionLog: [],
      Cards: CC,
      editor: {}
    }
  },
  components: {
    Player
  },
  mounted: function() {
    console.log('Game Editor mounted...')
    this.editor = window.ace.edit('sharpEditor')
    this.editor.setValue(this.sharpContent)
    // this.editor.on('change', this.getContent)
    // editor.setTheme('ace/theme/monokai')
    // editor.session.setMode('ace/mode/javascript')
  },
  methods: {
    parseSharp: function() {
      this.sharpContent = this.editor.getValue()
      console.log('code: ', this.sharpContent)
      try {
        const gameObj = sharp2json(this.sharpContent)

        console.log('Game Object')
        console.log(gameObj)

        this.setupGameState(gameObj)
      } catch(ex) {
        console.log('uh oh: ', ex)
      }
    },
    setupGameState: function(ruleset) {
      this.instance.setupGameState(ruleset)
    },
    printCard: function(card) {
      return CC.printCard(card)
    },
    addPlayer: function(playerName) {
      console.log('method: addPlayer', playerName)
      if(playerName !== '') {
        this.$refs.playerNameInput.focus()
        this.newPlayerName = ''
        this.currentGame.addPlayer(playerName)
      } else {
        console.error('Player name cannot be empty')
      }
    },
    getIdxForPlayerName: function(playerName) {
      for(const pidx in this.currentGame.players) {
        const player = this.currentGame.players[pidx]
        if(playerName === player.playerName) {
          return pidx
        }
      }
      return -1
    },
    getPlayerNameForIdx: function(pidx) {
      if(pidx>=0) {
        return this.currentGame.players[pidx].playerName
      }
      return ''
    },
    isCurrentPlayer: function(pn) {
      return this.currentGame.isCurrentPlayer(pn)
    },
    paSelectCard: function(card, thisPlayer) {
      const player = this.playerSelections[thisPlayer.playerName] || { selectedCards: [], selectedPlayer: '' }
      let sc
      if(_.includes(player.selectedCards, card)) {
        sc = _.filter(player.selectedCards, c => !_.isEqual(c, card))
      } else {
        sc = _.concat(player.selectedCards, card)
      }
      player.selectedCards = sc
      this.playerSelections[thisPlayer.playerName] = player
      this.playerSelections = _.assign({}, this.playerSelections)
      console.log('paSelectCard event handler', card.toString(), sc, this.playerSelections)
    },
    paSelectPlayer: function(otherPlayer, thisPlayer) {
      const player = this.playerSelections[thisPlayer.playerName] || { selectedCards: [], selectedPlayer: '' }
      if(_.isEqual(player.selectedPlayer, otherPlayer)) {
        player.selectedPlayer = ''
      } else {
        player.selectedPlayer = otherPlayer
      }
      this.playerSelections[thisPlayer.playerName] = player
      this.playerSelections = _.assign({}, this.playerSelections)
      console.log('paSelectPlayer event handler', otherPlayer, this.playerSelections)
    },
    shuffleDeck: function() {
      const newDeck = CC.shuffleDeck(this.currentGame.deck)
      this.currentGame.deck = newDeck
    }
  },
  computed: {
    currentGame: {
      get: function() {
        return this.instance.gs
      },
      set: function(newGS) {
        this.instance.setGameState(newGS)
      }
    },
    visibleTableRifs: function() {
      const rifs = []
      for(const rif in this.currentGame.cards) {
        if(Array.isArray(this.currentGame.cards[rif]) && !rif.startsWith('_')) {
          rifs.push(rif)
        }
      }
      return rifs
    },
    bRuleSetLoaded: function() {
      return this.currentGame.currentRuleSet !== undefined
    },
    bGameSetup: function() {
      return _.isEqual({}, this.currentGame)
    },
    numPlayers: function() {
      if(!this.bGameSetup) {
        return this.currentGame.players.length
      }
      return -1
    },
    otherPlayers: function() {
      return this.currentGame.players
    },
    currentphase: function() {
      return this.currentGame.currentPhase
    },
    gameRules: function() {
      if(this.currentGame && this.currentGame.currentRuleSet) {
        return this.currentGame.currentRuleSet
      }
      return {}
    },
    globalVarsForPlayer: function() {
      return {
        $playerCount: this.currentGame.getPlayerCount(),
        $otherPlayers: this.otherPlayers
      }
    },
    setupListeners: function() {
      const ret = this.instance.paListeners((event, player) => {
        this.actionLog.push({
          action: event.id,
          playerName: player.playerName,
          selectedCards: player.selectedCards || [],
          selectedPlayer: player.selectedPlayer || ''
        })
        this.playerSelections = {}
      })
      const giHandlers = {
        '__select-card': this.paSelectCard,
        '__select-player': this.paSelectPlayer
      }
      return _.assign(ret, giHandlers)
    }
  }
}
</script>

<style scoped>
#editorGrid {
  height: 500px;
}
#sharpEditor {
  width: 100%;
  height: 100%;
}
.gameEditor {
  padding: 25px;
  display: grid;
  grid-template-columns: 4fr 3fr;
}

.codeOptions {
  padding: 5px;
}

.player ul {
  list-style-type: none;
  padding: 2px;
}

.player li {
  border: 1px solid chartreuse;
  margin: 4px;
  padding: 6px 8px;
}

.statebox, .historyBox {
  /*
    border: 1px solid black;
    margin: 10px;
    padding: 4px;
  */
  width: 22em;
  text-align: start;
  float: left;
}

</style>
