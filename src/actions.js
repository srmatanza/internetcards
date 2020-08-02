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
  newRound: function(gameState, event, playerIdx) {
    const gs = _.cloneDeep(gameState)

    gs.resetRound()
    return gs
  },
  customAction: function(gameState, event, playerIdx) {
    const gs = _.cloneDeep(gameState)
    return gs
  },
  deal: function(gameState, event, playerIdx) {
    const gs = _.cloneDeep(gameState)
    const numPlayers = gs.getPlayerCount()
    const numCards = event.cards

    for(let i = 0; i < numCards; i++) {
      const curPlayer = gs.players[i%numPlayers]
      _drawCardFromDeckToHand(gs.deck, curPlayer.hand)
    }

    return gs
  },
  draw: function(gameState, event, playerIdx) {
    const gs = _.cloneDeep(gameState)
    const player = gs.players[playerIdx]
    const numCards = event.cards

    for(let i = 0; i < numCards; i++) {
      _drawCardFromDeckToHand(gameState.deck, player.hand)
    }

    return gs
  },
  discard: function(gameState, event, playerIdx) {
    const gs = _.cloneDeep(gameState)
    const player = gs.players[playerIdx]

    // remove the selected cards from the player's hand
    _filterOutCardsFromHand(player.selectedCards, player.hand)

    // Add the removed cards to the discard pile
    for (let i = 0; i < player.selectedCards.length; i++) {
      gs.discard.push(player.selectedCards[i])
    }

    return gs
  },
  pass: function(gameState, event, playerIdx) {
    const gs = _.cloneDeep(gameState)
    const player = gs.getPlayer(playerIdx)
    const toPlayer = gs.getPlayer(player.selectedPlayer)

    // remove the selected cards from the player's hand
    player.hand = _filterOutCardsFromHand(player.selectedCards, player.hand)

    // add them to the indicated player's hand
    toPlayer.hand = _.concat(toPlayer.hand, player.selectedCards)
    player.selectedPlayer = ''
    player.selectedCards = []

    return gs
  },
  takeTrick: function(gameState, event, playerIdx) {
    const gs = _.cloneDeep(gameState)
    const player = gs.players[playerIdx]

    player.tricks = _.concat(player.tricks, gs.trick)
    gs.trick = []

    return gs
  },
  playCard: function(gameState, event, playerIdx) {
    const gs = _.cloneDeep(gameState)
    const player = gs.players[playerIdx]

    player.hand = _filterOutCardsFromHand(player.selectedCards, player.hand)

    gs.trick = _.concat(gs.trick, player.selectedCards)
    player.selectedPlayer = ''
    player.selectedCards = []

    return gs
  },
  meld: function(gameState, event, playerIdx) {
    const gs = _.cloneDeep(gameState)

    return gs
  },
  layoff: function(gameState, event, playerIdx) {
    const gs = _.cloneDeep(gameState)

    return gs
  }
}
