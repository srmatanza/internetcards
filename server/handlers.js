import _ from 'lodash'
import GameInstance from '../server/gameInstance.js'

const GameCache = {} // This is our database for now... It's fine

export default {
  getGamestate: function (gameId) {
    if (GameCache.hasOwnProperty(gameId)) {
      return GameCache[gameId]
    }
    return undefined
  },
  postNewgame: function () {
    const newGame = new GameInstance()
    GameCache[newGame.gameIdentifier] = newGame
    return newGame
  },
  postJoingame: function (gameId, playerName) {
    if (GameCache.hasOwnProperty(gameId)) {
      const gi = GameCache[gameId]
      const gs = gi.currentGame

      gs.addPlayer(playerName)
      return gi
    }
    return undefined
  },
  postPlayeraction: function (gameId, actionName, player) {
    if (GameCache.hasOwnProperty(gameId)) {
      const gi = GameCache[gameId]
      const gs = gi.currentGame

      // Get the action from the current phase
      const action = gi.getActionForCurrentPhase(actionName)

      // Concat the supplied player with the player from the gamestate. Validate?
      if(_.isUndefined(player.playerName) || !gs.getPlayer(player.playerName)) {
        console.debug(`Invalid playerName for: ${player}\n`)
        return undefined
      }
      const p = gs.getPlayer(player.playerName)
      p.selectedCards = _.cloneDeep(player.selectedCards)
      p.selectedPlayer = _.cloneDeep(player.selectedPlayer)

      return gi.runAction(actionName, action, p)
    }
    console.debug(`Unknown game ${gameId}`)
    return undefined
  }
}