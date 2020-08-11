import _ from 'lodash'
import GameInstance from '../server/gameInstance.js'

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
  postNewgame: function () {
    const newGame = new GameInstance()
    GameCache[newGame.gameIdentifier] = newGame
    return newGame
  },
  postJoingame: function (gs, gameId, playerName) {
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

      return gi.runAction(actionName, action, player, playerSelections)
    }
    console.debug(`Unknown game ${gameId}`)
    return undefined
  }
}