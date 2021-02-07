import sharp2json from '@/sharp/transpile.js'

describe('Transpiler tests', () => {

  test('Properties work', () => {
    const sharp = 'name: "Properties"'
    const obj = sharp2json(sharp)

    expect(obj.name).toEqual('Properties')
  })

  test('Assignment works', () => {
    const sharp = 'gvar gBool phase lobby action assignment gBool = false endaction endphase'
    const obj = sharp2json(sharp)

    expect(obj.gameplay[0].playerActions[0].effect[0]).toStrictEqual({"set_var": { "gBool": false}})
  })

  test('if/then works', () => {
    const sharp = 'phase a action a if a then fn(1) endif if b then fn(2) endif endaction endphase'
    const obj = sharp2json(sharp)

    expect(obj.gameplay[0].playerActions[0].effect[0]).toStrictEqual({
      "effect": [
        {"fn": [1]}
      ],
      "else": [],
      "given": [
        {"var": "a"}
      ]
    })
    expect(obj.gameplay[0].playerActions[0].effect[1]).toStrictEqual({
      "effect": [
        {"fn": [2]}
      ],
      "else": [],
      "given": [
        {"var": "b"}
      ]
    })
  })

  test('if/then/else works', () => {
    const sharp = 'phase a action a if a then fn(1) else fn(2) endif endaction endphase'
    const obj = sharp2json(sharp)

    expect(obj.gameplay[0].playerActions[0].effect[0]).toStrictEqual({
      "effect": [
        {"fn": [1]}
      ],
      "else": [
        {"fn": [2]}
      ],
      "given": [
        {"var": "a"}
      ]
    })
  })

  test('nested if/then works', () => {
    const sharp = 'phase a action a if a then if b then fn(1) endif endif endaction endphase'
    const obj = sharp2json(sharp)

    expect(obj.gameplay[0].playerActions[0].effect[0]).toStrictEqual({
      "effect": [{
        "effect": [{
          "fn": [1]
        }],
        "else": [],
        "given": [
          {"var": "b"}
        ]
      }],
      "else": [],
      "given": [
        {"var": "a"}
      ]
    })
  })

  test('nested if/then/else works', () => {
    const sharp = 'phase a action a if a then fn(1) else if b then fn(2) endif endif endaction endphase'
    const obj = sharp2json(sharp)

    expect(obj.gameplay[0].playerActions[0].effect[0]).toStrictEqual({
      "effect": [{
        "fn": [1]
      }],
      "else": [{
        "effect": [{
          "fn": [2]
        }],
        "else": [],
        "given": [
          {"var": "b"}
        ]
      }],
      "given": [
        {"var": "a"}
      ]
    })
  })

  test('unary expressions work with precedence', () => {
    const sharp = 'phase a action a given !a || b endaction endphase'
    const obj = sharp2json(sharp)

    expect(obj.gameplay[0].playerActions[0].given[0]).toStrictEqual({
      "or": [
        { "!": [
          { "var": "a" }
        ]},
        { "var": "b" }
      ]
    })
  })

  test('binary expressions work with precedence', () => {
    const sharp = 'phase a action a given (1 + 2 * 3) (1 + 2) * 3 endaction endphase'
    const obj = sharp2json(sharp)

    expect(obj.gameplay[0].playerActions[0].given[0]).toStrictEqual({
      "+": [1, {
        "*": [2, 3]
      }]
    })
    expect(obj.gameplay[0].playerActions[0].given[1]).toStrictEqual({
      "*": [{
        "+": [1, 2]
      }, 3]
    })
  })

  test('var subscript expressions', () => {
    const sharp = 'phase a action a fn($a.$b[1+2][$d.$e]) endaction endphase'
    const sharp2 = 'phase a action a fn($a.$b[1+2].$c) endaction endphase'
    const sharp3 = 'phase a action a fn($a.$b[1+2].$c["hand"]) endaction endphase'
    const sharp4 = 'phase a action a fn($a[$b]) endaction endphase'
    const sharp5 = 'phase a action a fn($a[0]) endaction endphase'

    let obj = sharp2json(sharp)
    expect(obj.gameplay[0].playerActions[0].effect[0]).toStrictEqual({
      fn: [
        {
          getAt: [
            {
              getAt: [
                { var: "$a.$b" },
                { "+": [1, 2] }
              ]
            },
            { "var": "$d.$e" }
          ]
        }
      ]
    })

    obj = sharp2json(sharp2)
    expect(obj.gameplay[0].playerActions[0].effect[0]).toStrictEqual({
      fn: [
        {
          getAt: [
            {
              getAt: [
                { var: "$a.$b" },
                { "+": [1, 2] }
              ]
            },
            "$c"
          ]
        }
      ]
    })

    obj = sharp2json(sharp3)
    expect(obj.gameplay[0].playerActions[0].effect[0]).toStrictEqual({
      fn: [
        {
          getAt: [
            {
              getAt: [
                {
                  getAt: [
                    { var: "$a.$b" },
                    { "+": [1, 2] }
                  ]
                },
                "$c"
              ]
            },
            "hand"
          ]
        }
      ]
    })

    obj = sharp2json(sharp4)
    expect(obj.gameplay[0].playerActions[0].effect[0]).toStrictEqual({
      fn: [
        {
          getAt: [
            { var: "$a" },
            { var: "$b" }
          ]
        }
      ]
    })

    obj = sharp2json(sharp5)
    expect(obj.gameplay[0].playerActions[0].effect[0]).toStrictEqual({
      fn: [
        {
          getAt: [
            { var: "$a" },
            0
          ]
        }
      ]
    })
  })

  test('negation issues', () => {
    const sharp = 'phase a action x a = a - b endaction endphase'
    const obj = sharp2json(sharp)

    expect(obj.gameplay[0].playerActions[0].effect[0]).toStrictEqual({
      "set_var": {
        "a": {
          "-": [{ "var": "a" }, { "var": "b" }]
        }
      }
    })
  })

  test('assignments are ordered correctly: ', () => {
    const sharp = 'phase a action x a = 0 b = 1 c = 2 endaction endphase'
    const obj = sharp2json(sharp)

    // not sure why these are backward...
    expect(obj.gameplay[0].playerActions[0].effect).toStrictEqual([
      {
        "set_var": { "a": 0 }
      }, 
      {
        "set_var": { "b": 1 }
      }, 
      {
        "set_var": { "c": 2 }
      } 
      ])
  })

  test('test assign all players', () => {
    //
    const sharp = 'phase a action x @[pA = true] endaction endphase'
    const sharp2 = 'phase a action x @[fn()] endaction endphase'
    const sharp3 = 'phase a action x @[if true then fn() else fn2() endif] endaction endphase'

    let obj = sharp2json(sharp)
    expect(obj.gameplay[0].playerActions[0].effect[0]).toStrictEqual({
      effect: [{
      "set_var": {
        "pA": true
      }}],
      eachplayer: true
    })

    obj = sharp2json(sharp2)
    expect(obj.gameplay[0].playerActions[0].effect[0]).toStrictEqual({
      effect: [{
        fn: []
      }],
      eachplayer: true
    })

    obj = sharp2json(sharp3)
    // console.log(JSON.stringify(obj, null, 2))
    expect(obj.gameplay[0].playerActions[0].effect[0]).toStrictEqual({
      effect: [{
        effect: [{
          fn: []
        }],
        else: [{
          fn2: []
        }],
        given: [true]
      }],
      eachplayer: true
    })
  })
})
