/* eslint-disable valid-typeof */
import _ from 'lodash'
import Logic from '../src/logic.js'

function _computeArg(gs, arg, player) {
  if(typeof arg === 'object') {
    return Logic.computeRule(arg, gs.glomVars(player))
  }
  return arg
}

function _drawCardFromDeckToHand(deck, hand) {
  if (deck.length === 0) {
    console.error('Empty deck...')
    return
  }

  hand.push(deck.cards.pop())
}

function _computeVarsForPlayer(gs, vars, player) {
  const newVars = {}
  for(const vn in vars) {
    newVars[vn] = _computeArg(gs, vars[vn], player)
  }
  return newVars
}

// It's probably really bad to have functions called, "_includesCards" and "_cardIncludes"
// that do different things...
function _includesCards(hand, cards) {
  for(const c in cards) {
    let bb = true
    for(const h in hand) {
      const cc = cards[c]
      const hh = hand[h]
      if(cc.val === hh.val && cc.suit === hh.suit) {
        bb = false
        continue
      }
    }
    if(bb) {
      return false
    }
  }
  return true
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

function _isGameVar(gs, variable) {
  for(const gv in gs.currentRuleSet.gameVariables) {
    if(gv === variable) {
      return true
    }
  }
  return false
}

function _isPlayerVar(gs, variable) {
  for(const pv in gs.currentRuleSet.playerVariables) {
    if(pv === variable) {
      return true
    }
  }
  return false
}

function changePhase(gs, args) {
  gs.currentPhase = args[0]
}

function moveCards(gs, args, player) {
  const fromHand = _computeArg(gs, args[0], player) // Uncomputed varname
  const toHand = _computeArg(gs, args[1], player) // Uncomputed varname
  let selectedCards
  if(args[2] !== undefined) {
    selectedCards = _computeArg(gs, args[2], player)
  }
  console.log('moveCards: ', fromHand, toHand, selectedCards)
  _filterOutCardsFromHand()
  // Validate that the selected cards are in fromHand
  if(selectedCards && selectedCards.length > 0 && !_includesCards(fromHand, selectedCards)) {
    console.error('Error in move_cards; attempting to move cards that don\'t exist in the hand.')
    return gs
  }

  // but really, if selectedCards isn't defined, just transfer all the cards
}

function setVar(gs, gameVars, player) {
  const vars = _.cloneDeep(gameVars)
  // figure out if vars is a global or player variable
  const pvars = {}
  const gvars = {}
  for(const vidx in vars) {
    let vn = vars[vidx]
    if(typeof vn === 'object') {
      vn = Logic.computeRule(vn, gs.glomVars(player))
    }
    if(_isGameVar(gs, vidx)) {
      gvars[vidx] = vn
    } else if(_isPlayerVar(gs, vidx)) {
      pvars[vidx] = vn
    } else {
      console.error('Undefined variable: ', vidx)
    }
  }
  _.assign(gs.currentRuleSet.gameVariables, gvars)
  _.assign(gs.players[player.idx].playerVariables, pvars)
}

function setVarEachPlayer(gs, playerVars, player) {
  for(const p of gs.players) {
    const newVars = _computeVarsForPlayer(gs, _.cloneDeep(playerVars), p)
    _.assign(gs.players[p.idx].playerVariables, newVars)
  }
}

function setPlayer(gs, idx, player) {
  const newIdx = _computeArg(gs, idx, player)
  gs.currentPlayerIdx = parseInt(newIdx) % gs.getPlayerCount()
}

function advancePlayer(gs, incr, player) {
  const newIncr = _computeArg(gs, incr, player)
  gs.currentPlayerIdx = (gs.currentPlayerIdx + parseInt(newIncr)) % gs.getPlayerCount()
}

function newRound(gs) {
  gs.resetRound()
}

function draw(gs, args, player) {
  const numCards = args[0]
  for(let i = 0; i < numCards; i++) {
    _drawCardFromDeckToHand(gs.deck, player.cards.hand)
  }
}

function deal(gs, args) {
  const numPlayers = gs.getPlayerCount()
  const numCards = args[0]

  for(let i = 0; i < numCards; i++) {
    const curPlayer = gs.players[i%numPlayers]
    _drawCardFromDeckToHand(gs.deck, curPlayer.cards.hand)
  }
}

function checkArgs(args, argTypes) {
  if(argTypes === undefined) {
    return
  }
  if(args.length !== argTypes.length) {
    throw Error('Incorrect number of arguments')
  }

  for(let i = 0; i<args.length; i++) {
    const a = args[i]
    const type = argTypes[i]
    if(typeof a !== type) {
      throw Error(`Argument ${i+1} has incorrect type`)
    }
  }
}

function wrapEffect(fnCallback, gs, args, p, argTypes) {
  try {
    checkArgs(args, argTypes)
  } catch(ex) {
    console.error(`${fnCallback.name} function invocation error: `, ex.message)
    return gs
  }
  const _gs = _.cloneDeep(gs)
  fnCallback.call({}, _gs, args, p)
  return _gs
}

function callHandler(fnCallback, argTypes) {
  return function(gs, args, p) {
    return wrapEffect(fnCallback, gs, args, p, argTypes)
  }
}

export default {
  set_var: callHandler(setVar),
  set_var_each_player: callHandler(setVarEachPlayer),
  change_phase: callHandler(changePhase, ['string']),
  advance_player: callHandler(advancePlayer, ['number']),
  move_cards: callHandler(moveCards),
  set_player: callHandler(setPlayer, ['string']),
  new_round: callHandler(newRound),
  deal: callHandler(deal, ['number']),
  draw: callHandler(draw, ['number']),
  effect: Symbol('effect'),
  given: Symbol('given'),
  else: Symbol('else')
}
