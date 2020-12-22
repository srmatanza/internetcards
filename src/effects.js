import _ from 'lodash'
import Logic from '../src/logic.js'

function _computeArg(gs, arg, player) {
  if(typeof arg === 'object') {
    return Logic.computeRule(arg, gs.glomVars(player))
  }
  return arg
}

function _computeVarsForPlayer(gs, vars, player) {
  const newVars = {}
  for(const vn in vars) {
    newVars[vn] = _computeArg(gs, vars[vn], player)
  }
  return newVars
}

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

export default {
  changePhase: function(gameState, args, player) {
    const gs = _.cloneDeep(gameState)
    gs.currentPhase = args[0]
    return gs
  },
  incrementVar: function(gameState, incrVars, player) {
    const gs = _.cloneDeep(gameState)
    const gameVars = _computeVarsForPlayer(gs, _.cloneDeep(incrVars), player)
    for (const varName in gameVars) {
      const newVal = parseFloat(gs.currentRuleSet.gameVariables[varName]) + parseFloat(gameVars[varName])
      gs.currentRuleSet.gameVariables[varName] = newVal
    }

    return gs
  },
  moveCards: function(gameState, args, player) {
    const gs = _.cloneDeep(gameState)

    const fromPlayer = _computeArg(gs, args.fromPlayerIdx, player)
    const fromHand = args.fromHand // Uncomputed varname
    const toPlayer = _computeArg(gs, args.toPlayerIdx, player)
    const toHand = args.toHand // Uncomputed varname
    const selectedCards = _computeArg(gs, args.cards, player)
    // console.log('moveCards: ', args, player, fromPlayer, fromHand, toPlayer, toHand, selectedCards)

    // if fromPlayer is undefined, set/get fromHand from the gameVariables
    // if toPlayer is undefined, set toHand from the gameVariables
    const fromSrc = _.isUndefined(fromPlayer) ? gs.gameVariables : gs.getPlayer(fromPlayer)
    const toSrc = _.isUndefined(toPlayer) ? gs.gameVariables : gs.getPlayer(toPlayer)

    // Validate that the selected cards are in fromHand
    if(selectedCards && selectedCards.length > 0 && !_includesCards(fromSrc[fromHand], selectedCards)) {
      console.error('Error in move_cards; attempting to move cards that don\'t exist in the hand.')
      return gs
    }

    // If 'cards' is undefined
    // then assign all the cards in fromHand -> toHand and empty fromHand
    // else assign all the cards in selectedCards to toHand removing selectedCards fromHand
    const sc = selectedCards || fromSrc[fromHand]

    const newFH = fromSrc[fromHand].filter(c => !_includesCards(sc, [c]))
    const newTH = _.concat(toSrc[toHand], sc)

    if(_.isUndefined(fromPlayer)) {
      gs.gameVariables[fromHand] = newFH
    } else {
      gs.players[fromPlayer][fromHand] = newFH
    }

    if(_.isUndefined(toPlayer)) {
      gs.gameVariables[toHand] = newTH
    } else {
      gs.players[toPlayer][toHand] = newTH
    }

    // console.log('move cards: ', gs)
    return gs
  },
  setVar: function(gameState, gameVars, player) {
    const gs = _.cloneDeep(gameState)
    const vars = _.cloneDeep(gameVars)
    // console.log('setVar: ', gameState, gameVars, player)
    for(const vn in vars) {
      if(typeof vars[vn] === 'object') {
        vars[vn] = Logic.computeRule(vars[vn], gs.glomVars(player))
      }
    }
    _.assign(gs.currentRuleSet.gameVariables, vars)

    return gs
  },
  setVarEachPlayer: function(gameState, playerVars, player) {
    const gs = _.cloneDeep(gameState)
    for(const p of gs.players) {
      const newVars = _computeVarsForPlayer(gs, _.cloneDeep(playerVars), p)
      _.assign(gs.players[p.idx].playerVariables, newVars)
    }

    return gs
  },
  setVarPlayer: function(gameState, playerVars, player) {
    const gs = _.cloneDeep(gameState)
    const newVars = _computeVarsForPlayer(gs, _.cloneDeep(playerVars), player)
    _.assign(gs.players[player.idx].playerVariables, newVars)

    return gs
  },
  advancePlayer: function(gameState, incr, player) {
    const gs = _.cloneDeep(gameState)
    const newIncr = _computeArg(gs, incr, player)
    gs.currentPlayerIdx = (gs.currentPlayerIdx + parseInt(newIncr)) % gs.getPlayerCount()

    return gs
  },
  setPlayer: function(gameState, idx, player) {
    const gs = _.cloneDeep(gameState)

    const newIdx = _computeArg(gs, idx, player)
    gs.currentPlayerIdx = parseInt(newIdx) % gs.getPlayerCount()

    return gs
  }
}
