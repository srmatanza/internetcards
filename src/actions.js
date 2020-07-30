import _ from 'lodash'

function _drawCardFromDeckToHand(deck, hand) {
  if (deck.length === 0) {
    // some kind of error...
    return
  }

  hand.push(deck.cards.pop())
}

function _cardIncludes(sc, card) {
  for(const i in sc) {
    if(sc[i].suit === card.suit && sc[i].val === card.val) {
      return true
    }
  }

  return false
}

function _filterOutCardsFromHand(selectedCards, hand) {
  // remove the selected cards from the player's hand
  return _.filter(hand, card => !_cardIncludes(selectedCards, card))
}

export default {
  newRound: function(gameState) {
    const gs = _.cloneDeep(gameState)

    gs.resetRound()

    return gs
  },
  customAction: function(gameState) {
    const gs = _.cloneDeep(gameState)
    return gs
  },
  deal: function(gameState, numCards) {
    const gs = _.cloneDeep(gameState)
    const numPlayers = gs.getPlayerCount()

    for(let i = 0; i < numCards; i++) {
      const curPlayer = gs.players[i%numPlayers]
      _drawCardFromDeckToHand(gs.deck, curPlayer.hand)
    }

    return gs
  },
  draw: function(gameState, playerIdx, numCards) {
    const playerState = gameState.players[playerIdx]

    for(let i = 0; i < numCards; i++) {
      _drawCardFromDeckToHand(gameState.deck, playerState.hand)
    }

    return [gameState, playerState]
  },
  discard: function(gameState, playerIdx, selectedCards) {
    const playerState = gameState.players[playerIdx]

    // remove the selected cards from the player's hand
    _filterOutCardsFromHand(selectedCards, playerState.hand)

    // Add the removed cards to the discard pile
    for (let i = 0; i < selectedCards.length; i++) {
      gameState.discard.push(selectedCards[i])
    }

    return [gameState, playerState]
  },
  pass: function(gameState, fromPlayerIdx, selectedCards, toPlayerIdx) {
    // Maybe assert that fromPlayerIdx and toPlayerIdx should be different
    const gs = _.cloneDeep(gameState)
    const fromPlayer = gs.players[fromPlayerIdx]

    // remove the selected cards from the player's hand
    fromPlayer.hand = _filterOutCardsFromHand(selectedCards, fromPlayer.hand)

    // add them to the indicated player's hand
    const toPlayer = gs.players[toPlayerIdx]
    toPlayer.hand = _.concat(toPlayer.hand, selectedCards)
    return gs
  },
  takeTrick: function(gameState, playerIdx, trick) {
    const gs = _.cloneDeep(gameState)
    const player = gs.players[playerIdx]

    player.tricks = _.concat(player.tricks, trick)

    return gs
  },
  playCard: function(gameState, playerIdx, selectedCard) {
    const gs = _.cloneDeep(gameState)

    const player = gs.players[playerIdx]
    player.hand = _filterOutCardsFromHand([selectedCard], player.hand)

    gs.trick = _.concat(gs.trick, selectedCard)
    return gs
  },
  meld: function(gameState, playerIdx, cardGroups) {
    const playerState = gameState.players[playerIdx]

    return [gameState, playerState]
  },
  layoff: function(gameState, playerIdx, selectedCards, toPlayer) {
    const playerState = gameState.players[playerIdx]

    return [gameState, playerState]
  }
}
