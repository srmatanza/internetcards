import fs from 'fs'
import Instance from '@/instance.js'
import sharp2json from '@/sharp/transpile.js'

import rpRifTest1 from '../replays/rif_test_seed1.json'
import rpHearts1 from '../replays/hearts_1_weenus.json'

describe('game replay tests', () => {
  test('rif_test plays all the right cards', () => {
    const rifTestSharp = fs.readFileSync('./tests/rulesets/rif_test.sharp').toString()
    const rifTest = sharp2json(rifTestSharp)

    const instance = new Instance()
    instance.setupGameState(rifTest, rpRifTest1.rngseed)
    rpRifTest1.playerNames.forEach(pn => instance.addPlayer(pn))

    // Run the deal action
    const dealAct = rpRifTest1.actionLog[0]
    instance.runAction(dealAct.a, dealAct.pn, dealAct.st)
    expect(instance.gs.deck.cards.length).toBe(42)
    expect(instance.gs.players[0].rifs.hand.length).toBe(5)
    expect(instance.gs.players[1].rifs.hand.length).toBe(5)

    // Run the rest of the actions
    for(const act of rpRifTest1.actionLog.slice(1)) {
      instance.runAction(act.a, act.pn, act.st)
    }

    // console.log('State: ', JSON.stringify(instance.gs, null, 2))
    expect(instance.gs.players[0].rifs.hand.length).toBe(0)
    expect(instance.gs.players[1].rifs.hand.length).toBe(0)
  })

  test('hearts_test scoring issue', () => {
    const sharp = fs.readFileSync('./tests/rulesets/hearts_1.sharp').toString()
    const gameObj = sharp2json(sharp)
    const replay = rpHearts1

    const instance = new Instance()
    instance.setupGameState(gameObj, replay.rngseed)
    replay.playerNames.forEach(pn => instance.addPlayer(pn))

    // Play until score_round
    let actPC = 0
    for(actPC = 0; actPC < replay.actionLog.length; actPC++) {
      const act = replay.actionLog[actPC]
      if(act.a === 'score_round') {
        break
      }
      instance.runAction(act.a, act.pn, act.st)
    }

    console.log('now score the round')
    console.log('phase: ', instance.gs.currentPhase)

    const act = replay.actionLog[actPC]
    instance.runAction(act.a, act.pn, act.st)
    console.log('phase: ', instance.gs.currentPhase)
    instance.gs.players.forEach(p => {
      console.log(p.playerName + ': ', p.playerVariables)
    })
  })
})
