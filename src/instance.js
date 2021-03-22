import _ from 'lodash'

import Effects from '../src/effects.js'
import Logic from '../src/logic.js'
import { Rif, GameState, PlayerState, RuleSet } from '../src/state.js'

function isSatisfied(given, player) {
  // console.log('isSatisfied: ', given)
  if(!_.isUndefined(given)) {
    const bSat = [Logic.isSatisfied(given, this.glomVars(player))]
    return !_.includes(bSat, false)
  }
  return true
}

var eachPlayerDepth = 0
var MAX_EACH_PLAYER_DEPTH = 1

function handleEffect(effect, player) {
  // console.debug('handleEffect: ', this.gs, effect, player)
  if (isSatisfied.call(this, effect.given, player)) {
    for (const ef in effect) {
      const fn = Effects[ef]
      if (typeof fn === 'function') {
        // Update player variables between effect calls
        _.assign(player, this.gs.players[player.idx])
        this.gs = fn.call({}, this, effect[ef], player)
      } else if (typeof fn === 'symbol' && ef === 'effect') {
        if(effect.eachplayer && eachPlayerDepth <= MAX_EACH_PLAYER_DEPTH) {
          eachPlayerDepth += 1
          for(const pp of this.gs.players) {
            handleEffects.call(this, effect.effect, pp)
          }
          eachPlayerDepth -= 1
        } else {
          if(eachPlayerDepth>MAX_EACH_PLAYER_DEPTH && effect.eachplayer === true) {
            console.warn('This effect was not executed for each player because it was nested too deep')
          }
          handleEffects.call(this, effect.effect, player)
        }
      } else if (!(typeof fn === 'symbol' && ef === 'eachplayer') && _.isUndefined(fn)) {
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

export default function Instance(rngseed) {
  this.gs = new GameState(rngseed)
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

Instance.prototype.setupGameState = function(ruleSet, rngseed) {
  this.currentRuleSet = ruleSet
  this.setGameState(new GameState(rngseed))
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

function getFirstCard(st) {
  if(st && st.cards && st.cards.length > 0) {
    return st.cards[0]
  }
  return ''
}
Instance.prototype.glomVars = function(player) {
  const phaseVars = {}
  const playerVars = _.assign(_.clone(this.currentRuleSet.playerVariables), player.playerVariables)
  const selCards = new Rif()
  const ps = this.gs.getObjectsFromSelection(player.st)
  const cc = getFirstCard(player.st)
  // console.log('glomming: ', cc, player.st)
  Object.assign(selCards, { rif: cc.rif, player: cc.player })
  selCards.cards = ps.selectedCards || []

  const selRif = {
    name: '',
    player: ''
  }

  const pv = {
    $player: this.gs.players[player.idx],
    $isYourTurn: this.isCurrentPlayer(player.playerName),
    $selectedCards: selCards,
    $selectedRif: selRif,
    $selectedPlayer: this.getPlayer(player.selectedPlayer),
    $selectedHand: []
  }
  const globalVarsForPlayer = {
    $playerCount: this.getPlayerCount(),
    $possiblePlayers: this.currentRuleSet.possiblePlayers,
    $otherPlayers: this.gs.players,
    $table: this.gs.rifs
  }
  const Enums = { FACE_UP: 0, FACE_DOWN: 1, TOP_ONLY: 2, HORIZONTAL: 3, VERTICAL: 4, STACKED: 5, NONE: 6, SINGLE: 7, MULTIPLE: 8, RANGE: 9 }

  const gm = _.assign({}, this.gs.gameVariables, globalVarsForPlayer, playerVars, phaseVars, pv, Enums)
  // console.log('gloms: ', gm)
  return gm
}

Instance.prototype.runAction = function(act, playerName, st) {
  // console.debug('Run action: ', this, act, playerName, st)
  const evt = this.getActionForCurrentPhase(act)
  const player = this.gs.players.find(p => p.playerName === playerName)
  const ps = { st }// this.gs.getObjectsFromSelection(st)

  _.assign(player, ps)
  try {
    // player.selectedCards = ps.selectedCards
    // player.selectedPlayer = ps.selectedPlayer
    handleEffects.call(this, evt.effect, player)
  } catch (ex) {
    console.error('Error running the ruleset: ', ex)
  }
}

Instance.prototype.fnRunAction = function(callbackFn) {
  const mm = this
  return (e, p, st) => {
    // console.debug('Run action w/callback: ', mm, e, p, ps)
    _.assign(p, { st })
    try {
      // mm.gs = fn.call(mm, mm.gs, e, p.idx, ps)
      // p.selectedCards = ps.selectedCards
      // p.selectedPlayer = ps.selectedPlayer
      handleEffects.call(mm, e.effect, p)
      if(typeof callbackFn === 'function') {
        callbackFn(e, p)
      }
    } catch(ex) {
      console.error('Error running the ruleset: ', ex)
    }
  }
}

Instance.prototype.getActionForCurrentPhase = function(actionName) {
  // console.log('looking up action: ', actionName)
  const phases = this.currentRuleSet.gameplay
  for(const phase of phases) {
    if(phase.name === this.gs.currentPhase) {
      for(const action of phase.playerActions) {
        if(action.id === actionName) {
          return action
        }
      }
    }
  }
  return undefined
}
