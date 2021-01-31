import _ from 'lodash'

import Effects from '../src/effects.js'
import Logic from '../src/logic.js'
import { GameState, PlayerState, RuleSet } from '../src/state.js'

function isSatisfied(given, player) {
  // console.log('isSatisfied: ', given)
  if(!_.isUndefined(given)) {
    const bSat = [Logic.isSatisfied(given, this.glomVars(player))]
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
        this.gs = fn.call({}, this, effect[ef], player)
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
  this.gs = new GameState()
  this.currentRuleSet = new RuleSet()
  return this
}

Instance.prototype.constructor = Instance

Instance.prototype.setGameState = function(newGS) {
  this.gs = Object.assign(this.gs, newGS)
  // copy initial vars from ruleset
  const defaultVars = Object.assign({}, this.currentRuleSet.gameVariables)
  this.gs.gameVariables = Object.assign(defaultVars, newGS.gameVariables)
}

Instance.prototype.getGameState = function() {
  return this.gs
}

Instance.prototype.setRuleSet = function(ruleSet) {
  this.currentRuleSet = ruleSet
}

Instance.prototype.setupGameState = function(ruleSet) {
  this.currentRuleSet = ruleSet
  this.setGameState(new GameState())
  if(ruleSet.initialPhase) {
    this.gs.currentPhase = ruleSet.initialPhase
  } else {
    this.gs.currentPhase = ruleSet.gameplay[0].name
  }
}

Instance.prototype.getPlayer = function(pid) {
  if(typeof pid === 'string') {
    for(const player of this.gs.players) {
      if(pid === player.playerName) {
        return _.assign(new PlayerState(), player)
      }
    }
  } else if(typeof pid === 'number') {
    return _.assign(new PlayerState(), this.gs.players[pid])
  }
  return undefined
}

Instance.prototype.addPlayer = function(playerName) {
  const p = new PlayerState(playerName)
  // Validate new player name that it is not a duplicate
  for(let i=0; i<this.gs.players.length; i++) {
    if(this.gs.players[i].playerName === playerName) {
      console.error('A player with this name already exists.')
      return undefined
    }
  }
  const playerVars = this.currentRuleSet.playerVariables
  _.assign(p.playerVariables, playerVars)
  p.idx = this.gs.players.length
  this.gs.players.push(p)
  return p
}

Instance.prototype.removePlayer = function(playerName) {
  this.gs.players = this.gs.players.filter(player => player.name !== playerName)
}

Instance.prototype.getPlayerCount = function() {
  return this.gs.players.length
}

Instance.prototype.getCurrentPlayer = function() {
  return this.gs.players[this.gs.currentPlayerIdx]
}

Instance.prototype.isCurrentPlayer = function(playerName) {
  return this.gs.currentPlayerIdx === this.getPlayer(playerName).idx
}

Instance.prototype.glomVars = function(player) {
  const phaseVars = {}
  const playerVars = _.assign(_.clone(this.currentRuleSet.playerVariables), player.playerVariables)
  const pv = {
    $player: this.gs.players[player.idx],
    $isYourTurn: this.isCurrentPlayer(player.playerName),
    $selectedCards: player.selectedCards,
    $selectedPlayer: this.getPlayer(player.selectedPlayer),
    $selectedHand: []
  }
  const globalVarsForPlayer = {
    $playerCount: this.getPlayerCount(),
    $currentPlayer: player.idx,
    $possiblePlayers: this.currentRuleSet.possiblePlayers,
    $otherPlayers: this.gs.players,
    $table: this.gs.cards
  }

  const gm = _.assign({}, this.gs.gameVariables, globalVarsForPlayer, playerVars, phaseVars, pv)
  return gm
}

Instance.prototype.paListeners = function(callbackFn) {
  const mm = this
  function wrapListener(name) {
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
    __custom_action: wrapListener('__custom_action')
  }
}

Instance.prototype.getActionForCurrentPhase = function(actionName) {
  console.log('looking up action: ', actionName)
  const phases = this.currentRuleSet.gameplay
  for(const phase of phases) {
    if(phase.name === this.gs.currentPhase) {
      for(const action of phase.playerActions) {
        if(action.name === actionName) {
          return action
        }
      }
    }
  }
  return undefined
}
