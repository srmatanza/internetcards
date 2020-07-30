import _ from 'lodash'

export default {
  changePhase: function(gameState, newPhase) {
    const gs = _.cloneDeep(gameState)
    gs.currentPhase = newPhase
    return gs
  },
  incrementVar: function(gameState, gameVars) {
    const gs = _.cloneDeep(gameState)
    for (const varName in gameVars) {
      const newVal = parseFloat(gs.currentRuleSet.gameVariables[varName]) + parseFloat(gameVars[varName])
      gs.currentRuleSet.gameVariables[varName] = newVal
    }

    return gs
  },
  setVar: function(gameState, gameVars) {
    const gs = _.cloneDeep(gameState)
    _.assign(gs.currentRuleSet.gameVariables, gameVars)

    return gs
  },
  setVarEachPlayer: function(gameState, playerVars) {
    const gs = _.cloneDeep(gameState)

    return gs
  },
  setVarPlayer: function(gameState, playerVars, player) {
    const gs = _.cloneDeep(gameState)
    _.assign(gs.players[player.idx].playerVariables, playerVars)

    return gs
  },
  advancePlayer: function(gameState, incr) {
    const gs = _.cloneDeep(gameState)
    let newIdx = gs.currentPlayerIdx

    if(typeof incr === 'number') {
      newIdx = (gs.currentPlayerIdx + parseInt(incr)) % gs.getPlayerCount()
    }

    gs.currentPlayerIdx = newIdx
    return gs
  },
  setPlayer: function(gameState, idx) {
    const gs = _.cloneDeep(gameState)

    if(typeof idx === 'number') {
      gs.currentPlayerIdx = parseInt(idx) % gs.getPlayerCount()
    }

    return gs
  }
}
