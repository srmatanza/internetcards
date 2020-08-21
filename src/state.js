import _ from 'lodash'
import * as Cards from '../src/cards.js'
import * as State from '../src/state.js'

function RuleSet() {
  this.gameVariables = {}
  this.possiblePlayers = []
  this.initialPhase = ''
  this.gameplay = [{
    name: '',
    playerActions: []
  }]

  return this
}

function PlayerState(playerName) {
  this.playerName = playerName||''
  this.idx = 0

  this.hand = []
  this.playerVariables = {}
  this.tricks = []

  this.toString = function() {
    return this.playerName
  }

  this.resetPlayer = function() {
    this.hand = []
    this.tricks = []
  }

  return this
}

function GameState() {
  this.getPlayerCount = function() {
    return this.players.length
  }
  this.getCurrentPlayer = function() {
    return this.players[this.currentPlayerIdx]
  }
  this.getPlayer = function(pid) {
    if(typeof pid === 'string') {
      for(const player of this.players) {
        if(pid === player.playerName) {
          return _.assign(new State.PlayerState(), player)
        }
      }
    } else if(typeof pid === 'number') {
      return _.assign(new State.PlayerState(), this.players[pid])
    }
    return undefined
  }
  this.addPlayer = function(playerName) {
    const p = new PlayerState(playerName)
    // Validate new player name that it is not a duplicate
    for(let i=0; i<this.players.length; i++) {
      if(this.players[i].playerName === playerName) {
        console.error('A player with this name already exists.')
        return undefined
      }
    }
    const playerVars = this.currentRuleSet.playerVariables
    _.assign(p.playerVariables, playerVars)
    p.idx = this.players.length
    this.players.push(p)
    return p
  }
  this.resetRound = function() {
    this.deck = new Cards.Deck()
    this.trick = []
    this.discard = []
    for(const i in this.players) {
      this.players[i].resetPlayer()
    }
  }
  this.isCurrentPlayer = function(playerName) {
    return this.currentPlayerIdx === this.getPlayer(playerName).idx
  }
  this.glomVars = function(player) {
    const phaseVars = {}
    const playerVars = _.clone(this.currentRuleSet.playerVars)
    const pv = {
      $player: player,
      $playerVars: _.assign(playerVars, player.playerVariables),
      $isYourTurn: this.isCurrentPlayer(player.playerName),
      $selectedCards: player.selectedCards,
      $selectedPlayer: this.getPlayer(player.selectedPlayer)
    }
    const globalVarsForPlayer = {
      $playerCount: this.getPlayerCount(),
      $possiblePlayers: this.currentRuleSet.possiblePlayers,
      $otherPlayers: this.players
    }

    return _.assign({}, this.currentRuleSet.gameVariables, globalVarsForPlayer, phaseVars, pv)
  }

  this.currentPlayerIdx = 0
  this.players = []
  this.deck = Cards.shuffleDeck(new Cards.Deck())

  this.currentPhase = ''
  this.currentRuleSet = new RuleSet()

  // These should be game specific global hands
  this.trick = []
  this.discard = []

  return this
}

export { RuleSet, PlayerState, GameState }
