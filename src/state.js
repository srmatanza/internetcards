// import _ from 'lodash'
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
  this.gameVariables = {}

  // These should be game specific global hands
  this.cards = new Rif()

  return this
}

GameState.prototype.resetRound = function(bShuffle) {
  const newDeck = new Cards.Deck()
  if(bShuffle) {
    this.deck = Cards.shuffleDeck(newDeck)
  } else {
    this.deck = newDeck
  }
  this.cards = new Rif()
  for(const i in this.players) {
    this.players[i].resetPlayer()
  }
}

export { Message, Rif, RuleSet, PlayerState, GameState }
