
function Card(suit, rank) {
  this.suit = suit || 1
  this.rank = rank || 1
  this.lt = function(anotherCard) {
    return (this.rank < anotherCard.rank)
  }
  this.toString = function() {
    return printCard(this)
  }
}

function Deck(cards) {
  this.cards = []
  let len = 52
  if (cards) {
    len = cards.length
  }
  for (let i = 0; i < len; i++) {
    let nc
    if (cards) {
      nc = new Card(cards[i].suit, cards[i].rank)
    } else {
      nc = new Card(Math.floor(i/13)+1, (i%13)+1)
    }
    this.cards.push(nc)
  }

  this.cardsRemaining = function() {
    return this.cards.length
  }
}

function shuffleDeck(deck, fnRng) {
  const rng = fnRng || Math.random
  const toShuf = deck.cards
  const len = toShuf.length
  const cards = []
  for(let i=0; i<len; i++) { cards[i] = toShuf[i] }

  for(let i=0; i<len; i++) {
    const it = parseInt(i+rng()*(toShuf.length-i))
    const c = cards[i]
    cards[i] = cards[it]
    cards[it] = c
  }
  return new Deck(cards)
}

function printCard(card, longValues) {
  const shortSuits = [0, '♠', '♡', '♢', '♣']
  const shortValues = [0, 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
  const wordSuits = ['Spades', 'Hearts', 'Diamonds', 'Clubs']
  const wordValues = ['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Jack', 'Queen', 'King']

  if (longValues) {
    return (
      wordSuits[card.rank] +
      wordValues[card.suit]
    )
  } else {
    return (
      shortValues[card.rank] +
      shortSuits[card.suit]
    )
  }
}

export { Card, Deck, shuffleDeck, printCard }
