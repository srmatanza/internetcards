import _ from 'lodash'
import express from 'express'
const app = express()
const port = 3001

import * as State from '../src/state.js'

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/', (req,res) => {
    res.send('Here we go!\n')
})

app.get('/gamestate', (req,res) => {
    console.debug('Returning the game state.\n')
    res.send(new State.GameState())
    // res.send('Here\'s the gamestate!\n')  
})

app.post('/newgame', (req,res) => {
    console.debug(req.body)
    res.send('Posted a new game\n')
})

app.post('/joingame', (req,res) => {
    res.send('Joining a new game\n')
})

app.post('/playeraction', (req,res) => {
    res.send('Performing a playerAction!\n')
})

app.listen(port, () => console.log('Example app listening at http://localhost:', port))
