import _ from 'lodash'
import * as CC from '../src/cards.js'
import jsonLogic from 'json-logic-js'

function _valSuit(card) {
  if(typeof card === 'string') {
    const rank = _.indexOf('_123456789TJQKA', card[0])
    const suit = _.indexOf('_SHDC', card[1])
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
  const suit = _.indexOf('_SHDC', card[1])
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
      needles.push(_.indexOf('_SHDC', hs))
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
  const valIndex = typeof rank === 'number' ? rank : _.indexOf('_A23456789TJQK', rank)
  for(let i = 0; i < rif.cards.length; i++) {
    const card = rif.cards[i]
    if(card.rank === valIndex) {
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
  const rank = parseInt(card[0])

  return rank
}

function isHighCard(cA, cB) {
  console.log('isHighCard', cA, cB)
  let vA = cA.rank
  let vB = cB.rank
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
  // console.log('cardEq: ', _valSuit(cA), _valSuit(cB))
  return _.isEqual(_valSuit(cA), _valSuit(cB))
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
