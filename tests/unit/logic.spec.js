import _ from 'lodash'
import Logic from '@/logic.js'
import Effects from '@/effects.js'
import Instance from '@/instance.js'
import * as State from '@/state.js'
import * as CC from '@/cards.js'
// Get this from hearts.json instead
// import Hearts from '@/rulesets/hearts.js'

describe('Logic tests for actions and effects', () => {
    let gi
    let givenHandContainsCard = {'handContainsCard': ['2C', {"var": "currentPlayer.cards.hand" }]}
    let givenHandContainsSuit = {'handContainsSuit': ['H', {"var": "currentPlayer.cards.hand"}]}
    let cardEqQS = { cardEq: ['QS', { var: 'card' }] }

    beforeEach(() => {
        //console.log("Calling beforeEach")
        // Setup the game state for each test
        gi = new Instance()
        gi.gs.resetRound()
        // gs.players.push(new State.PlayerState('Mike'))
        // gs.players.push(new State.PlayerState('Comfort'))
        gi.addPlayer('Mike')
        gi.addPlayer('Comfort')
        // gs = Actions.deal(gs, { cards: 52 })
        gi.gs = Effects.deal(gi, [52])
    })

    test('handContainsCard is satisfied', () => {
        const playerOne = gi.gs.players[0]
        const playerTwo = gi.gs.players[1]
        let bSat = false
        bSat = Logic.isSatisfied([givenHandContainsCard],
                        _.assign({}, {currentPlayer: playerOne}))
        expect(bSat).toBe(false)
        bSat = Logic.isSatisfied([givenHandContainsCard],
                        _.assign({}, {currentPlayer: playerTwo}))
        expect(bSat).toBe(true)
    })


    test('handContainsSuit is satisfied', () => {
        const playerOne = gi.gs.players[0]
        // const playerTwo = gs.players[1]
        let bSat = false
        bSat = Logic.isSatisfied([givenHandContainsSuit],
                        _.assign({}, {currentPlayer: playerOne}))
        expect(bSat).toBe(true)

        bSat = Logic.isSatisfied([{'!': [givenHandContainsSuit]}],
                        _.assign({}, {currentPlayer: playerOne}))

        expect(bSat).toBe(false)
    })

    test('cardEq is satisfied', () => {
        const QS = new CC.Card(1, 12)
        
        const bSat = Logic.isSatisfied([cardEqQS],
                        _.assign({}, { card: QS }))

        expect(bSat).toBe(true)
    })

    test('nested getAt calls', () => {
        const rule = {
            getAt: [
                { "var": "a" },
                "b"
            ]
        }
        const rule2 = {
            getAt: [
                {
                    getAt: [
                        { "var": "a" },
                        "b"
                    ]
                },
                "c"
            ]
        }
        const rule3 = {
            getAt: [
                { "var": "a.b" },
                "c"
            ]
        }

        const obj = {
            a: {
                b: {
                    c: 42
                }
            }
        }

        let bSat = Logic.computeRule(rule, obj)
        expect(bSat).toEqual({ c: 42 })

        bSat = Logic.computeRule(rule2, obj)
        expect(bSat).toEqual(42)

        bSat = Logic.computeRule(rule3, obj)
        expect(bSat).toEqual(42)
    })

    test('getAt calls with nested rules', () => {
        const rule = {
            getAt: [
                { "var": "a" },
                { "var": "b" }
            ]
        }

        const rule2 = {
            getAt: [
                { "var": "a" },
                { "+": [1, 1]}
            ]
        }

        const obj = {
            a: [23, 42, 99],
            b: 0
        }

        let bSat = Logic.computeRule(rule, obj)
        expect(bSat).toEqual(23)

        obj.b = 1
        bSat = Logic.computeRule(rule, obj)
        expect(bSat).toEqual(42)

        obj.b = 2
        bSat = Logic.computeRule(rule, obj)
        expect(bSat).toEqual(99)

        bSat = Logic.computeRule(rule2, obj)
        expect(bSat).toEqual(99)
    })
})
