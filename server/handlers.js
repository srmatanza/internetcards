import _ from 'lodash'
import GameInstance from '../server/gameInstance.js'
import CardHistory from '../server/history.js'

const GameCache = {} // This is our database for now... It's fine

export default {
  getGamestate: function (gameId) {
    if (GameCache.hasOwnProperty(gameId)) {
      const gi = GameCache[gameId]
      console.log(gi)
      return gi
    }
    return undefined
  },
  postNewgame: function (ruleset, saveHistory) {
    const newGame = new GameInstance(ruleset)
    GameCache[newGame.gameIdentifier] = newGame
    if(saveHistory) {
      CardHistory.initState(newGame.gameIdentifier, newGame)
    }
    return {
      gameInstance: newGame
    }
  },
  postJoingame: function (gs, playerName) {
    return gs.addPlayer(playerName)
  },
  postPlayeraction: function (gameId, actionName, player, playerSelections) {
    if (GameCache.hasOwnProperty(gameId)) {
      const gi = GameCache[gameId]
      const gs = gi.instance.gs

      // Get the action from the current phase
      const action = gi.getActionForCurrentPhase(actionName)

      // Concat the supplied player with the player from the gamestate. Validate?
      if(_.isUndefined(player.playerName) || !gs.getPlayer(player.playerName)) {
        console.debug(`Invalid playerName for: ${player}\n`)
        return undefined
      }
      // const p = gs.getPlayer(player.playerName)

      const result = {}
      result.gameInstance = gi.runAction(actionName, action, player, playerSelections)
      if(!_.isUndefined(result)) {
        result.loggedAction = CardHistory.addAction(gameId, action.id, player.playerName, playerSelections)
        // Hide selectedCards for all actions
        result.loggedAction.selectedCards = []
      }
      return result
    }
    console.debug(`Unknown game ${gameId}`)
    return undefined
  }
}
