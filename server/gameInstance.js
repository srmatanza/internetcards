import Actions from '../src/actions.js'
import Effects from '../src/effects.js'
import Logic from '../src/logic.js'

import _ from 'lodash'

import * as State from '../src/state.js'
import Hearts from '../src/rulesets/hearts.js'

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
  this.currentGame = new State.GameState()
  this.currentGame.currentRuleSet = _rs
  this.currentGame.currentPhase = _rs.initialPhase

  this.gameIdentifier = genGameId()

  this.isSatisfied = function(given, player) {
    // console.log('isSatisfied: ', given)
    if(!_.isUndefined(given)) {
      const bSat = Logic.isSatisfied(given, this.glomVars(player))
      return !_.includes(bSat, false)
    }
    return true
  }

  this.handleEffect = function (effect, player) {
    if (this.isSatisfied(effect.given, player)) {
      for (const ef in effect) {
        const fn = this.efHandlers[ef]
        if (typeof fn === 'function') {
          this.currentGame = fn.call({}, this.currentGame, effect[ef], player)
        } else if (_.isUndefined(fn)) {
          console.error('Undefined function for effect: ', ef)
        }
      }
    }
  }

  this.handleEffects = function (effects, player) {
    if (Array.isArray(effects)) {
      for (const ef in effects) {
        this.handleEffect(effects[ef], player)
      }
    } else {
      this.handleEffect(effects, player)
    }
  }

  this.efHandlers = function () {
    return {
      set_var: Effects.setVar,
      set_var_player: Effects.setVarPlayer,
      set_var_each_player: Effects.setVarEachPlayer,
      change_phase: Effects.changePhase,
      increment_var: Effects.incrementVar,
      advance_player: Effects.advancePlayer,
      set_player: Effects.setPlayer,
      given: Symbol('given')
    }
  }

  this.paListeners = function () {
    const mm = this
    function wrapListener(fn, name) {
      return (e, p) => {
        console.debug(name + ' event handler: ', e, p)
        mm.currentGame = fn.call(mm, mm.currentGame, e, p.idx)
        mm.handleEffects(e.effect, p)
      }
    }
    return {
      __deal: wrapListener(Actions.deal, '__deal'),
      __pass: wrapListener(Actions.pass, '__pass'),
      __lead: wrapListener(Actions.playCard, '__lead'),
      __play_card: wrapListener(Actions.playCard, '__play_card'),
      __take_trick: wrapListener(Actions.takeTrick, '__take_trick'),
      __new_round: wrapListener(Actions.newRound, '__new_round'),
      __custom_action: wrapListener(Actions.customAction, '__custom_action')
    }
  }

  this.getActionForCurrentPhase = function(actionName) {
    const phases = this.currentGame.currentRuleSet.gameplay
    for(const idx in phases) {
      if(phases[idx].name === this.currentGame.currentPhase) {
        return phases[idx].playerActions[actionName]
      }
    }
    return undefined
  }

  this.runAction = function(actionName, action, player) {
    const fn = this.paListeners()['__'+actionName]
    if(typeof fn === 'function') {
      fn(action, player)
      return this
    } else {
      console.error(`${actionName} is not a function`)
      return undefined
    }
  }

  return this
}