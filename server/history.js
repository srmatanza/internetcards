
const HistoryCache = {} // This is our database for now... It's fine

export default {
    getHistory: function(gameId) {
        console.log(`fetching history for ${gameId} `)
        if(HistoryCache.hasOwnProperty(gameId)) {
            return HistoryCache[gameId]
        }
        console.log(' but no dice...')
        return undefined
    },
    initState: function(gameId, gameState) {
        console.log(`Setting initial state for ${gameId}\n`)
        HistoryCache[gameId] = {
            initialState: gameState,
            log: []
        }
    },
    addAction: function(gameId, actionName, playerName, playerSelections) {
        const newEntry = {
            action: actionName,
            player: playerName,
            playerSelections: playerSelections
        }

        if(HistoryCache.hasOwnProperty(gameId)) {
            console.log(`adding actions for ${gameId}\n`)
            const h = HistoryCache[gameId].log || []
            h.push(newEntry)
        } else {
            console.log(`Could not find history for ${gameId}\n`)
            return {}
        }

        return newEntry
    }
}
