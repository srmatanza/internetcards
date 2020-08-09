const ruleset = {
  name: 'Hearts',
  author: 'Mike McEuen',
  contact: 'srmatanza@gmail.com',
  gameVariables: {
    playersPassed: 0,
    playersPlayedTrick: 0,
    trickWinner: '',
    ledCard: '',
    passRecipient: [1, 3, 2, 0],
    roundIdx: 0,
    maxPoints: 100,
    heartsBroken: false,
    cardsDealt: false,
    trickTaken: false,
    doneScoring: false,
    trick: []
  },
  playerVariables: {
    points: 0,
    tricksTaken: []
  },
  possiblePlayers: [
    4
  ],
  initialPhase: 'setup',
  gameplay: [
    {
      name: 'setup',
      playerActions: {
        deal: {
          name: 'Deal',
          cards: 52,
          given: [
            { '!': { var: 'cardsDealt' } }
          ],
          effect: {
            set_var: {
              cardsDealt: true
            }
          }
        },
        custom_action: {
          name: 'Pass Cards',
          effect: [
            {
              increment_var: {
                playersPassed: 1
              }
            },
            {
              move_cards: {
                fromPlayerIdx: { var: '$player.idx' },
                fromHand: 'hand',
                toPlayerIdx: {
                  '%': [
                    {
                      '+': [
                        { var: '$player.idx' },
                        { getAt: [{ var: 'roundIdx' }, { var: 'passRecipient' }] }
                      ]
                    },
                    4
                  ]
                },
                toHand: 'hand',
                cards: { var: '$selectedCards' }
              }
            }
          ],
          given: [
            {
              var: 'cardsDealt'
            },
            {
              '==': [
                { var: '$selectedCards.length' }, 3
              ]
            }/* ,
            {
              isOtherPlayerSelected: []
            } */
          ]
        },
        lead: {
          name: 'Lead',
          message: 'Lead with the 2C',
          tooltip: 'You may only lead the first trick if your hand contains the Two of Clubs',
          effect: {
            change_phase: 'trick_taking',
            set_var: {
              playersPassed: 0,
              playersPlayedTrick: 1,
              trickWinner: { var: '$player' },
              ledCard: { var: '$selectedCards.0' }
            },
            set_player: {
              '+': [{ var: '$player.idx' }, 1]
            }
          },
          given: [
            {
              handContainsCard: ['2C', { var: '$selectedCards' }]
            },
            {
              '==': [{ var: '$selectedCards.length' }, 1]
            },
            {
              '==': [
                {
                  var: 'playersPassed'
                },
                {
                  var: '$playerCount'
                }
              ]
            }
          ]
        }
      }
    },
    {
      name: 'trick_taking',
      playerActions: {
        play_card: {
          name: 'Play Card',
          effect: [
            {
              advance_player: 1
            },
            {
              increment_var: {
                playersPlayedTrick: 1
              }
            },
            {
              set_var: {
                heartsBroken: true
              },
              given: [
                {
                  handContainsSuit: ['H', { var: '$selectedCards' }]
                }
              ]
            },
            {
              set_var: {
                trickWinner: { var: '$player' },
                ledCard: { var: '$selectedCards.0' }
              },
              given: [
                {
                  '==': [
                    { var: '$selectedCards.0.suit' },
                    { var: 'ledCard.suit' }
                  ]
                },
                {
                  isHighCard: [
                    { var: '$selectedCards.0' },
                    { var: 'ledCard' }
                  ]
                }
              ]
            },
            {
              change_phase: 'trick_scoring',
              set_var: {
                playersPlayedTrick: 0
              },
              set_player: {
                var: 'trickWinner.idx'
              },
              given: [
                {
                  '==': [
                    {
                      var: 'playersPlayedTrick'
                    },
                    {
                      var: '$playerCount'
                    }
                  ]
                }
              ]
            }
          ],
          given: [
            {
              var: '$isYourTurn'
            },
            {
              '==': [{ var: '$selectedCards.length' }, 1]
            },
            {
              or: [
                { // SC is same suit as ledCard
                  '==': [
                    { var: 'ledCard.suit' },
                    { var: '$selectedCards.0.suit' }
                  ]
                },
                { // You have no ledCard.suit cards in your hand
                  '!': [
                    {
                      handContainsSuit: [
                        { var: 'ledCard.suit' },
                        { var: '$player.hand' }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      }
    },
    {
      name: 'trick_scoring',
      playerActions: {
        take_trick: {
          name: 'Take the Trick',
          message: 'You won the trick!',
          effect: [
            {
              set_var: {
                trickTaken: true
              }
            },
            {
              change_phase: 'scoring',
              given: [
                { '==': [0, { var: '$player.hand.length' }] }
              ]
            }
          ],
          given: [
            {
              '==': [{ var: 'trickWinner.playerName' }, { var: '$player.playerName' }]
            },
            {
              '!': [{ var: 'trickTaken' }]
            }
          ]
        },
        lead: {
          name: 'Lead',
          message: 'Lead a new trick!',
          effect: [
            {
              change_phase: 'trick_taking',
              set_var: {
                playersPassed: 0,
                playersPlayedTrick: 1,
                trickTaken: false,
                trickWinner: { var: '$player' },
                ledCard: { var: '$selectedCards.0' }
              },
              set_player: {
                '+': [{ var: '$player.idx' }, 1]
              }
            },
            {
              set_var: {
                heartsBroken: true
              },
              given: [
                {
                  handContainsSuit: ['H', { var: '$selectedCards' }]
                }
              ]
            }
          ],
          given: [
            {
              '==': [{ var: '$selectedCards.length' }, 1]
            },
            {
              '==': [{ var: 'trickWinner.playerName' }, { var: '$player.playerName' }]
            },
            {
              var: 'trickTaken'
            },
            {
              or: [
                { var: 'heartsBroken' },
                { '!': [{ handContainsSuit: ['H', { var: '$selectedCards' }] }] }
              ]
            }
          ]
        }
      }
    },
    {
      name: 'scoring',
      playerActions: {
        custom_action: {
          name: 'Score Round',
          effect: {
            set_var: {
              doneScoring: true
            },
            set_var_each_player: {
              points: {
                reduce: [
                  { flatten: [{ var: '$player.tricks' }] },
                  {
                    '+': [
                      { var: 'accumulator' },
                      {
                        if: [
                          { '==': [2, { var: 'current.suit' }] }, 1,
                          { cardEq: ['QS', { var: 'current' }] }, 13,
                          0
                        ]
                      }
                    ]
                  },
                  0
                ]
              }
            }
          },
          given: [
            {
              '!': [{ var: 'doneScoring' }]
            }
          ]
        },
        new_round: {
          name: 'New Round',
          effect: {
            set_var: {
              heartsBroken: false,
              cardsDealt: false,
              trickTaken: false,
              doneScoring: false,
              roundIdx: {
                '%': [{ '+': [1, { var: 'roundIdx' }] }, 4]
              }
            },
            change_phase: 'setup'
          },
          given: [
            {
              var: 'doneScoring'
            }
          ]
        }
      }
    }
  ]
}

export default ruleset
