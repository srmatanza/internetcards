import _ from 'lodash'
import Logic from '@/logic.js'
import Actions from '@/actions.js'
import * as State from '@/state.js'
import * as CC from '@/cards.js'
// Get this from hearts.json instead
// import Hearts from '@/rulesets/hearts.js'

describe('Five player Action tests', () => {
    let gs = {}
    let givenHandContainsCard = {'handContainsCard': ['2C', {"var": "currentPlayer.hand"}]}
    let givenHandContainsSuit = {'handContainsSuit': ['H', {"var": "currentPlayer.hand"}]}
    let cardEqQS = { cardEq: ['QS', { var: 'card' }] }

    beforeEach(() => {
        //console.log("Calling beforeEach")
        // Setup the game state for each test
        gs = new State.GameState()
        gs.players.push(new State.PlayerState('Mike'))
        gs.players.push(new State.PlayerState('Comfort'))
        gs = Actions.deal(gs, { cards: 52 })
    })

    test('handContainsCard is satisfied', () => {
        const playerOne = gs.players[0]
        const playerTwo = gs.players[1]
        let bSat = false
        bSat = Logic.isSatisfied(givenHandContainsCard,
                        _.assign({}, {currentPlayer: playerOne}))
        expect(bSat).toBe(false)
        bSat = Logic.isSatisfied(givenHandContainsCard,
                        _.assign({}, {currentPlayer: playerTwo}))
        expect(bSat).toBe(true)
    })

    test('handContainsSuit is satisfied', () => {
        const playerOne = gs.players[0]
        // const playerTwo = gs.players[1]
        let bSat = false
        bSat = Logic.isSatisfied(givenHandContainsSuit,
                        _.assign({}, {currentPlayer: playerOne}))
        expect(bSat).toBe(true)

        bSat = Logic.isSatisfied({'!': [givenHandContainsSuit]},
                        _.assign({}, {currentPlayer: playerOne}))

        expect(bSat).toBe(false)
    })

    test('cardEq is satisfied', () => {
        const QS = new CC.Card(1, 12)
        
        const bSat = Logic.isSatisfied(cardEqQS,
                        _.assign({}, { card: QS }))

        expect(bSat).toBe(true)
    })
})
