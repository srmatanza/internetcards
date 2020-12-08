<template>
<div>
  <TopHeader :links="links"/>
  <div id="gameRoom" class="pure-g">

    <div class="pure-u-1 pure-u-md-1-3">
      <div>
        <h1>Game Joined!</h1>
        <p>{{ whoami.playerName }}: {{ whoami.gid }}</p>
      </div>
    </div>

    <div class="pure-u-1 pure-u-md-1-3">
      <h2>Scoreboard</h2>
      <div id="scoreboard">
        <div v-for="player in otherPlayers" :key="player.playerName"><p>{{ player.playerName }}</p><p>{{ player.playerVariables.pPoints }}</p></div>
      </div>
    </div>
  </div>
  <div class="pure-g">
    <!-- Player's hand and actions -->
    <div class="pure-u-1 pure-u-md-1-3">
      <div v-if="bGameLoaded" class="mainPlayer">
        <Player
            :player="player"
            :otherplayers="otherPlayers"
            :playerselections="playerSelections"
            :gamerules="gameRules"
            :currentphase="currentphase"
            :currentplayer="isCurrentPlayer(player.playerName)"
            :globalvars="globalVarsForPlayer"
            v-on="setupListeners" />
      </div>
    </div>
    <!-- Half of the other players -->
    <div class="pure-u-1 playerbox">
      <SeatedPlayer v-for="sp in otherPlayers"
                    :key="sp.playerName"
                    :playerName="sp.playerName"
                    :isCurrentPlayer="isCurrentPlayer(sp.playerName)"
                    :numPlayers="otherPlayers.length"
                    :hands="getHandsForPlayer(sp.playerName)" />
      <div class="gameTable">
        Deck, discard, etc.
      </div>
    </div>
    <!-- Table view -->
    <!-- Other half of the other players -->
    <!-- Scoreboard -->
  </div>
  <div class="pure-g">
    <div class="pure-u-1">
      <GameHistory :history="actionLog" />
    </div>
  </div>
</div>
</template>
<script>
import Player from '@/components/Player.vue'
import TopHeader from '@/components/TopHeader.vue'
import GameHistory from '@/components/GameHistory.vue'
import SeatedPlayer from '@/components/SeatedPlayer.vue'

import _ from 'lodash'
import axios from 'axios'

import * as State from '@/state.js'
import WSClient from '@/wsclient.js'

export default {
  name: 'gameRoom',
  components: {
    Player,
    TopHeader,
    GameHistory,
    SeatedPlayer
  },
  data() {
    let wsprotocol = 'wss://'
    if(location.protocol.startsWith('http:')) {
      wsprotocol = 'ws://'
    }
    return {
      whoami: {},
      instance: {},
      playerSelections: {},
      actionLog: [],
      reconnectionLimit: 15,
      WS_CONNECTION_STRING: wsprotocol + location.host + '/wsgame',
      ws: {}
    }
  },
  created() {
    axios
      .get('/api/whoami')
      .then(res => {
        if(_.isUndefined(res.data.gid) || _.isUndefined(res.data.playerName)) {
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
    bGameLoaded: function() {
      return !_.isUndefined(this.currentGame)
    },
    currentGame: {
      get: function() {
        return this.instance.gs
      },
      set: function(newGS) {
        this.instance.gs = newGS
      }
    },
    player: function() {
      if(this.bGameLoaded) {
        const p = this.currentGame.getPlayer(this.whoami.playerName)
        console.log('player cv: ', this.currentGame, p, this.whoami.playerName)
        return p
      }
      return undefined
    },
    getPlayerVars: function() {
      if(this.player) {
        return this.player.playerVariables
      }
      return []
    },
    numPlayers: function() {
      if(this.bGameLoaded) {
        return this.currentGame.players.length
      }
      return -1
    },
    otherPlayers: function() {
      if(this.bGameLoaded) {
        return this.currentGame.players
      }
      return []
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
      const mm = this
      function wrapListener(name) {
        return (e, p) => {
          console.log(name + ' client event handler: ', e, p)
          mm.ws.send(JSON.stringify({
            do: 'playerAction',
            action: name,
            gameId: mm.whoami.gid,
            playerSecret: mm.whoami.playerSecret,
            playerName: mm.whoami.playerName,
            playerSelections: mm.playerSelections[mm.player.playerName]
          }))
          mm.playerSelections = {}
        }
      }
      return {
        __deal: wrapListener('deal'),
        __pass: wrapListener('pass'),
        __lead: wrapListener('lead'),
        __play_card: wrapListener('play_card'),
        __take_trick: wrapListener('take_trick'),
        __new_round: wrapListener('new_round'),
        __custom_action: wrapListener('custom_action'),
        '__select-card': this.paSelectCard,
        '__select-player': this.paSelectPlayer
      }
    }
  },
  methods: {
    setGameState: function(newState) {
      if(newState.instance && newState.instance.gs) {
        this.instance = newState
        this.currentGame = _.assign(new State.GameState(), newState.instance.gs)
      }
    },
    reloadGameState: function() {
      this.ws = _.assign(new WebSocket(this.WS_CONNECTION_STRING),
        new WSClient(res => {
          if(res.gameInstance && res.gameInstance.gameIdentifier === this.whoami.gid) {
            this.setGameState(res.gameInstance)
            if(res.loggedAction) {
              this.actionLog.push(res.loggedAction)
            }
          } else if(res.type === 'connection') {
            console.log('Received a connection response')
          } else {
            console.debug('Message does not contain game state.')
          }
        },
        res => {
          const openMsg = JSON.stringify({
            do: 'connect',
            gameId: this.whoami.gid,
            playerSecret: this.whoami.playerSecret
          })
          console.log('Opening a connection: ', openMsg)
          this.ws.send(openMsg)
        },
        res => {
          if(this.reconnectionLimit > 0) {
            console.log('Attempting to reconect')
            this.reconnectionLimit = this.reconnectionLimit-1
            this.reloadGameState()
          } else {
            console.log('No longer attempting to reconnect, please manually refresh the page')
          }
        }))
    },
    isCurrentPlayer: function(pn) {
      return this.currentGame.isCurrentPlayer(pn)
    },
    getHandsForPlayer: function(pn) {
      return []
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
      console.log('paSelectCard event handler', card, sc, this.playerSelections)
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
