import _ from 'lodash'

import Instance from '../src/instance.js'

function genGameId() {
  const _az = 'abcdefghijklmnopqrstuvwxyz'.split('')
  let ret = ''
  for (let i = 0; i < 4; i++) {
    ret += _az[parseInt(Math.random() * 26)]
  }
  return ret.toUpperCase()
}

export default function (ruleset) {
  const _rs = ruleset || Hearts

  this.instance = new Instance()
  this.instance.setupGameState(_rs)
  this.gameIdentifier = genGameId()

  this.getActionForCurrentPhase = function(actionName) {
    const phases = this.instance.gs.currentRuleSet.gameplay
    for(const idx in phases) {
      if(phases[idx].name === this.instance.gs.currentPhase) {
        return phases[idx].playerActions[actionName]
      }
    }
    return undefined
  }

  this.runAction = function(actionName, action, player, ps) {
    const fn = this.instance.paListeners()['__'+actionName]
    if(typeof fn === 'function') {
      fn(action, player, ps)
      return this
    } else {
      console.error(`${actionName} is not a function`)
      return undefined
    }
  }

  return this
}