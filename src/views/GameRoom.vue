<template>
<div>
  <TopHeader :links="links"/>
  <div id="gameRoom">

    <div class="heading">
      <h3>Game Joined!</h3>

      <div>
        <p>{{ whoami.playerName }}: {{ whoami.gid }}</p>
      </div>

      <div id="currentPlayer" class="statebox player" v-if="bGameSetup">
        <Player
          :key="whoami.playerName"
          :player="currentPlayer"
          :selectionTree="selectionTree"
          :instance="instance"
          :bDebugMode="bDebugMode"
          v-on="setupListeners" />
      </div>
      <GameHistory :history="actionLog" />
    </div>
  </div>
</div>
</template>
<script>
import Player from '@/components/Player.vue'
import TopHeader from '@/components/TopHeader.vue'
import GameHistory from '@/components/GameHistory.vue'

import { SelectionTree } from '@/selection.js'
import { Rif } from '@/state.js'
import Instance from '@/instance.js'

import axios from 'axios'

import WSClient from '@/wsclient.js'

export default {
  name: 'gameRoom',
  components: {
    Player,
    TopHeader,
    GameHistory
  },
  data() {
    let wsprotocol = 'wss://'
    if(location.protocol.startsWith('http:')) {
      wsprotocol = 'ws://'
    }
    return {
      whoami: {},
      instance: new Instance(),
      playerSelections: {},
      selectionTree: new SelectionTree(),
      actionLog: [],
      bGameSetup: false,
      bDebugMode: false,
      reconnectionLimit: 15,
      WS_CONNECTION_STRING: wsprotocol + location.hostname + '/wsgame',
      ws: {}
    }
  },
  created() {
    axios
      .get('/api/whoami')
      .then(res => {
        if(res.data.gid === undefined || res.data.playerName === undefined) {
          this.$router.push('/')
        }
        this.whoami = res.data
        this.reloadGameState()
      })
  },
  computed: {
    links: function() {
      return [
        {
          name: 'Leave Game',
          href: '/'
        }
      ]
    },
    currentPlayer: function() {
      return this.instance.getPlayer(this.whoami.playerName)
    },
    setupListeners: function() {
      return {
        __custom_action: (e, p, st) => {
          console.log('client event handler: ', e, p, st)
          this.ws.send(JSON.stringify({
            do: 'playerAction',
            gameId: this.woami.gid,
            playerSecret: this.whoami.playerSecret,
            action: e,
            playerName: this.whoami.playerName,
            st: JSON.parse(JSON.stringify(this.selectionTree))
          }))
          this.selectionTree.clear()
        },
        '__select-card': this.paSelectCard,
        '__select-player': this.paSelectPlayer
      }
    }
  },
  methods: {
    setGameState: function(newState) {
      if(newState.instance) {
        this.instance.setGameState(newState.instance.gs)
        this.bGameSetup = true
      }
    },
    wsOnMessage: function(res) {
      if(res.gameInstance && res.gameInstance.gameIdentifier === this.whoami.gid) {
        this.setGameState(res.gameInstance)
        if(res.loggedAction) {
          this.actionLog.push(res.loggedAction)
        }
      } else if(res.type === 'connection') {
        console.debug('Received a connection response')
      } else {
        console.debug('Message does not contain game state.')
      }
    },
    wsOnOpen: function() {
      const openMsg = JSON.stringify({
        do: 'connect',
        gameId: this.whoami.gid,
        playerSecret: this.whoami.playerSecret
      })
      console.log('Opening a connection: ', openMsg)
      this.ws.send(openMsg)
    },
    wsOnClose: function() {
      if(this.reconnectionLimit > 0) {
        console.log('Attempting to reconect')
        this.reconnectionLimit = this.reconnectionLimit - 1
        this.reloadGameState()
      } else {
        console.log('No longer attempting to reconnect, please manually refresh the page')
      }
    },
    isCurrentPlayer: function(pn) {
      return this.instance.isCurrentPlayer(pn)
    },
    reloadGameState: function() {
      this.ws = Object.assign(new WebSocket(this.WS_CONNECTION_STRING),
        new WSClient(this.wsOnMessage.bind(this), this.wsOnOpen.bind(this), this.wsOnClose.bind(this)))
    },
    paSelectCard: function(cardIdx, rif, playerName) {
      if(rif.flags & Rif.SEL_SINGLE) {
        this.selectionTree.selectCard(cardIdx, rif.getId(), playerName)
      } else if(rif.flags & Rif.SEL_MULTIPLE) {
        this.selectionTree.appendCard(cardIdx, rif.getId(), playerName)
      } else if(rif.flags & Rif.SEL_RANGE) {
        this.selectionTree.rangeCard(cardIdx, rif.cards.length, rif.getId(), playerName)
      }

      // const ps = this.currentGame.getObjectsFromSelection(this.selectionTree)
      // this.$set(this.playerSelections, this.viewingPlayer, ps)
      console.log('selecting a card: ', rif, ...arguments)
    },
    paSelectPlayer: function(otherPlayer, thisPlayer) {
      const player = this.playerSelections[this.viewingPlayer] || { selectedCards: [], selectedPlayer: '', selectedRif: {} }
      if(JSON.stringify(player.selectedPlayer) === JSON.stringify(otherPlayer)) {
        player.selectedPlayer = ''
      } else {
        player.selectedPlayer = otherPlayer
      }
      this.playerSelections[this.viewingPlayer] = player
      this.playerSelections = Object.assign({}, this.playerSelections)
      console.log('paSelectPlayer event handler', otherPlayer, this.playerSelections)
    },
    paSelectRif: function(rif, playerName) {
      if(rif.flags & Rif.SEL_RIFONLY) {
        this.selectionTree.selectRif(rif.getId(), playerName)
      }
      // const ps = this.currentGame.getObjectsFromSelection(this.selectionTree)
      // this.$set(this.playerSelections, this.viewingPlayer, ps)
      console.log('paSelectRif event handler: ', rif, this.selectionTree, this.playerSelections)
    }
  }
}
</script>
<style>
#gameRoom > div {
  padding: 5px;
}

button {
  margin: 2px;
}

.playerBox {
  border: 1px solid chartreuse;
}

.mainPlayer {
  margin: 4px;
  padding: 6px 8px;
}

.playerbox {
  display: flex;
  flex-flow: row wrap;
}

.seatedPlayerBox {
  padding: 0px;
  margin: 0px;
}

.seatedPlayerBox > div {
  background-color: lightskyblue;
  border: 2px solid lightskyblue;
}

div.curplayer {
  border: 2px solid darkgreen;
}

.gameTable {
  background-color: green;
  width: 100%;
  height: 4em;
}

#scoreboard {
  display: flex;
}

#scoreboard > div {
  margin: 5px;
}
</style>
