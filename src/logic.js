import * as CC from '../src/cards.js'
import jsonLogic from 'json-logic-js'

function _valSuit(card) {
  if(typeof card === 'string') {
    const rank = '_123456789TJQKA'.indexOf(card[0])
    const suit = '_SHDC'.indexOf(card[1])
    // console.log('card[string]', card, rank, suit)
    return [rank, suit]
  } else if(typeof card === 'object') {
    // console.log('card[object]', card)
    return [card.rank, card.suit]
  } else {
    return [0, 0]
  }
}

function handContainsCard(card, rif) {
  const rank = parseInt(card[0])
  const suit = '_SHDC'.indexOf(card[1])
  const c = new CC.Card(suit, rank)
  for(let i = 0; i < rif.cards.length; i++) {
    const _c = rif.cards[i]
    if(_c.rank === c.rank && _c.suit === c.suit) {
      return true
    }
  }
  return false
}

function handContainsSuit(suit, rif) {
  // console.debug('handContainsSuit: ', suit, hand)
  // iterate over all of the suits specified in suit
  const needles = []
  if(typeof suit === 'number') {
    needles.push(suit)
  } else if(typeof suit === 'string') {
    for(const hs of suit.split('')) {
      needles.push('_SHDC'.indexOf(hs))
    }
  }
  for(const suitIndex of needles) {
    for(let i = 0; i < rif.cards.length; i++) {
      const card = rif.cards[i]
      if(card.suit === suitIndex) {
        return true
      }
    }
  }
  return false
}

function handContainsVal(rank, rif) {
  const valIndex = typeof rank === 'number' ? rank : '_A23456789TJQK'.indexOf(rank)
  for(let i = 0; i < rif.cards.length; i++) {
    const card = rif.cards[i]
    if(card.rank === valIndex) {
      return true
    }
  }
  return false
}

// concatenate all arguments into one big rif
function _concatRifs(rifs) {
  const _r = []
  for(const r of rifs) {
    _r.push(...r.cards)
  }

  return _r
}

function rifIsRun() {
  const _r = _concatRifs(arguments)

  if(_r.length < 3) {
    return false
  }
  _r.sort((a, b) => a.rank - b.rank)
  console.log('rifIsRun: ', _r)
  let c = _r[0]
  for(let i = 1; i < _r.length; i++) {
    if(!(c.rank === _r[i].rank - 1 && c.suit === _r[i].suit)) {
      return false
    }
    c = _r[i]
  }
  return true
}

function rifIsSet() {
  const _r = _concatRifs(arguments)

  if(_r.length < 3) {
    return false
  }
  return !_r.some(c => c.rank !== _r[0].rank)
}

function rifIsSelected() {
  return !(this.$selectedRif.owner === '')
}

function tallyRifs() {
  const _r = _concatRifs(arguments)
  if(_r.length > 0) {
    return _r.reduce((acc, c) => {
      if(this.pointValues !== undefined) {
        return this.pointValues(c) + acc
      }

      const val = Math.min(c.rank, 10)
      return val + acc
    }, 0)
  }
  return 0
}

function isYourTurn(currentplayer) {
  return currentplayer
}

function isOtherPlayerSelected() {
  // console.log('isOtherPlayerSelected', this, arguments)
  const otherPlayerName = this.$selectedPlayer.playerName || ''
  if(otherPlayerName === this.$player.playerName) {
    return false
  }
  const op = this.$otherPlayers
  for(const pidx in op) {
    const opn = op[pidx].playerName
    if(opn === otherPlayerName) {
      return true
    }
  }
  return false
}

function getSuitForCard(card) {
  console.log('getSuitForCard', card)
  const suit = '_SHDC'.indexOf(card.suit)

  return suit
}

function getValForCard(card) {
  const rank = parseInt(card[0])

  return rank
}

function cardGt(cA, cB) {
  const vA = cA.rank
  const vB = cB.rank
  if(vB === 1) { // cB is at least as high as cA
    return false
  }
  if(vA === 1) { // if cB is not an Ace, cA must be higher
    return true
  }
  if(vA === vB) {
    return (cA.suit >= cB.suit)
  } else {
    return vA > vB
  }
}

function cardEq(cA, cB) {
  // console.log('cardEq: ', _valSuit(cA), _valSuit(cB))
  return JSON.stringify(_valSuit(cA)) === JSON.stringify(_valSuit(cB))
}

function cardLt(cA, cB) {
  return !cardGt(cA, cB) && !cardEq(cA, cB)
}

function flatten(array) {
  return array.flat()
}

function playerVar(varName) {
  return this.$playerVars[varName]
}

function getAt(obj, idx) {
  if(obj[idx] === undefined) {
    throw Error('getAt returned an undefined object')
  }
  return obj[idx]
}

jsonLogic.add_operation('rifContainsCard', handContainsCard)
jsonLogic.add_operation('rifContainsSuit', handContainsSuit)
jsonLogic.add_operation('rifContainsRank', handContainsVal)
jsonLogic.add_operation('rifIsRun', rifIsRun)
jsonLogic.add_operation('rifIsSet', rifIsSet)
jsonLogic.add_operation('rifIsSelected', rifIsSelected)

jsonLogic.add_operation('isYourTurn', isYourTurn)
jsonLogic.add_operation('isOtherPlayerSelected', isOtherPlayerSelected)
jsonLogic.add_operation('getSuitForCard', getSuitForCard)
jsonLogic.add_operation('getRankForCard', getValForCard)
jsonLogic.add_operation('flatten', flatten)
jsonLogic.add_operation('playerVar', playerVar)
jsonLogic.add_operation('cardIsEqual', cardEq)
jsonLogic.add_operation('cardIsHigher', cardGt)
jsonLogic.add_operation('cardIsLower', cardLt)
jsonLogic.add_operation('getAt', getAt)
jsonLogic.add_operation('tallyRifs', tallyRifs)

export default {
  isSatisfied: function(given, gameVariables) {
    for(const g of given) {
      try {
        const ret = jsonLogic.apply(g, gameVariables)
        // console.log('isSatisfied: ', g, gameVariables, ret)
        if(ret === false) {
          return false
        }
      } catch(ex) {
        console.error('Error processing isSatisfied: ', ex)
      }
    }
    return true
  },
  computeRule: function(rule, gameVariables) {
    try {
      const ret = jsonLogic.apply(rule, gameVariables)
      // console.log('Logic.computeRule: ', rule, gameVariables, ret)
      return ret
    } catch(ex) {
      console.error('Error processing rule.', ex)
      return {}
    }
  }
}
