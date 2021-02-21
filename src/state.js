// import _ from 'lodash'
import * as Cards from '../src/cards.js'
import seedrandom from 'seedrandom'

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

RifArray.prototype.getRifById = function(rifId) {
  // console.log('getRifById: ', [...this].filter(r => r.getId() === rifId), rifId)
  return [...this].find(r => r.getId() === rifId)
}

RifArray.prototype.addRif = function(newRif) {
  if(this._r.length < 100) {
    if(newRif.name === '') {
      newRif.idx = this._anon.length
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

export function Rif(name, orientation, display, selectable) {
  this.name = name || ''
  this.idx = -1
  this.orientation = orientation || Rif.prototype.FACE_UP
  this.display = display || Rif.prototype.HORIZONTAL
  this.selectable = selectable || Rif.prototype.NONE

  this.cards = []
  return new Proxy(this, rifHandler)
}

Rif.prototype.setParams = function(orientation, display, selectable) {
  this.orientation = orientation || this.orientation
  this.display = display || this.display
  this.selectable = selectable || this.selectable
}

Rif.prototype.getId = function() {
  if (this.name === '') {
    return `__rif${this.idx}`
  }
  return this.name
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
  FACE_UP: 0, // orientation
  FACE_DOWN: 1, // orientation
  TOP_ONLY: 2, // orientation
  HORIZONTAL: 3, // display
  VERTICAL: 4, // display
  STACKED: 5, // display
  NONE: 6, // selectable
  SINGLE: 7, // selectable
  MULTIPLE: 8, // selectable
  RANGE: 9 // selectable
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
  this.rifs.addRif(new Rif('hand', Rif.FACE_UP, Rif.HORIZONTAL, Rif.MULTIPLE))

  this.playerVariables = {}

  return this
}

PlayerState.prototype.toString = function() {
  return this.playerName
}

PlayerState.prototype.resetPlayer = function() {
  this.rifs = new RifArray()
  this.rifs.addRif(new Rif('hand', Rif.FACE_UP, Rif.HORIZONTAL, Rif.MULTIPLE))
}

export function GameState(rngseed) {
  const seed = rngseed || 'weenus'
  this._fnrng = seedrandom(seed)
  this.currentPlayerIdx = 0
  this.players = []
  this.deck = Cards.shuffleDeck(new Cards.Deck(), this._fnrng)

  this.currentPhase = ''
  this.gameVariables = {}

  // These should be game specific global hands
  this.rifs = new RifArray()

  return this
}

GameState.prototype.getRifById = function(rifId) {
  const rifs = [this.rifs, ...(this.players.map(p => p.rifs))]
  const rifsById = rifs.map(rr => rr.getRifById(rifId))
  return rifsById.find(r => r)
}

GameState.prototype.getObjectsFromSelection = function(st) {
  // collate rifs into a playerName*rif tuple
  // the weird syntax here is because the RifArray class
  // implements the iterator method, but is not an array, so in order
  // to use Array methods like map, you first have to array-ify it.
  // Perhaps a method to return an array would be better, e.g. this.rifs.asArray().map
  const pp = [...this.rifs].map(r => { return { pn: '__dealer', r: r } })
  for(const p of this.players) {
    pp.push(...[...p.rifs].map(r => { return { pn: p.playerName, r: r } }))
  }

  // Players
  const sp = this.players.filter(p => st.players.includes(p.playerName))

  // Rifs
  const sr = pp.filter(p => st.isRifSelected(p.r.getId(), p.pn)).map(p => p.r)

  // Cards
  const sc = []
  for(const sn of st.cards) {
    const _p = this.players.find(p => sn.player === p.playerName)
    const _r = [..._p.rifs].find(r => sn.rif === r.getId())
    sc.push(_r.cards[sn.card])
  }

  return { selectedCards: sc, selectedPlayers: sp, selectedRifs: sr }
}

GameState.prototype.resetRound = function(bShuffle) {
  const newDeck = new Cards.Deck()
  if(bShuffle) {
    this.deck = Cards.shuffleDeck(newDeck, this._fnrng)
  } else {
    this.deck = newDeck
  }

  this.rifs = new RifArray()
  for(const i in this.players) {
    this.players[i].resetPlayer()
  }
}
