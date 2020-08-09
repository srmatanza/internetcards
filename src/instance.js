import Actions from '../src/actions.js'
import Effects from '../src/effects.js'
import Logic from '../src/logic.js'

import _ from 'lodash'

import * as State from '../src/state.js'

function isSatisfied(given, player) {
  // console.log('isSatisfied: ', given)
  if(!_.isUndefined(given)) {
    const bSat = Logic.isSatisfied(given, this.gs.glomVars(player))
    return !_.includes(bSat, false)
  }
  return true
}

function efHandlers() {
  return {
    set_var: Effects.setVar,
    set_var_player: Effects.setVarPlayer,
    set_var_each_player: Effects.setVarEachPlayer,
    change_phase: Effects.changePhase,
    increment_var: Effects.incrementVar,
    advance_player: Effects.advancePlayer,
    move_cards: Effects.moveCards,
    set_player: Effects.setPlayer,
    given: Symbol('given')
  }
}

function handleEffect(effect, player) {
  if (isSatisfied.call(this, effect.given, player)) {
    for (const ef in effect) {
      const fn = efHandlers()[ef]
      if (typeof fn === 'function') {
        this.gs = fn.call({}, this.gs, effect[ef], player)
      } else if (_.isUndefined(fn)) {
        console.error('Undefined function for effect: ', ef)
      }
    }
  }
}

function handleEffects(effects, player) {
  if (Array.isArray(effects)) {
    for (const ef in effects) {
      handleEffect.call(this, effects[ef], player)
    }
  } else {
    handleEffect.call(this, effects, player)
  }
}

export default function() {
  return {
    gs: {},
    setGameState: function(newGS) {
      this.gs = newGS
    },
    getGameState: function() {
      return this.gs
    },
    setupGameState: function(ruleSet) {
      this.gs = new State.GameState()
      this.gs.currentRuleSet = ruleSet
      this.gs.currentPhase = ruleSet.initialPhase
    },
    paListeners: function(callbackFn) {
      const mm = this
      function wrapListener(fn, name) {
        return (e, p, ps) => {
          console.debug(name + ' event handler: ', mm, e, p, ps)
          _.assign(p, ps)
          mm.gs = fn.call(mm, mm.gs, e, p.idx, ps)
          p.selectedCards = ps.selectedCards
          p.selectedPlayer = ps.selectedPlayer
          handleEffects.call(mm, e.effect, p)
          callbackFn()
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
    },
    getActionForCurrentPhase: function(actionName) {
      const phases = this.gs.currentRuleSet.gameplay
      for(const idx in phases) {
        if(phases[idx].name === this.gs.currentPhase) {
          return phases[idx].playerActions[actionName]
        }
      }
      return undefined
    },
    runAction: function(actionName, action, player, ps) {
      const fn = this.paListeners()['__'+actionName]
      if(typeof fn === 'function') {
        fn(action, player, ps)
        return this
      } else {
        console.error(`${actionName} is not a function`)
        return undefined
      }
    }
  }
}
