<template>
  <div>
    <TopHeader :links="links"/>

    <div class="gameEditor">
      <div class="heading">
        <h3>Game Editor</h3>

        <div v-if="bGameSetup">
          <form ref="fmAddPlayer" id="editorForm" @submit.prevent="addPlayer">
            <span>
              <input v-model.trim="newPlayerName" placeholder="Player Name" ref="playerNameInput"/>&nbsp;
              <input type="submit" :disabled="newPlayerName === ''" value="Add Player" />
            </span>
            <span>
              <input type="checkbox" id="chkDebug" v-model="bDebugMode" />
              <label>Debug Mode</label>
            </span>
            <span>
              <select v-if="currentGame.players.length" v-model="viewingPlayer">
                <option v-for="player in currentGame.players" :key="player.playerName">{{ player.playerName }}</option>
              </select>
            </span>
          </form>
        </div>

        <div id="currentPlayer" class="statebox player" v-if="viewingPlayer !== ''">
          <Player
            :key="currentPlayer.playerName"
            :player="currentPlayer"
            :playerselections="playerSelections"
            :selectionTree="selectionTree"
            :instance="instance"
            :bDebugMode="bDebugMode"
            v-on="setupListeners" />
        </div>
      </div>

      <div id="editorGrid" class="codeEditor">
        <div class="codeOptions">
          <h3>Card Game Rules</h3>
          <div>
            <button type="button" @click="resetState()">Reset</button>&nbsp;
            <input type="text" v-model.trim="rngseed" />
          </div>
          <div>
            <button type="button" disabled>Back</button>
            <button type="button" @click="nextAction()" :disabled="!bCanSkip">Next</button>
            <button type="button" @click="continueAction()" :disabled="!bCanSkip">Cont</button>
          </div>
          <div>
            <label for="gameSrc">Upload Source </label>
            <input type="file" id="gameSrc" name="gameSrc" accept=".sharp" @change="uploadSharp" />
          </div>
          <div>
            <button @click="downloadSharp()" :disabled="!bCanDownload">Download Source</button>&nbsp;
            <button @click="downloadActionLog()" :disabled="!bCanSaveActions">Download Actions</button>
          </div>
          <div id="stateWindow">
            <h3>Save Slots</h3>
            <span v-for="slot in stateStack" :key="slot.name">
              <label>Slot {{ slot.name }}</label>
              <button v-show="!slot.lastUsed && !isSlotEmpty(slot)" class="btnOverwriteState" @click="eraseSlot(slot, $event)">Erase</button>
              <button v-show="!slot.lastUsed" :class="{ btnUsedState: !isSlotEmpty(slot) }" :style="{ height: !isSlotEmpty(slot) ? '1.8em' : '4em' }" @click="selectSlot(slot, $event)">{{ getSlotText(slot) }}</button>
              <button v-show="slot.lastUsed" :style="{ opacity: isSlotChanged(slot) ? '100%' : '25%' }" :disabled="!isSlotChanged(slot)" class="btnReloadState" @click="selectSlot(slot, $event)">Reload</button>
              <button v-show="slot.lastUsed" :style="{ opacity: isSlotChanged(slot) ? '100%' : '25%' }" :disabled="!isSlotChanged(slot)" class="btnOverwriteState" @click="saveSlot(slot, $event)">Save</button>
            </span>
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

import * as CC from '@/cards.js'
import { Rif, RifArray } from '@/state.js'
import { SelectionTree } from '@/selection.js'
import Instance from '@/instance.js'
import sharp2json from '@/sharp/transpile.js'

// One hundred kilo-bytes ought to be enough for anyone
const MAX_FILE_SIZE = 100 * 1024
var editTimeoutId

function createTextDownload(fileName, textFile) {
  const sharpFilename = fileName
  const sharpBlob = new Blob([textFile], { type: 'text/plain' })
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
}

