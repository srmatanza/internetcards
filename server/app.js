import uuid from 'uuid-random'

import fs from 'fs'
import path from 'path'
const __dirname = path.resolve()

import http from 'http'
import WebSocket from 'ws'
import express from 'express'
import session from 'express-session'
import cors from 'cors'
import history from 'connect-history-api-fallback'

import Handlers from './handlers.js'
import CardHistory from './history.js'
import WSServer from './wsserver.js'

function ErrMsg(strMsg) {
    this.Msg = strMsg
    this.toString = function() {
        return this.Msg
    }

    return this
}

const bEnableLogging = false
let __d = 'make'
fs.readFile(__dirname + '/asdf.txt', (err, data) => {
    if(err) {
        console.debug('Unable to load __d')
        return
    }
    __d = data.toString().trim()
})

function LogMsg(strMsg) {
    const em = new ErrMsg(strMsg)
    const logmsg = (new Date).toGMTString() + ': ' + em.toString() + '\n'
    if(bEnableLogging) {
        fs.appendFile('log.txt', logmsg, function() {})
    }
    return em
}

const app = express()
const port = 3001

app.use(cors())
app.use(history({
    rewrites: [{
        from: /\/api/,
        to: function(context) {
            return context.parsedUrl.pathname
        }
    }]
}))
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
app.use(express.static('dist'))

const server = http.createServer(app)
const wss = new WebSocket.Server({ server: server, path: '/wsgame' })

wss.on('connection', (ws) => {
    ws.on('message', function(message) {
        let jmsg = {}
        try {
            jmsg = JSON.parse(message)
        } catch(ex) {
            console.error('Invalid connection message')
            ws.send(JSON.stringify(new LogMsg(`Invalid connection message: ${message}`)))
            return
        }
        console.log('Received a message: ', jmsg)
        switch(jmsg.do) {
            case 'connect': {
                if(jmsg.gameId === undefined ||
                   jmsg.playerSecret === undefined) {
                    ws.send(JSON.stringify(new LogMsg(`Invalid connection message: ${message}`)))
                    return
                }
                const gi = Handlers.getGamestate(jmsg.gameId)
                if(!gi) {
                    ws.send(JSON.stringify(new LogMsg("This connection is not associated with any game state.")))
                    return
                }
                WSServer.connectPlayer(jmsg.gameId, jmsg.playerSecret, ws)
                ws.send(JSON.stringify({ gameInstance: gi }))
                return
            }
            case 'playerAction':
                break
            default:
                console.error('Unknown action')
        }
        if(jmsg.gameId === undefined ||
           jmsg.playerSecret === undefined ||
           jmsg.playerName === undefined ||
           jmsg.action === undefined) {
            ws.send(JSON.stringify(new LogMsg("Empty message")))
            return
        }

        const gi = Handlers.getGamestate(jmsg.gameId)
        if(!gi) {
            ws.send(JSON.stringify(new LogMsg("This connection is not associated with any game state.")))
            return
        }
        const player = gi.instance.getPlayer(jmsg.playerName)
        if(player === undefined || typeof player !== 'object') {
            ws.send(JSON.stringify(new LogMsg('Unable to find your player.')))
            return
        }
        
        const playerSelections = jmsg.playerSelections || {
            selectedCards: [],
            selectedPlayer: ''
        }

        const ret = Handlers.postPlayeraction(jmsg.gameId, jmsg.action, player, playerSelections)
        if(ret === undefined) {
            ws.send(JSON.stringify(new LogMsg('Unable to post player action')))
        }

        WSServer.updateClients(jmsg.gameId, ret)
    })

    ws.send(JSON.stringify(new LogMsg('Hi there, I am a WebSocket server')))
})

app.get('/api', (req,res) => {
    res.send('Let\'s call this a healthcheck...\n')
})

app.get('/api/whoami', (req,res) => {
    const ret = {
        gid: req.session.gameId,
        playing: req.session.playing,
        playerName: req.session.playerName,
        playerSecret: req.session.playerSecret,
        authd: req.session.authd
    }

    res.send(ret)
})

app.get('/api/history', (req, res) => {
    const _gid = req.session.gameId
    if(_gid === undefined) {
        res.status(400).send(new ErrMsg('You are not attached to a currently running game.'))
        return
    }
    let h = CardHistory.getHistory(_gid)
    if(h === undefined) {
        h = []     
    }

    res.send(h)
})

app.get('/api/history/:gameId', (req, res) => {
    const _gid = req.params.gameId
    let h = CardHistory.getHistory(_gid)
    if(_gid === undefined) {
        h = []
    }

    res.send(h)
})

