import _ from 'lodash'
import * as Cards from '@/cards.js'

function RuleSet() {
  this.gameVariables = {}
  this.possiblePlayers = []
  this.initialPhase = ''
  this.gameplay = [{
    name: '',
    playerActions: {}
  }]

  return this
}

function PlayerState(playerName) {
  this.playerName = playerName||''
  this.idx = 0

  this.hand = []
  this.selectedCards = []
  this.selectedPlayer = ''
  this.playerVariables = {}
  this.tricks = []

  this.toString = function() {
    return this.playerName
  }

  this.resetPlayer = function() {
    this.hand = []
    this.selectedCards = []
    this.selectedPlayer = ''
    this.tricks = []
  }

  return this
}

function GameState() {
  this.currentPlayerIdx = 0
  this.getPlayerCount = function() {
    return this.players.length
  }
  this.getCurrentPlayer = function() {
    return this.players[this.currentPlayerIdx]
  }
  this.addPlayer = function(playerName) {
    const p = new PlayerState(playerName)
    // Validate new player name that it is not a duplicate
    for(let i=0; i<this.players.length; i++) {
      if(this.players[i].playerName === playerName) {
        console.error('A player with this name already exists.')
        return
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
  this.players = []
  this.deck = new Cards.Deck()
  this.trick = []
  this.discard = []
  this.currentPhase = ''
  this.currentRuleSet = new RuleSet()

  return this
}

export { RuleSet, PlayerState, GameState }
