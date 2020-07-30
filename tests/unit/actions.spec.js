
import Actions from '@/actions.js'
import * as State from '@/state.js'

describe('Five player Action tests', () => {
    //let gsps
    let gs = {}
    let ps = {}

    beforeEach(() => {
        //console.log("Calling beforeEach")
        // Setup the game state for each test
        gs = new State.GameState()
        gs.players.push(new State.PlayerState('Mike'))
        gs.players.push(new State.PlayerState('Comfort'))
        gs.players.push(new State.PlayerState('Tim'))
        gs.players.push(new State.PlayerState('EG'))
        gs.players.push(new State.PlayerState('Al'))

        //console.log("len: " + gs.players.length)
    })

    test('Can add players', () => {
        expect(gs.players.length).toBe(5)
    })

    test('Can deal cards', () => {
        // Deal give cards to each player
        gs = Actions.deal(gs, 5*gs.players.length)
        expect(gs.players.length).toBe(5)
        let curPlayer = gs.getCurrentPlayer()
        console.log(curPlayer.playerName)
        console.log(curPlayer.hand.length)
    })
})
