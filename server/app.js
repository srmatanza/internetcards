import _ from 'lodash'
import express from 'express'
import cors from 'cors'

import Handlers from './handlers.js'

const app = express()
const port = 3001

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/', (req,res) => {
    res.send('Here we go!\n')
})

app.get('/gamestate/:gameId', (req,res) => {
    console.debug(`Looking up the game state for ${req.params.gameId}.\n`)
    const _gid = req.params.gameId
    const gi = Handlers.getGamestate(_gid)
    if(gi) {
        res.send(gi)
    } else {
        res.status(404).send('That game does not exist')
    }
})

app.post('/newgame', (req,res) => {
    const gi = Handlers.postNewgame()
    console.debug('Creating a new game: ', gi)
    res.send(`Creating a new game ${gi.gameIdentifier}\n`)
})

app.post('/joingame/:gameId', (req,res) => {
    const _gid = req.params.gameId
    const playerName = req.body.playerName
    if(_.isUndefined(playerName) || playerName === '') {
        res.status(400).send('You must submit a valid player name.\n')
        return
    }
    const gi = Handlers.postJoingame(_gid, playerName)
    if(!gi) {
        res.status(400).send('Error joining game.\n')
        return
    }

    res.send(`Joining ${_gid} as ${playerName}!\n`)
})

app.post('/playeraction/:gameId/:action', (req,res) => {
    const _gid = req.params.gameId
    const action = req.params.action
    const player = req.body.player
    if(_.isUndefined(player) || typeof player !== 'object') {
        res.status(400).send('You must submit a player with your action.\n')
        return
    }
    console.debug(_gid, action, player)
    const gi = Handlers.postPlayeraction(_gid, action, player)
    if(_.isUndefined(gi)) {
        res.status(400).send('Error posting playeraction\n')
        return
    }
    console.debug('Posting action to gameInstance: ', gi)
    res.send('Performing a playerAction!\n')
})

app.listen(port, () => console.log('Example app listening at http://localhost:', port))
