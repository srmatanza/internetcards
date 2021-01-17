import _ from 'lodash'
import * as Cards from '../src/cards.js'

function Message(txt, typ) {
  this.msgText = txt || ''
  this.msgType = Message.prototype.INFO || typ

  return this
}

Message.prototype.INFO = 0
Message.prototype.TUTORIAL = 1
Message.prototype.HINT = 2

function Rif() {
  this._cards = []
  return this
}

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

  this.currentMessage = new Message()

  this.cards = new Rif()
  this.cards.hand = []
  this.playerVariables = {}

  return this
}

PlayerState.prototype.toString = function() {
  return this.playerName
}

PlayerState.prototype.resetPlayer = function() {
  this.cards = new Rif()
  this.cards.hand = []
}

function GameState() {
  this.currentPlayerIdx = 0
  this.players = []
  this.deck = Cards.shuffleDeck(new Cards.Deck())

  this.currentPhase = ''
  this.currentRuleSet = new RuleSet()

  // These should be game specific global hands
  this.cards = new Rif()
  this.discard = []

  return this
}

GameState.prototype.getPlayerCount = function() {
  return this.players.length
}

GameState.prototype.getCurrentPlayer = function() {
  return this.players[this.currentPlayerIdx]
}

GameState.prototype.getPlayer = function(pid) {
  if(typeof pid === 'string') {
    for(const player of this.players) {
      if(pid === player.playerName) {
        return _.assign(new PlayerState(), player)
      }
    }
  } else if(typeof pid === 'number') {
    return _.assign(new PlayerState(), this.players[pid])
  }
  return undefined
}

GameState.prototype.addPlayer = function(playerName) {
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

GameState.prototype.resetRound = function(bShuffle) {
  const newDeck = new Cards.Deck()
  if(bShuffle) {
    this.deck = Cards.shuffleDeck(newDeck)
  } else {
    this.deck = newDeck
  }
  this.discard = []
  this.cards = new Rif()
  for(const i in this.players) {
    this.players[i].resetPlayer()
  }
}

GameState.prototype.isCurrentPlayer = function(playerName) {
  return this.currentPlayerIdx === this.getPlayer(playerName).idx
}

GameState.prototype.glomVars = function(player) {
  const phaseVars = {}
  const playerVars = _.assign(_.clone(this.currentRuleSet.playerVariables), player.playerVariables)
  const pv = {
    $player: this.players[player.idx],
    $isYourTurn: this.isCurrentPlayer(player.playerName),
    $selectedCards: player.selectedCards,
    $selectedPlayer: this.getPlayer(player.selectedPlayer),
    $selectedHand: []
  }
  const globalVarsForPlayer = {
    $playerCount: this.getPlayerCount(),
    $currentPlayer: player.idx,
    $possiblePlayers: this.currentRuleSet.possiblePlayers,
    $otherPlayers: this.players,
    $table: this.cards
  }

  // console.log('glomming: ', pv)
  return _.assign({}, this.currentRuleSet.gameVariables, globalVarsForPlayer, playerVars, phaseVars, pv)
}

export { Message, Rif, RuleSet, PlayerState, GameState }
