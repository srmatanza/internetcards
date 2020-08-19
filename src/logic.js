import _ from 'lodash'
import * as CC from '../src/cards.js'
import jsonLogic from 'json-logic-js'

function _valSuit(card) {
  if(typeof card === 'string') {
    const val = _.indexOf('_123456789TJQKA', card[0])
    const suit = _.indexOf('_SHDC', card[1])
    // console.log('card[string]', card, val, suit)
    return [val, suit]
  } else if(typeof card === 'object') {
    // console.log('card[object]', card)
    return [card.val, card.suit]
  } else {
    return [0, 0]
  }
}

function handContainsCard(card, hand) {
  // console.debug('handContainsCard: ', card, hand)
  const val = parseInt(card[0])
  const suit = _.indexOf('_SHDC', card[1])
  const c = new CC.Card(suit, val)
  for(let i = 0; i < hand.length; i++) {
    const _c = hand[i]
    if(_c.val === c.val && _c.suit === c.suit) {
      return true
    }
  }
  return false
}

function handContainsSuit(suit, hand) {
  // console.debug('handContainsSuit: ', suit, hand)
  // iterate over all of the suits specified in suit
  const needles = []
  if(typeof suit === 'number') {
    needles.push(suit)
  } else if(typeof suit === 'string') {
    for(const hs of suit.split('')) {
      needles.push(_.indexOf('_SHDC', hs))
    }
  }
  for(const suitIndex of needles) {
    for(let i = 0; i < hand.length; i++) {
      const card = hand[i]
      if(card.suit === suitIndex) {
        return true
      }
    }
  }
  return false
}

function handContainsVal(val, hand) {
  const valIndex = typeof val === 'number' ? val : _.indexOf('_A23456789TJQK', val)
  for(let i = 0; i < hand.length; i++) {
    const card = hand[i]
    if(card.val === valIndex) {
      return true
    }
  }
  return false
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
  const suit = _.indexOf('_SHDC', card.suit)

  return suit
}

function getValForCard(card) {
  const val = parseInt(card[0])

  return val
}

function isHighCard(cA, cB) {
  console.log('isHighCard', cA, cB)
  let vA = cA.val
  let vB = cB.val
  if(vA === 1) {
    vA = 14
  }
  if(vB === 1) {
    vB = 14
  }
  if(vA === vB) {
    return (cA.suit >= cB.suit)
  } else {
    return vA > vB
  }
}

function cardEq(cA, cB) {
  return _.isEqual(_valSuit(cA), _valSuit(cB))
}

function flatten(array) {
  return array.flat()
}

function playerVar(varName) {
  return this.$playerVars[varName]
}

function getAt(idx, arr) {
  return arr[idx]
}

jsonLogic.add_operation('handContainsCard', handContainsCard)
jsonLogic.add_operation('handContainsSuit', handContainsSuit)
jsonLogic.add_operation('handContainsVal', handContainsVal)
jsonLogic.add_operation('isYourTurn', isYourTurn)
jsonLogic.add_operation('isOtherPlayerSelected', isOtherPlayerSelected)
jsonLogic.add_operation('getSuitForCard', getSuitForCard)
jsonLogic.add_operation('getValForCard', getValForCard)
jsonLogic.add_operation('isHighCard', isHighCard)
jsonLogic.add_operation('flatten', flatten)
jsonLogic.add_operation('playerVar', playerVar)
jsonLogic.add_operation('cardEq', cardEq)
jsonLogic.add_operation('getAt', getAt)

export default {
  isSatisfied: function(given, gameVariables) {
    const ret = jsonLogic.apply(given, gameVariables)
    // console.log('Logic.isSatisfied: ', given, gameVariables, ret)
    return ret
  },
  computeRule: function(rule, gameVariables) {
    const ret = jsonLogic.apply(rule, gameVariables)
    // console.log('Logic.computeRule: ', rule, gameVariables, ret)
    return ret
  }
}
