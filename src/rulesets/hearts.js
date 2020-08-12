const ruleset = {
  name: 'Hearts',
  author: 'Mike McEuen',
  contact: 'srmatanza@gmail.com',
  gameVariables: {
    gPlayersPassed: 0,
    gPlayedTrick: 0,
    gTrickWinner: '',
    gLedCard: '',
    gPassRecipient: [1, 3, 2, 0],
    gRoundIdx: 0,
    gMaxPoints: 100,
    gHeartsBroken: false,
    gCardsDealt: false,
    gTrickTaken: false,
    gDoneScoring: false,
    gTrick: []
  },
  playerVariables: {
    pPoints: 0,
    pPassCards: true,
    pTricksTaken: []
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
            { '!': { var: 'gCardsDealt' } }
          ],
          effect: {
            set_var: {
              gCardsDealt: true
            }
          }
        },
        custom_action: {
          name: 'Pass Cards',
          effect: [
            {
              increment_var: {
                gPlayersPassed: 1
              }
            },
            {
              set_var_player: {
                pPassCards: false
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
                        { getAt: [{ var: 'gRoundIdx' }, { var: 'gPassRecipient' }] }
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
              var: 'gCardsDealt'
            },
            {
              '==': [
                { var: '$selectedCards.length' }, 3
              ]
            },
            {
              var: 'pPassCards'
            }
          ]
        },
        lead: {
          name: 'Lead',
          message: 'Lead with the 2C',
          tooltip: 'You may only lead the first trick if your hand contains the Two of Clubs',
          effect: {
            change_phase: 'trick_taking',
            set_var: {
              gPlayersPassed: 0,
              gPlayedTrick: 1,
              gTrickWinner: { var: '$player' },
              gLedCard: { var: '$selectedCards.0' }
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
                  var: 'gPlayersPassed'
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
                gPlayedTrick: 1
              }
            },
            {
              set_var: {
                gHeartsBroken: true
              },
              given: [
                {
                  handContainsSuit: ['H', { var: '$selectedCards' }]
                }
              ]
            },
            {
              set_var: {
                gTrickWinner: { var: '$player' },
                gLedCard: { var: '$selectedCards.0' }
              },
              given: [
                {
                  '==': [
                    { var: '$selectedCards.0.suit' },
                    { var: 'gLedCard.suit' }
                  ]
                },
                {
                  isHighCard: [
                    { var: '$selectedCards.0' },
                    { var: 'gLedCard' }
                  ]
                }
              ]
            },
            {
              change_phase: 'trick_scoring',
              set_var: {
                gPlayedTrick: 0
              },
              set_player: {
                var: 'gTrickWinner.idx'
              },
              given: [
                {
                  '==': [
                    {
                      var: 'gPlayedTrick'
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
                { // SC is same suit as gLedCard
                  '==': [
                    { var: 'gLedCard.suit' },
                    { var: '$selectedCards.0.suit' }
                  ]
                },
                { // You have no gLedCard.suit cards in your hand
                  '!': [
                    {
                      handContainsSuit: [
                        { var: 'gLedCard.suit' },
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
                gTrickTaken: true
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
              '==': [{ var: 'gTrickWinner.playerName' }, { var: '$player.playerName' }]
            },
            {
              '!': [{ var: 'gTrickTaken' }]
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
                gPlayersPassed: 0,
                gPlayedTrick: 1,
                gTrickTaken: false,
                gTrickWinner: { var: '$player' },
                gLedCard: { var: '$selectedCards.0' }
              },
              set_player: {
                '+': [{ var: '$player.idx' }, 1]
              }
            },
            {
              set_var: {
                gHeartsBroken: true
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
              '==': [{ var: 'gTrickWinner.playerName' }, { var: '$player.playerName' }]
            },
            {
              var: 'gTrickTaken'
            },
            {
              or: [
                { var: 'gHeartsBroken' },
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
              gDoneScoring: true
            },
            set_var_each_player: {
              pPoints: {
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
              },
              pPassCards: true
            }
          },
          given: [
            {
              '!': [{ var: 'gDoneScoring' }]
            }
          ]
        },
        new_round: {
          name: 'New Round',
          effect: {
            set_var: {
              gHeartsBroken: false,
              gCardsDealt: false,
              gTrickTaken: false,
              gDoneScoring: false,
              gRoundIdx: {
                '%': [{ '+': [1, { var: 'gRoundIdx' }] }, 4]
              }
            },
            change_phase: 'setup'
          },
          given: [
            {
              var: 'gDoneScoring'
            }
          ]
        }
      }
    }
  ]
}

export default ruleset
