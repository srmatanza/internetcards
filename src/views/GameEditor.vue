<template>
  <div>
    <TopHeader :links="links"/>

    <div class="gameEditor">
      <div class="heading">
        <h3>Game Editor</h3>

        <div v-if="!bGameSetup">
          <form ref="fmAddPlayer" id="editorForm">
            <span>
              <input v-model.trim="newPlayerName" placeholder="Player Name" ref="playerNameInput"/>&nbsp;
              <input type="submit" :disabled="newPlayerName === ''" @click="addPlayer(newPlayerName)" value="Add Player" />
            </span>
            <span>
              <input type="checkbox" id="chkDebug" v-model="bDebugMode" />
              <label>Debug Mode</label>
            </span>
            <span>
              <input type="checkbox" id="chkShowCurrent" v-model="bOnlyShowCurrent" />
              <label>Only show the current player</label>
            </span>
          </form>
        </div>

        <h3>Players</h3>
        <div id="divPlayers" class="statebox player" v-if="numPlayers && !bOnlyShowCurrent">
          <Player v-for="player in currentGame.players"
            :key="player.playerName"
            :player="player"
            :otherplayers="otherPlayers"
            :playerselections="playerSelections"
            :gamerules="gameRules"
            :currentphase="currentphase"
            :currentplayer="isCurrentPlayer(player.playerName)"
            :globalvars="globalVarsForPlayer"
            :bDebugMode="bDebugMode"
            v-on="setupListeners" />
        </div>
        <div id="currentPlayer" class="statebox player" v-if="bOnlyShowCurrent">
          <Player
            :key="currentPlayer.playerName"
            :player="currentPlayer"
            :otherplayers="otherPlayers"
            :playerselections="playerSelections"
            :gamerules="gameRules"
            :currentphase="currentphase"
            :currentplayer="true"
            :globalvars="globalVarsForPlayer"
            :bDebugMode="bDebugMode"
            v-on="setupListeners" />
        </div>
        <CardTable :rifs="this.currentGame.cards"
                   :otherplayers="otherPlayers"
                   :bDebugMode="bDebugMode"
                   :gameVars="gameVars" />
      </div>

      <div id="editorGrid" class="codeEditor">
        <div class="codeOptions">
          <h3>Card Game Rules</h3>
          <div>
            <button @click="parseSharp()">Compile</button>
          </div>
          <div>
            <input type="file" id="gameSrc" name="gameSrc" accept=".sharp" @change="uploadSharp" />
            <label for="gameSrc">Upload Source</label>
          </div>
          <div>
            <button @click="downloadSharp()" :disabled="!bCanDownload">Download Source</button>
          </div>
        </div>
        <div id="sharpEditor"></div>
      </div>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'

import Player from '@/components/Player.vue'
import TopHeader from '@/components/TopHeader.vue'
import CardTable from '@/components/CardTable.vue'

import * as CC from '@/cards.js'
import Instance from '@/instance.js'
import sharp2json from '@/sharp/transpile.js'

// One hundred kilo-bytes ought to be enough for anyone
const MAX_FILE_SIZE = 100 * 1024

export default {
  name: 'gameEditor',
  data: function() {
    return {
      instance: new Instance(),
      playerSelections: {},
      sharpContent: '',
      newPlayerName: '',
      bDebugMode: false,
      bOnlyShowCurrent: false,
      actionLog: [],
      Cards: CC,
      editor: {}
    }
  },
  components: {
    Player,
    TopHeader,
    CardTable
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
    uploadSharp: function(evt) {
      const sharpFile = evt.target.files[0]
      console.log('file: ', sharpFile)

      if(sharpFile.length > MAX_FILE_SIZE) {
        console.error('This file is way too big, try a smaller one')
        return
      }
      sharpFile.text().then(text => {
        this.editor.setValue(text)
        this.parseSharp()
      })
    },
    downloadSharp: function() {
      const sharpFilename = 'download.sharp'
      const sharpBlob = new Blob([this.editor.getValue()], { type: 'text/plain' })
      const fObj = new File([sharpBlob], sharpFilename)
      const urlObj = URL.createObjectURL(fObj)

      // Create a download link for the file, immediately click it, then revoke the URL
      const dl = document.createElement('a')
      dl.href = urlObj
      dl.download = sharpFilename
      const clickHandler = () => {
        setTimeout(() => {
          URL.revokeObjectURL(urlObj)
          dl.removeEventListener('click', clickHandler)
        }, 150)
      }
      dl.addEventListener('click', clickHandler, false)
      dl.click()
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
    links: function() {
      return [
        {
          name: 'Home',
          href: '/'
        }
      ]
    },
    currentGame: {
      get: function() {
        return this.instance.gs
      },
      set: function(newGS) {
        this.instance.setGameState(newGS)
      }
    },
    currentPlayer: function() {
      return this.currentGame.getCurrentPlayer()
    },
    bCanDownload: function() {
      if(this.editor.getValue) {
        return this.editor.getValue().length>0
      }
      return false
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
    gameVars: function() {
      if(this.currentGame && this.currentGame.currentRuleSet) {
        return this.currentGame.currentRuleSet.gameVariables
      }
      return {}
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
#editorForm {
  display: flex;
  flex-direction: column;
}

#editorGrid {
  height: 650px;
}

#sharpEditor {
  width: 100%;
  height: 100%;
  resize: vertical;
}

.gameEditor {
  padding: 25px;
  display: grid;
  grid-template-columns: 4fr 3fr;
}

.codeOptions {
  padding: 5px;
  display: flex;
  flex-flow: column wrap;
}

.codeOptions div {
  margin: 4px 0px;
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

.heading {
  display: flex;
  flex-direction: column;
}

#divPlayers {
  display: flex;
  flex-flow: row wrap;
}

</style>
