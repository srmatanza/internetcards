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

export default {
  changePhase: function(gameState, newPhase, player) {
    const gs = _.cloneDeep(gameState)
    gs.currentPhase = newPhase
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
  setVar: function(gameState, gameVars, player) {
    const gs = _.cloneDeep(gameState)
    const vars = _.cloneDeep(gameVars)
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