app.get('/api/gamestate', (req,res) => {
    const _gid = req.session.gameId
    if(_gid === undefined) {
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

const RuleSetNames = ['hearts']
function getJSONRuleSet(ruleset) {
    const retObj = {
        status: 200,
        content: ''
    }

    try {
        const content = fs.readFileSync(ruleset)
        retObj.content = content.toString()
    } catch(ex) {
        console.log(ex.code)
        if(ex.code === 'ENOENT') {
            retObj.status = 404
        } else {
            retObj.status = 500
        }
    }

    return retObj
}

app.get('/api/rulesets', (req, res) => {
    res.send(RuleSetNames)
})

app.get('/api/rulesets/:ruleset', async function(req, res) {
    const fileName = req.params.ruleset + '.json'
    const ret = getJSONRuleSet(path.join(__dirname, 'src/rulesets', fileName))
    console.log(`GET rulesets/${fileName}`, ret.status)
    if(ret.status === 200) {
        res
            .set({
                'Content-Type': 'application/json'
            })
            .status(ret.status)
            .send(ret.content)
    } else {
        res.status(ret.status).send('Could not load the specified rule set.')
    }
})

app.get('/api/logout', (req,res) => {
    console.debug('Logging out')
    req.session.authd = false
    req.session.playing = false
    req.session.gameId = undefined
    req.session.playerName = undefined

    const ret = {
        gid: req.session.gameId,
        playerName: req.session.playerName,
        authd: req.session.authd
    }

    res.send(ret)
})

app.post('/api/login', (req,res) => {
    if(req.body.password === __d) {
        req.session.authd = true
        res.send('Sure, here\'s a session.')
    } else {
        req.session.authd = false
        res.status(401).send('Nope, that ain\'t it chief.')
    }
})

app.post('/api/newgame', (req,res) => {
    if(req.session.authd) {
        console.log('POST newgame: ', req.body)
        const ruleset = req.body.ruleset
        if(ruleset === undefined) {
            console.error('Missing ruleset from body')
            res.status(400).send(new ErrMsg('A new game request must include the ruleset.'))
            return
        }
        const playerName = req.body.playerName || ''
        if(playerName === '') {
            const errRet = new ErrMsg('You must submit a valid player name.')
            res.status(400).send(errRet)
            return
        }
        const saveHistory = req.body.saveHistory || false

        // Get ruleset from disk
        const rsFile = ruleset + '.json'
        const rsPath = path.join(__dirname, 'src/rulesets', rsFile)
        const rsJson = getJSONRuleSet(rsPath)
        if(rsJson.status !== 200) {
            const errRet = new ErrMsg('Unable to lookup the rule set.')
            res.status(400).send(errRet)
            return
        }

        const gi = Handlers.postNewgame(JSON.parse(rsJson.content), saveHistory).gameInstance
        console.debug('Creating a new game: ', gi)

        const _gid = gi.gameIdentifier
        Handlers.postJoingame(gi.instance, playerName)
        const playerSecret = uuid()

        req.session.gameId = _gid
        req.session.playing = true
        req.session.playerName = playerName
        req.session.playerSecret = playerSecret
        console.debug(`Joining ${_gid} as ${playerName}\n`)
        res.send({ gameId: _gid, playerName: playerName, playerSecret: playerSecret })
    } else {
        console.log('Unauthorized /newgame access')
        res.status(401).send('Must be logged in to perform this action.\n')
    }
})

app.post('/api/joingame/:gameId', (req,res) => {
    const _gid = req.params.gameId
    const playerName = req.body.playerName
    if(playerName === undefined || playerName === '') {
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
    const ruleSet = gi.instance.currentRuleSet
    if(gi.instance.getPlayer(playerName)) {
        const errRet = new ErrMsg(`A player named ${playerName} already joined this game.`)
        console.log(errRet)
        res.status(400).send(errRet)
        return
    }
    if(Array.isArray(ruleSet.possiblePlayers)) {
        const maxPlayers = ruleSet.possiblePlayers.reduce( (a,n) => Math.max(a,n))
        if(gi.instance.getPlayerCount() >= maxPlayers) {
            const errRet = new ErrMsg('The maximum number of players have already joined this game.')
            console.error(errRet)
            res.status(400).send(errRet)
            return
        }
    }
    const player = Handlers.postJoingame(gi.instance, playerName)
    const playerSecret = uuid()

    req.session.gameId = _gid
    req.session.playerName = playerName
    req.session.playerSecret = playerSecret
    console.debug(`Joining ${_gid} as ${playerName}\n`)
    WSServer.updateClients(_gid, { gameInstance: gi })
    res.send({ gameId: _gid, playerName: playerName, playerSecret: playerSecret })
})

app.post('/api/playeraction/:action', (req,res) => {
    const _gid = req.session.gameId
    const playerName = req.session.playerName
    console.debug('playeraction.body', req.body)
    if(_gid === undefined || playerName === undefined) {
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
    const player = gi.instance.getPlayer(playerName)
    if(player === undefined || typeof player !== 'object') {
        res.status(400).send(new ErrMsg('Unable to find your player.'))
        return
    }
    const playerSelections = {
        selectedCards: req.body.selectedCards,
        selectedPlayer: req.body.selectedPlayer
    }

    const ret = Handlers.postPlayeraction(_gid, action, player, playerSelections)
    if(ret === undefined) {
        res.status(400).send(new ErrMsg('Error posting playeraction'))
        return
    }
    console.debug('Posting action to gameInstance: ', ret)
    res.send(ret)
})

server.listen(process.env.PORT || port, () => console.log('Example app listening at http://localhost:', port))
