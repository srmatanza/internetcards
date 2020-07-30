
import * as Cards from '@/cards.js'

test('We can print a card', () => {
    const twoOfClubs = new Cards.Card(1, 2)
    expect(Cards.printCard(twoOfClubs)).toBe('2♠')
})
