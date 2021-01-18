import Actions from '../src/actions.js'
import Effects from '../src/effects.js'
import Logic from '../src/logic.js'

import _ from 'lodash'

import * as State from '../src/state.js'

function isSatisfied(given, player) {
  // console.log('isSatisfied: ', given)
  if(!_.isUndefined(given)) {
    const bSat = [Logic.isSatisfied(given, this.gs.glomVars(player))]
    return !_.includes(bSat, false)
  }
  return true
}

function handleEffect(effect, player) {
  console.debug('handleEffect: ', this.gs, effect, player)
  if (isSatisfied.call(this, effect.given, player)) {
    for (const ef in effect) {
      const fn = Effects[ef]
      if (typeof fn === 'function') {
        // Update player variables between effect calls
        _.assign(player, this.gs.players[player.idx])
        this.gs = fn.call({}, this.gs, effect[ef], player)
      } else if (typeof fn === 'symbol' && ef === 'effect') {
        handleEffects.call(this, effect.effect, player)
      } else if (_.isUndefined(fn)) {
        console.error('Undefined function for effect: ', ef)
      }
    }
  } else {
    handleEffects.call(this, effect.else, player)
  }
}

function handleEffects(effects, player) {
  if (Array.isArray(effects)) {
    for (const ef in effects) {
      handleEffect.call(this, effects[ef], player)
    }
  }
}

export default function Instance() {
  this.gs = {}
  return this
}

Instance.prototype.constructor = Instance

Instance.prototype.setGameState = function(newGS) {
  this.gs = newGS
}

Instance.prototype.getGameState = function() {
  return this.gs
}

Instance.prototype.setupGameState = function(ruleSet) {
  this.gs = new State.GameState()
  this.gs.currentRuleSet = ruleSet
  if(ruleSet.initialPhase) {
    this.gs.currentPhase = ruleSet.initialPhase
  } else {
    this.gs.currentPhase = ruleSet.gameplay[0].name
  }
}

Instance.prototype.paListeners = function(callbackFn) {
  const mm = this
  function wrapListener(fn, name) {
    return (e, p, ps) => {
      console.debug(name + ' event handler: ', mm, e, p, ps)
      _.assign(p, ps)
      try {
        // mm.gs = fn.call(mm, mm.gs, e, p.idx, ps)
        p.selectedCards = ps.selectedCards
        p.selectedPlayer = ps.selectedPlayer
        handleEffects.call(mm, e.effect, p)
        if(typeof callbackFn === 'function') {
          callbackFn(e, p)
        }
      } catch(ex) {
        console.error('Error running the ruleset: ', ex)
      }
    }
  }
  return {
    __custom_action: wrapListener(Actions.customAction, '__custom_action')
  }
}

Instance.prototype.getActionForCurrentPhase = function(actionName) {
  console.log('looking up action: ', actionName)
  const phases = this.instance.gs.currentRuleSet.gameplay
  for(const phase of phases) {
    if(phase.name === this.instance.gs.currentPhase) {
      for(const action of phase.playerActions) {
        if(action.name === actionName) {
          return action
        }
      }
    }
  }
  return undefined
}
