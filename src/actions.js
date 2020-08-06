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
  newRound: function(gameState, event, playerIdx, ps) {
    const gs = _.cloneDeep(gameState)
    gs.resetRound()
    return gs
  },
  customAction: function(gameState, event, playerIdx, ps) {
    const gs = _.cloneDeep(gameState)
    return gs
  },
  deal: function(gameState, event, playerIdx, ps) {
    const gs = _.cloneDeep(gameState)
    const numPlayers = gs.getPlayerCount()
    const numCards = event.cards

    for(let i = 0; i < numCards; i++) {
      const curPlayer = gs.players[i%numPlayers]
      _drawCardFromDeckToHand(gs.deck, curPlayer.hand)
    }

    return gs
  },
  draw: function(gameState, event, playerIdx, ps) {
    const gs = _.cloneDeep(gameState)
    const player = gs.players[playerIdx]
    const numCards = event.cards

    for(let i = 0; i < numCards; i++) {
      _drawCardFromDeckToHand(gameState.deck, player.hand)
    }

    return gs
  },
  discard: function(gameState, event, playerIdx, ps) {
    const gs = _.cloneDeep(gameState)
    const player = gs.players[playerIdx]

    // remove the selected cards from the player's hand
    _filterOutCardsFromHand(ps.selectedCards, player.hand)

    // Add the removed cards to the discard pile
    for (let i = 0; i < ps.selectedCards.length; i++) {
      gs.discard.push(ps.selectedCards[i])
    }

    return gs
  },
  pass: function(gameState, event, playerIdx, ps) {
    const gs = _.cloneDeep(gameState)
    const player = gs.getPlayer(playerIdx)
    const toPlayer = gs.getPlayer(ps.selectedPlayer)
    console.log('pass func: ', player, toPlayer)

    // remove the selected cards from the player's hand
    player.hand = _filterOutCardsFromHand(ps.selectedCards, player.hand)

    // add them to the indicated player's hand
    toPlayer.hand = _.concat(toPlayer.hand, ps.selectedCards)

    gs.players[player.idx] = player
    gs.players[toPlayer.idx] = toPlayer

    return gs
  },
  takeTrick: function(gameState, event, playerIdx, ps) {
    const gs = _.cloneDeep(gameState)
    const player = gs.players[playerIdx]

    player.tricks = _.concat(player.tricks, gs.trick)
    gs.trick = []

    return gs
  },
  playCard: function(gameState, event, playerIdx, ps) {
    const gs = _.cloneDeep(gameState)
    const player = gs.players[playerIdx]

    player.hand = _filterOutCardsFromHand(ps.selectedCards, player.hand)

    gs.trick = _.concat(gs.trick, ps.selectedCards)

    return gs
  },
  meld: function(gameState, event, playerIdx, ps) {
    const gs = _.cloneDeep(gameState)

    return gs
  },
  layoff: function(gameState, event, playerIdx, ps) {
    const gs = _.cloneDeep(gameState)

    return gs
  }
}
