import * as Cards from '../src/cards.js'
import seedrandom from 'seedrandom'
import { SelectionTree } from './selection.js'

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

    if(prop === 'lastRif') {
      return target._anon[target._anon.length - 1]
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
  const retRif = [...this].find(r => r.getId() === rifId)
  // Ensure that we always return a proper Rif from any RifArray data
  return Object.assign(new Rif(), JSON.stringify(retRif))
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
          value: Object.assign(new Rif(), JSON.parse(JSON.stringify(_allRifs[_idx++]))),
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

export function Rif(name, flags) {
  this.name = name || ''
  this.owner = ''
  this.idx = -1
  this.flags = flags || 0

  this.cards = []
  return new Proxy(this, rifHandler)
}

Rif.prototype.setFlags = function(flags) {
  this.flags = flags
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

export const RifEnums = {
  ORIENT_FACEDOWN: 1<<0,
  ORIENT_TOPONLY: 1<<1,
  DISP_VERTICAL: 1<<2,
  DISP_STACKED: 1<<3,
  SEL_SINGLE: 1<<4,
  SEL_MULTIPLE: 1<<5,
  SEL_RANGE: 1<<6,
  SEL_RIFONLY: 1<<7
}

RifEnums.ORIENT = RifEnums.ORIENT_FACEDOWN | RifEnums.ORIENT_TOPONLY
RifEnums.DISP = RifEnums.DISP_VERTICAL | RifEnums.DISP_STACKED
RifEnums.SEL = RifEnums.SEL_SINGLE | RifEnums.SEL_MULTIPLE | RifEnums.SEL_RANGE | RifEnums.SEL_RIFONLY

InitializeEnums(Rif, RifEnums)

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
  this.rifs.addRif(new Rif('hand', Rif.SEL_MULTIPLE))

  this.playerVariables = {}

  return this
}

PlayerState.prototype.toString = function() {
  return this.playerName
}

PlayerState.prototype.resetPlayer = function() {
  this.rifs = new RifArray()
  this.rifs.addRif(new Rif('hand', Rif.SEL_MULTIPLE))
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

GameState.prototype.getObjectsFromSelection = function(_st) {
  // collate rifs into a playerName*rif tuple
  // the weird syntax here is because the RifArray class
  // implements the iterator method, but is not an array, so in order
  // to use Array methods like map, you first have to array-ify it.
  // Perhaps a method to return an array would be better, e.g. this.rifs.asArray().map
  //
  // This is only non-trivial in cases where selectedCards contains cards from different rifs
  const st = Object.assign(new SelectionTree(), _st)
  // console.log('selecting from: ', st)
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
    const _r = pp.find(p => sn.player === p.pn && sn.rif === p.r.getId()).r
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
