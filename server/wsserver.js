import _ from 'lodash'

// ClientList is an array of client players connected to a game
// ClientList[gameId] is a mapping of playerSecrets to webservice clients
const ClientList = []

export default {
  connectPlayer: function(gameId, playerSecret, ws) {
    const playerRecord = {}
    playerRecord[playerSecret] = ws
    ClientList[gameId] = _.assign(ClientList[gameId], playerRecord)
  },
  updateClients: function(gameId, gi) {
    if(_.isUndefined(ClientList[gameId])) {
      console.error('There are no clients connected.')
      return
    }
    for(const ps in ClientList[gameId]) {
      const ws = ClientList[gameId][ps]
      ws.send(JSON.stringify(gi))
    }
  }
}
