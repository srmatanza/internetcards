/* eslint-disable valid-typeof */
/* eslint-disable no-fallthrough */
import _ from 'lodash'
import Logic from '../src/logic.js'
import { Message, Rif } from '../src/state.js'

function _computeArg(gi, arg, player) {
  if(typeof arg === 'object') {
    return Logic.computeRule(arg, gi.glomVars(player))
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

function _computeVarsForPlayer(gi, vars, player) {
  const newVars = {}
  for(const vn in vars) {
    newVars[vn] = _computeArg(gi, vars[vn], player)
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
      if(cc.rank === hh.rank && cc.suit === hh.suit) {
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
    if(sc[i].suit === card.suit && sc[i].rank === card.rank) {
      return true
    }
  }

  return false
}

function _filterOutCardsFromHand(selectedCards, hand) {
  // remove the selected cards from the player's hand
  return _.filter(hand, card => !_cardIncludes(selectedCards, card))
}

function _isGameVar(gi, variable) {
  for(const gv in gi.gs.gameVariables) {
    if(gv === variable) {
      return true
    }
  }
  return false
}

function _isPlayerVar(gi, variable) {
  for(const pv in gi.currentRuleSet.playerVariables) {
    if(pv === variable) {
      return true
    }
  }
  return false
}

function changePhase(gi, args) {
  gi.gs.currentPhase = args[0]
}

function newRif(gi, args, player) {
  const toRifArray = _computeArg(gi, args[0], player)
  const computedArgs = args.slice(1).map(a => _computeArg(gi, a, player))

  toRifArray.addRif(new Rif(...computedArgs))
}

function moveCards(gi, args, player) {
  const fromRif = _computeArg(gi, args[0], player) // Uncomputed varname
  const toRif = _computeArg(gi, args[1], player) // Uncomputed varname
  let selectedCards
  if(args[2] !== undefined) {
    selectedCards = _computeArg(gi, args[2], player)
  } else {
    selectedCards = fromRif
  }
  // console.log('moveCards: ', fromHand, toHand, selectedCards)

  for(const card of selectedCards) {
    toRif.cards.push(card)
  }
  // Validate that the selected cards are in fromHand
  if(selectedCards && selectedCards.length > 0 && !_includesCards(fromRif.cards, selectedCards.cards)) {
    console.error('Error in move_cards; attempting to move cards that don\'t exist in the hand.')
    return
  }

  const newHand = _filterOutCardsFromHand(selectedCards.cards, fromRif.cards)
  fromRif.cards.length = 0
  for(const card of newHand) {
    fromRif.cards.push(card)
  }
}

function setVar(gi, gameVars, player) {
  const vars = _.cloneDeep(gameVars)
  // figure out if vars is a global or player variable
  const pvars = {}
  const gvars = {}
  for(const vidx in vars) {
    let vn = vars[vidx]
    if(typeof vn === 'object') {
      vn = Logic.computeRule(vn, gi.glomVars(player))
    }
    if(_isGameVar(gi, vidx)) {
      gvars[vidx] = vn
    } else if(_isPlayerVar(gi, vidx)) {
      pvars[vidx] = vn
    } else {
      console.error('Undefined variable: ', vidx)
    }
  }
  _.assign(gi.gs.gameVariables, gvars)
  _.assign(gi.gs.players[player.idx].playerVariables, pvars)
}

function setVarEachPlayer(gi, playerVars, player) {
  for(const p of gi.gs.players) {
    const newVars = _computeVarsForPlayer(gi, _.cloneDeep(playerVars), p)
    _.assign(gi.gs.players[p.idx].playerVariables, newVars)
  }
}

function setPlayer(gi, idx, player) {
  const newIdx = _computeArg(gi, idx, player)
  gi.gs.currentPlayerIdx = parseInt(newIdx) % gi.getPlayerCount()
}

function advancePlayer(gi, incr, player) {
  const newIncr = _computeArg(gi, incr, player)
  gi.gs.currentPlayerIdx = (gi.gs.currentPlayerIdx + parseInt(newIncr)) % gi.getPlayerCount()
}

function newRound(gi) {
  gi.gs.resetRound(true)
}

function draw(gi, args, player) {
  const numCards = args[0]
  for(let i = 0; i < numCards; i++) {
    _drawCardFromDeckToHand(gi.gs.deck, player.cards.hand)
  }
}

function deal(gi, args, player) {
  const numPlayers = gi.getPlayerCount()
  const numCards = _computeArg(gi, args[0], player)
  console.log(`dealing ${numCards} cards to ${numPlayers} players`)

  for(let i = 0; i < numCards; i++) {
    const curPlayer = gi.gs.players[i%numPlayers]
    _drawCardFromDeckToHand(gi.gs.deck, curPlayer.rifs.hand.cards)
  }
}

function message(gi, args, player) {
  let playerIdx = -1
  let msgType = Message.INFO
  let msgText = ''
  let pMsg = null
  switch(args.length) {
    case 3:
      playerIdx = _computeArg(gi, args[2], player)
    case 2:
      msgType = _computeArg(gi, args[1], player)
    case 1:
      msgText = _computeArg(gi, args[0], player)
      // also, parse msgText as a template for var substitution
      pMsg = new Message(msgText, msgType)
      console.log('Setting message: ', pMsg)
      if(playerIdx === -1) {
        for(const pidx in gi.gs.players) {
          gi.gs.players[pidx].currentMessage = pMsg
        }
      } else {
        if(playerIdx < gi.gs.players.length) {
          gi.gs.players[playerIdx].currentMessage = pMsg
        } else {
          console.error('Player index is out of bounds!')
        }
      }
      break
    default:
      if(args.length === 0 || args.length > 3) {
        console.error('Invalid number of args for message call')
      }
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

function wrapEffect(fnCallback, gi, args, p, argTypes) {
  try {
    checkArgs(args, argTypes)
  } catch(ex) {
    console.error(`${fnCallback.name} function invocation error: `, ex.message)
    return gi.gs
  }
  // const _gs = _.cloneDeep(gi.gs)
  fnCallback.call({}, gi, args, p)
  return gi.gs
}

function callHandler(fnCallback, argTypes) {
  return function(gi, args, p) {
    return wrapEffect(fnCallback, gi, args, p, argTypes)
  }
}

export default {
  set_var: callHandler(setVar),
  set_var_each_player: callHandler(setVarEachPlayer),
  change_phase: callHandler(changePhase, ['string']),
  advance_player: callHandler(advancePlayer, ['number']),
  move_cards: callHandler(moveCards),
  message: callHandler(message),
  set_player: callHandler(setPlayer),
  new_round: callHandler(newRound),
  new_rif: callHandler(newRif),
  deal: callHandler(deal),
  draw: callHandler(draw, ['number']),
  effect: Symbol('effect'),
  given: Symbol('given'),
  else: Symbol('else'),
  eachplayer: Symbol('eachplayer')
}
