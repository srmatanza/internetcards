// import _ from 'lodash'
import * as Cards from '../src/cards.js'

function InitializeEnums(Obj, ObjEnums) {
  Object.getOwnPropertyNames(ObjEnums).map(prop => {
    Obj.prototype[prop] = ObjEnums[prop]
    Object.defineProperty(Obj, prop, { get: () => Obj.prototype[prop] })
  })
}

export function Message(txt, typ) {
  this.msgText = txt || ''
  this.msgType = Message.prototype.INFO || typ

  return this
}
InitializeEnums(Message, { INFO: 1, TUTORIAL: 2, HINT: 3 })

const rifArrayHandler = {
  get: function(target, prop, receiver) {
    if(prop in target) { // Pass through props that we have
      return target[prop]
    }

    if(prop === 'length') {
      return target._r.length + target._anon.length
    }

    // e.g. rifs[0]
    if(prop in target._anon) {
      return target._anon[prop]
    }

    // e.g. rifs["hand"]
    for(const rif of target._r) {
      if(rif.name === prop) {
        return rif
      }
    }

    return undefined
  }
}

export function RifArray() {
  this._r = []
  this._anon = []
  return new Proxy(this, rifArrayHandler)
}

RifArray.prototype.addRif = function(newRif) {
  if(this._r.length < 100) {
    if(newRif.name === '') {
      newRif.setIdx(this._anon.length)
      this._anon.push(newRif)
    } else {
      this._r.push(newRif)
    }
  } else {
    throw new Error('Too many rifs')
  }
}

RifArray.prototype[Symbol.iterator] = function() {
  let _idx = 0
  const _allRifs = [...this._anon, ...this._r]
  return {
    next: () => {
      if(_idx < _allRifs.length) {
        return {
          value: _allRifs[_idx++],
          done: false
        }
      } else {
        return { done: true }
      }
    }
  }
}

const rifHandler = {
  get: function(target, prop, receiver) {
    if(prop in target) { // Pass through props that we have
      return target[prop]
    }

    if(prop in target.cards) { // pass through all other props to cards
      return target.cards[prop]
    }

    return undefined
  }
}

export function Rif(name, orientation, display) {
  this.name = name || ''
  this.idx = -1
  this.orientation = orientation || Rif.prototype.FACE_UP
  this.display = display || Rif.prototype.HORIZONTAL

  this.cards = []
  return new Proxy(this, rifHandler)
}

Rif.prototype.setIdx = function(idx) {
  this.idx = idx
}

Rif.prototype[Symbol.iterator] = function() {
  let _idx = 0
  return {
    next: () => {
      if(_idx < this.cards.length) {
        return {
          value: this.cards[_idx++],
          done: false
        }
      } else {
        return { done: true }
      }
    }
  }
}

InitializeEnums(Rif, {
  FACE_UP: 0,
  FACE_DOWN: 1,
  TOP_ONLY: 2,
  HORIZONTAL: 4,
  VERTICAL: 8,
  STACKED: 16
})

export function RuleSet() {
  this.gameVariables = {}
  this.possiblePlayers = []
  this.initialPhase = ''
  this.gameplay = [{
    name: '',
    playerActions: []
  }]

  return this
}

export function PlayerState(playerName) {
  this.playerName = playerName||''
  this.idx = 0

  this.currentMessage = new Message()

  this.rifs = new RifArray()
  this.rifs.addRif(new Rif('hand'))

  this.playerVariables = {}

  return this
}

PlayerState.prototype.toString = function() {
  return this.playerName
}

PlayerState.prototype.resetPlayer = function() {
  this.rifs = new RifArray()
  this.rifs.addRif(new Rif('hand'))
}

export function GameState() {
  this.currentPlayerIdx = 0
  this.players = []
  this.deck = Cards.shuffleDeck(new Cards.Deck())

  this.currentPhase = ''
  this.gameVariables = {}

  // These should be game specific global hands
  this.rifs = new RifArray()

  return this
}

GameState.prototype.resetRound = function(bShuffle) {
  const newDeck = new Cards.Deck()
  if(bShuffle) {
    this.deck = Cards.shuffleDeck(newDeck)
  } else {
    this.deck = newDeck
  }

  this.rifs = new RifArray()
  for(const i in this.players) {
    this.players[i].resetPlayer()
  }
}
