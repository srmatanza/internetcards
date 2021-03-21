
function SelectionNode(cardIdx, rif, playerName) {
  this.card = cardIdx // :number
  this.rif = rif // :string
  this.player = playerName // :string
  return this
}

export function SelectionTree() {
  this.players = [] // :string[]
  this.rifs = [] // :string[]
  this.cards = [] // :SelectionNode[]

  return this
}

function _getRifName(rifId, playerName) {
  return `${rifId}:${playerName}`
}

const bSelectMultipleRifs = false

SelectionTree.prototype.getCardsForRif = function(rifId, playerName) {
  const cardNodes = this.cards.filter(c => c.rif === rifId && c.player === playerName)
  return cardNodes.map(cn => cn.card)
}

SelectionTree.prototype.isRifSelected = function(rifId, playerName) {
  const rifName = _getRifName(rifId, playerName)
  return this.rifs.includes(rifName)
}

SelectionTree.prototype.appendRif = function(rifId, playerName) {
  const rifName = _getRifName(rifId, playerName)
  const idx = this.rifs.findIndex(r => r === rifName)
  if(idx > -1) {
    this.rifs.splice(idx, 1)
  } else {
    if(!bSelectMultipleRifs) {
      this.rifs.splice(0)
    }
    this.rifs.push(rifName)
  }
}

SelectionTree.prototype.selectRif = function(rifId, playerName) {
  const rifName = _getRifName(rifId, playerName)
  const idx = this.rifs.findIndex(r => r === rifName)
  if(idx > -1) {
    this.rifs.splice(idx, 1)
  } else {
    this.rifs.splice(0)
    this.rifs.push(rifName)
  }
}

SelectionTree.prototype.rangeCard = function(cardIdx, lastIdx, rifId, playerName) {
  if(this.cards.every(c => c.player === playerName && c.rif === rifId) === false) {
    this.cards.splice(0)
  }
  const idx = this.cards.findIndex(sn => sn.card === cardIdx && sn.rif === rifId && sn.player === playerName)
  const firstInRif = this.cards.findIndex(sn => sn.rif === rifId && sn.player === playerName)
  const keepers = this.cards.filter(sn => !(sn.rif === rifId && sn.player === playerName))
  this.cards.splice(0)
  this.cards.push(...keepers)
  if(idx === -1 || idx !== firstInRif) {
    for(let i = cardIdx; i<lastIdx; i++) {
      this.cards.push(new SelectionNode(i, rifId, playerName))
    }
  }
}

SelectionTree.prototype.appendCard = function(cardIdx, rifId, playerName) {
  if(this.cards.every(c => c.player === playerName && c.rif === rifId) === false) {
    this.cards.splice(0)
  }
  const idx = this.cards.findIndex(sn => sn.card === cardIdx && sn.rif === rifId && sn.player === playerName)
  if(idx > -1) {
    this.cards.splice(idx, 1)
  } else {
    this.cards.push(new SelectionNode(cardIdx, rifId, playerName))
  }
}

SelectionTree.prototype.selectCard = function(cardIdx, rifId, playerName) {
  if(this.cards.every(c => c.player === playerName && c.rif === rifId) === false) {
    this.cards.splice(0)
  }
  const idx = this.cards.findIndex(sn => sn.card === cardIdx && sn.rif === rifId && sn.player === playerName)
  if(idx > -1) {
    this.cards.splice(idx, 1)
  } else {
    const keepers = this.cards.filter(sn => !(sn.rif === rifId && sn.player === playerName))
    this.cards.splice(0)
    this.cards.push(...keepers)
    this.cards.push(new SelectionNode(cardIdx, rifId, playerName))
  }
}

SelectionTree.prototype.clear = function() {
  this.players = []
  this.rifs = []
  this.cards = []
}
