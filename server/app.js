import uuid from 'uuid-random'
import _ from 'lodash'

import express from 'express'
import session from 'express-session'
import cors from 'cors'

import Handlers from './handlers.js'

function ErrMsg(strMsg) {
    this.Msg = strMsg
    this.toString = function() {
        return this.Msg
    }

    return this
}

const app = express()
const port = 3001

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(session({
    genid: function(req) {
      return uuid() // use UUIDs for session IDs
    },
    secret: 'dog bone pizza scissors',
    name: 'card.server',
    cookie: {
    },
    resave: false,
    saveUninitialized: false
  }))
  

app.get('/api', (req,res) => {
    const views = (req.session.views || 0) + 1
    req.session.views = views
    res.send(`Here we go! ${views}\n`)
})

app.get('/api/whoami', (req,res) => {
    const ret = {
        gid: req.session.gameId,
        playerName: req.session.playerName,
        authd: req.session.authd
    }

    res.send(ret)
})

app.get('/api/gamestate', (req,res) => {
    const _gid = req.session.gameId
    if(_.isUndefined(_gid)) {
        const errRet = {
            Msg: 'This user is not attached to a currently running game.'
        }
        res.status(400).send(errRet)
        return
    }
    const gi = Handlers.getGamestate(_gid)
    if(!gi) {
        const errRet = new ErrMsg(`Error looking up game, ${_gid} does not exist.`)
        console.debug(errRet)
        res.status(400).send(errRet)
        return
    }
    console.debug(`Looking up the game state for ${_gid}.\n`)
    res.send(gi)
})

app.get('/api/gamestate/:gameId', (req,res) => {
    console.debug(`Looking up the game state for ${req.params.gameId}.\n`)
    const _gid = req.params.gameId
    const gi = Handlers.getGamestate(_gid)
    if(gi) {
        res.send(gi)
    } else {
        res.status(404).send('That game does not exist')
    }
})

app.get('/api/logout', (req,res) => {
    console.debug('Logging out')
    req.session.authd = false
    req.session.gid = undefined
    req.session.playerName = undefined

    const ret = {
        gid: req.session.gameId,
        playerName: req.session.playerName,
        authd: req.session.authd
    }

    res.send(ret)
})

app.post('/api/login', (req,res) => {
    console.log(req.body)
    if(req.body.password === 'make') {
        req.session.authd = true
        res.send('Sure, here\'s a session.')
    } else {
        req.session.authd = false
        res.status(401).send('Nope, that ain\'t it chief.')
    }
})

app.post('/api/newgame', (req,res) => {
    if(req.session.authd) {
        const gi = Handlers.postNewgame()
        console.debug('Creating a new game: ', gi)
        const ret = {
            gameId: gi.gameIdentifier
        }
        res.send(ret)
    } else {
        console.log('Unauthorized /newgame access')
        res.status(401).send('Must be logged in to perform this action.\n')
    }
})

app.post('/api/joingame/:gameId', (req,res) => {
    const _gid = req.params.gameId
    const playerName = req.body.playerName
    if(_.isUndefined(playerName) || playerName === '') {
        const errRet = new ErrMsg('You must submit a valid player name.')
        res.status(400).send(errRet)
        return
    }
    const gi = Handlers.getGamestate(_gid)
    if(!gi) {
        const errRet = new ErrMsg(`Error joining game, ${_gid} does not exist.`)
        console.debug(errRet)
        res.status(400).send(errRet)
        return
    }
    const gs = gi.instance.gs
    if(gs.getPlayer(playerName)) {
        const errRet = new ErrMsg(`A player named ${playerName} already joined this game.`)
        console.log(errRet)
        res.status(400).send(errRet)
        return
    }
    const player = Handlers.postJoingame(gs, _gid, playerName)

    req.session.gameId = _gid
    req.session.playerName = playerName
    console.debug(`Joining ${_gid} as ${playerName}\n`)
    res.send(`Joining ${_gid} as ${playerName}!\n`)
})

app.post('/api/playeraction/:action', (req,res) => {
    const _gid = req.session.gameId
    const playerName = req.session.playerName
    console.debug('playeraction.body', req.body)
    if(_.isUndefined(_gid) || _.isUndefined(playerName)) {
        res.status(400).send(new ErrMsg('You are not attached to a currently running game.'))
        return
    }
    const gi = Handlers.getGamestate(_gid)
    if(!gi) {
        const errRet = new ErrMsg(`Error looking up game, ${_gid} does not exist.`)
        console.debug(errRet)
        res.status(400).send(errRet)
        return
    }
    const action = req.params.action
    const player = gi.instance.gs.getPlayer(playerName)
    if(_.isUndefined(player) || typeof player !== 'object') {
        res.status(400).send(new ErrMsg('Unable to find your player.'))
        return
    }
    const playerSelections = {
        selectedCards: req.body.selectedCards,
        selectedPlayer: req.body.selectedPlayer
    }

    const ret = Handlers.postPlayeraction(_gid, action, player, playerSelections)
    if(_.isUndefined(ret)) {
        res.status(400).send(new ErrMsg('Error posting playeraction'))
        return
    }
    console.debug('Posting action to gameInstance: ', ret)
    res.send(ret)
})

app.listen(port, () => console.log('Example app listening at http://localhost:', port))
