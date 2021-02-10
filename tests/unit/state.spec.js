import _ from 'lodash'
import { Card } from '@/cards.js'
import { RifArray, Rif } from '@/state.js'

describe('RifArray and Rif tests', () => {
  test('RifArray is iterable', () => {
    let rifs = new RifArray()
    rifs.addRif(new Rif('curTrick'))
    rifs.addRif(new Rif('anotherTrick'))

    expect(rifs.length).toBe(2)
    rifs.curTrick.cards = [new Card(2, 1)]

    rifs = Object.assign(new RifArray(), rifs)
    expect(rifs.curTrick.cards.length).toBe(1)
    expect(rifs.curTrick.cards[0].toString()).toBe('A♡')
    
    const rifToCheck = []
    for(let r of rifs) {
      rifToCheck.push(r.name)
    }
    expect(rifToCheck.length).toBe(2)
    expect(rifToCheck).toEqual(['curTrick', 'anotherTrick'])
  })

  test('Rif is usable', () => {
    const r = new Rif('Sample', Rif.FACE_UP, Rif.HORIZONTAL)
    r.cards = [new Card(2, 1), new Card(2, 2), new Card(2, 3)]

    expect(r.name).toBe('Sample')
    expect(r.orientation).toBe(Rif.FACE_UP)
    expect(r.display).toBe(Rif.HORIZONTAL)

    expect(r.cards.length).toBe(3)
    const cardsToCheck = []
    for(let c of r) {
      cardsToCheck.push(c.toString())
    }
    expect(cardsToCheck).toEqual(['A♡', '2♡', '3♡'])
    expect(r.cards[0].toString()).toBe('A♡')
  })
})