export default {
  name: 'gameEditor',
  data: function() {
    const newTree = new SelectionTree()
    return {
      instance: new Instance(),
      playerSelections: {},
      selectionTree: newTree,
      sharpContent: '',
      newPlayerName: '',
      viewingPlayer: '',
      rngseed: 'weenus',
      bGameLocked: false,
      bGameSetup: false,
      bDebugMode: false,
      bOnlyShowCurrent: false,
      actionLog: [],
      actPC: 0,
      stateStack: _.map(['A', 'B', 'C', 'D'], nm => ({ name: nm, gs: {}, apc: 0 })),
      Cards: CC,
      editor: {}
    }
  },
  components: {
    Player,
    TopHeader
  },
  mounted: function() {
    console.log('Game Editor mounted...')
    this.editor = window.ace.edit('sharpEditor')
    this.editor.setValue(this.sharpContent)
    this.editor.on('change', this.contentChanged)
    // editor.setTheme('ace/theme/monokai')
    // editor.session.setMode('ace/mode/javascript')
  },
  methods: {
    parseSharp: function() {
      this.sharpContent = this.editor.getValue()
      // console.log('code: ', this.sharpContent)
      let bErr = false
      try {
        const gameObj = sharp2json(this.sharpContent, {
          syntaxError: (recognizer, offendingSymbol, line, col, msg, err) => {
            console.error('syntaxError: ', offendingSymbol, line, col, msg, err)
            this.editor.session.addGutterDecoration(line, 'lineError')
            bErr = true
          },
          reportAttemptingFullContext: () => { console.debug('reportAttemptingFullContext: ', ...arguments) },
          reportContextSensitivity: () => { console.debug('reportContextSensitivity: ', ...arguments) },
          reportAmbiguity: () => { console.debug('reportAmbiguity: ', ...arguments) }
        })
        if(!bErr) {
          console.log('Recompiled!')
          this.setupGameState(gameObj)
        }
      } catch(ex) {
        console.log('We caught an error: ', ex)
      }
    },
    resetState: function() {
      this.actPC = 0
      this.bGameSetup = false
      const playerNames = this.currentGame.players.map(p => p.playerName)
      this.parseSharp()
      playerNames.forEach(pn => this.instance.addPlayer(pn))
    },
    contentChanged: function() {
      clearTimeout(editTimeoutId)
      editTimeoutId = setTimeout(this.parseSharp, 500)
    },
    isSlotEmpty: function(slot) {
      return _.isEqual(slot.gs, {})
    },
    isSlotChanged: function(slot) {
      return !_.isEqual(slot.gs, this.currentGame)
    },
    getSlotText: function(slot) {
      if(this.isSlotEmpty(slot)) {
        return 'New ' + slot.name
      }
      return 'Load'
    },
    eraseSlot: function(slot, evt) {
      slot.gs = {}
    },
    saveSlot: function(slot, evt) {
      // only gets called if this slot is already current
      slot.gs = _.cloneDeep(this.currentGame)
    },
    selectSlot: function(slot, evt) {
      if(_.isEqual(this.currentGame, {})) {
        return
      }
      if(_.isEqual(slot.gs, {})) {
        slot.gs = _.cloneDeep(this.currentGame)
      } else {
        this.currentGame = _.cloneDeep(slot.gs)
        this.currentGame.rifs = Object.assign(new RifArray(), this.currentGame.rifs)
        for(const idx in this.currentGame.players) {
          this.currentGame.players[idx].rifs = Object.assign(new RifArray(), this.currentGame.players[idx].rifs)
          for(const jdx in this.currentGame.players[idx].rifs._r) {
            this.currentGame.players[idx].rifs._r[jdx] = Object.assign(new Rif(), this.currentGame.players[idx].rifs._r[jdx])
          }
        }
      }
      for(const sl of this.stateStack) {
        sl.lastUsed = false
      }
      slot.lastUsed = true
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
      createTextDownload('download.sharp', this.editor.getValue())
    },
    downloadActionLog: function() {
      const replay = {
        playerNames: this.currentGame.players.map(p => p.playerName),
        rngseed: this.rngseed,
        actionLog: this.actionLog
      }
      createTextDownload(`${this.rngseed}.log`, JSON.stringify(replay, null, 2))
    },
    setupGameState: function(ruleset) {
      if(this.bGameSetup) {
        this.instance.setRuleSet(ruleset)
      } else {
        this.bGameSetup = true
        this.instance.setupGameState(ruleset, this.rngseed)
      }
    },
    printCard: function(card) {
      return CC.printCard(card)
    },
    addPlayer: function() {
      const playerName = this.newPlayerName
      console.log('method: addPlayer', playerName)
      if(this.viewingPlayer === '') {
        this.viewingPlayer = playerName
      }
      if(this.playerName !== '') {
        this.$refs.playerNameInput.focus()
        this.newPlayerName = ''
        this.instance.addPlayer(playerName)
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
      return this.instance.isCurrentPlayer(pn)
    },
    paSelectCard: function(cardIdx, rif, playerName) {
      if(rif.selectable === Rif.SINGLE) {
        this.selectionTree.selectCard(cardIdx, rif.getId(), playerName)
      } else if(rif.selectable === Rif.MULTIPLE) {
        this.selectionTree.appendCard(cardIdx, rif.getId(), playerName)
      } else if(rif.selectable === Rif.RANGE) {
        this.selectionTree.rangeCard(cardIdx, rif.cards.length, rif.getId(), playerName)
      }

      const ps = this.currentGame.getObjectsFromSelection(this.selectionTree)
      this.$set(this.playerSelections, playerName, ps)
      console.log('selecting a card: ', ps, rif, ...arguments)
    },
    paSelectPlayer: function(otherPlayer, thisPlayer) {
      const player = this.playerSelections[thisPlayer.playerName] || { selectedCards: [], selectedPlayer: '', selectedRif: {} }
      if(_.isEqual(player.selectedPlayer, otherPlayer)) {
        player.selectedPlayer = ''
      } else {
        player.selectedPlayer = otherPlayer
      }
      this.playerSelections[thisPlayer.playerName] = player
      this.playerSelections = _.assign({}, this.playerSelections)
      console.log('paSelectPlayer event handler', otherPlayer, this.playerSelections)
    },
    paSelectRif: function(rif, playerName) {
      if(rif.selectable === Rif.RIF_ONLY) {
        this.selectionTree.selectRif(rif, playerName)
      }
      const ps = this.currentGame.getObjectsFromSelection(this.selectionTree)
      this.$set(this.playerSelections, playerName, ps)
      console.log('paSelectRif event handler', ps, this.playerSelections)
    },
    shuffleDeck: function() {
      const newDeck = CC.shuffleDeck(this.currentGame.deck)
      this.currentGame.deck = newDeck
    },
    continueAction: function() {
      //
      this.nextAction()
      setTimeout(() => {
        if(this.bCanSkip) {
          this.continueAction()
        }
      }, 100)
    },
    nextAction: function() {
      //
      const act = this.actionLog[this.actPC++]
      console.log('Next action: ', act.a, act.pn)
      this.instance.runAction(act.a, act.pn, act.st)
    }
  },
  watch: {
    instance: {
      handler: function(a, b) {
        if(b.getCurrentPlayer()) {
          const pn = b.getCurrentPlayer().playerName
          if(pn !== this.viewingPlayer) {
            this.viewingPlayer = pn
          }
        }
      },
      deep: true
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
    bCanSkip: function() {
      return this.actPC < this.actionLog.length
    },
    currentPlayer: function() {
      return this.instance.getPlayer(this.viewingPlayer)
    },
    bCanDownload: function() {
      if(this.editor.getValue) {
        return this.editor.getValue().length>0
      }
      return false
    },
    bCanSaveActions: function() {
      return this.actionLog.length > 0
    },
    bRuleSetLoaded: function() {
      return this.instance.currentRuleSet !== undefined
    },
    numPlayers: function() {
      if(this.bGameSetup) {
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
      if(this.currentGame && this.instance.currentRuleSet) {
        return this.currentGame.gameVariables
      }
      return {}
    },
    gameRules: function() {
      if(this.instance && this.instance.currentRuleSet) {
        return this.instance.currentRuleSet
      }
      return {}
    },
    setupListeners: function() {
      return {
        __custom_action: this.instance.fnRunAction((event, player) => {
          this.actionLog.push({
            a: event.id,
            pn: player.playerName,
            st: _.cloneDeep(this.selectionTree)
          })
          this.playerSelections = {}
          this.selectionTree.clear()
        }),
        '__select-card': this.paSelectCard,
        '__select-player': this.paSelectPlayer,
        '__select-rif': this.paSelectRif
      }
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

.heading {
  display: flex;
  flex-direction: column;
}

.lineError {
  background-color: #ff8589;
}

#divPlayers {
  display: flex;
  flex-flow: row wrap;
}

#stateWindow {
  display: flex;
  flex-flow: row nowrap;
}

#stateWindow button {
  width: 4em;
  height: 4em;
  border-radius: .5em;
  margin: .2em .2em .2em .4em;
  outline: none;

  background-color: #ddf2ba;
  border: .2em solid #cceb98;
  color: #76ab21;
}

#stateWindow .btnUsedState {
  background-color: #8ac926;
  border-color: #76ab21;
  color: #76ab21;
}

#stateWindow .btnLastSaved {
  background-color: #ffd970;
  border-color: #ffbe0a;
  color: #a37800;
}

#stateWindow > span {
  display: flex;
  flex-flow: column nowrap;
}

#stateWindow label {
  text-align: center;
}

#stateWindow .btnOverwriteState {
  background-color: #ff8589;
  border-color: #ff474e;
  color: #a30005;
  height: 1.8em;
}

#stateWindow .btnReloadState {
  background-color: #ffd970;
  border-color: #ffbe0a;
  color: #a37800;
  height: 1.8em;
}

</style>
