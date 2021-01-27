const antlr4 = require('antlr4')

const SharpLexer = require('./SharpLexer.js').SharpLexer
const SharpParser = require('./SharpParser.js').SharpParser
const SharpListener = require('./SharpListener.js').SharpListener

// const fs = require('fs')
// const process = require('process')

function GameListener() {
  antlr4.tree.ParseTreeListener.call(this)
  this.gameObj = {
    gameVariables: {},
    playerVariables: {},
    gameplay: []
  }
  this.exprStack = []
  this.actionStack = []
  this.cstStack = []
  this.getAtStack = []
  return this
}

GameListener.prototype = Object.create(SharpListener.prototype)
GameListener.prototype.constructor = GameListener

GameListener.prototype.enterGame = function(ctx) {
  this.currentPropTarget = this.gameObj
}
GameListener.prototype.exitGame = function(ctx) {
  console.log('Game Object')
  console.log(JSON.stringify(this.gameObj, null, 2))
}

GameListener.prototype.enterProp = function(ctx) {
  let val = ''
  const key = ctx.ID().getText()
  if(ctx.STRING()) {
    val = ctx.STRING().getText().slice(1, -1)
  } else {
    val = ctx.NUM().getText()
  }
  this.currentPropTarget[key] = val
}
GameListener.prototype.exitProp = function(ctx) {}

GameListener.prototype.enterVar_decl = function(ctx) {
  let val = '""'
  let varname = ''
  let varType = ''
  if(ctx.GVAR()) {
    varType = 'gameVariables'
    // console.log('parsing globalvar')
  } else if(ctx.PVAR()) {
    varType = 'playerVariables'
    // console.log('parsing playervar')
  }
  if(ctx.ID()) {
    varname = ctx.ID().getText()
  }
  if(ctx.decl()) {
    val = ctx.decl().getText()
  }
  this.gameObj[varType][varname] = JSON.parse(val)
}
GameListener.prototype.exitVar_decl = function(ctx) {}

GameListener.prototype.enterPhase = function(ctx) {
  const actions = []
  const newPhase = {
    name: ctx.ID().getText(),
    playerActions: actions
  }
  this.gameObj.gameplay.push(newPhase)
  this.currentPhase = actions
  this.currentPropTarget = newPhase
}
GameListener.prototype.exitPhase = function(ctx) {
  this.currentPropTarget = this.gameObj
}

GameListener.prototype.enterAction = function(ctx) {
  // console.log('action: ', ctx.ID().getText())
  const effects = []
  const newAction = {
    id: ctx.ID().getText(),
    effect: effects
  }
  this.currentPhase.push(newAction)
  this.currentAction = newAction
  this.currentStatementTarget = effects
  this.currentPropTarget = newAction
}
GameListener.prototype.exitAction = function(ctx) {
  this.currentPropTarget = this.currentPhase
}

GameListener.prototype.enterGivenClause = function(ctx) {
  const given = []
  this.currentAction.given = given
  this.currentExpr = given
}
GameListener.prototype.exitGivenClause = function(ctx) {}

GameListener.prototype.enterAssignment = function(ctx) {
  this.currentExpr = []
  this.pushExpr(ctx.ID().getText())
}
GameListener.prototype.exitAssignment = function(ctx) {
  const rvalue = this.currentExpr[0]
  const varName = ctx.ID().getText()

  let varAss = 'set_var'
  if(ctx.PLAYERASS()) {
    varAss = 'set_var_each_player'
  }

  let setVar = this.currentStatementTarget.find(o => Object.prototype.hasOwnProperty.call(o, varAss))
  if(setVar) {
    setVar[varAss][varName] = rvalue
  } else {
    setVar = {}
    setVar[varAss] = {}
    setVar[varAss][varName] = rvalue
    this.currentStatementTarget.push(setVar)
  }

  this.popExpr()
}

GameListener.prototype.enterFnStat = function(ctx) {
  const newExpr = []
  this.currentFnCall = {}
  this.currentFnCall[ctx.ID().getText()] = newExpr
  this.currentExpr = newExpr
}
GameListener.prototype.exitFnStat = function(ctx) {
  const fnArgs = this.currentFnCall
  this.currentStatementTarget.push(fnArgs)
}

GameListener.prototype.enterIfStat = function(ctx) {
}

GameListener.prototype.enterPredicate = function(ctx) {
  const given = []
  const effect = []
  const newEffect = {
    effect: effect,
    else: [],
    given: given
  }
  this.actionStack.push(this.currentAction)
  this.currentStatementTarget.push(newEffect)

  this.currentAction = newEffect
  this.cstStack.push(this.currentStatementTarget)
  this.currentStatementTarget = effect
  this.currentExpr = given
}
GameListener.prototype.exitPredicate = function(ctx) {
  this.currentStatementTarget = this.cstStack.pop()
}

GameListener.prototype.enterElseblock = function(ctx) {
  const elseBlock = []
  this.currentAction.else = elseBlock
  this.cstStack.push(this.currentStatementTarget)
  this.currentStatementTarget = elseBlock
}
GameListener.prototype.exitElseblock = function(ctx) {
  this.currentStatementTarget = this.cstStack.pop()
}

GameListener.prototype.exitIfStat = function(ctx) {
  this.currentAction = this.actionStack.pop()
}

// Handle Expressions and the alternatives
GameListener.prototype.pushExpr = function(id) {
  this.curId = id
  const newObj = {}
  const expr = []
  newObj[id] = expr

  this.exprStack.push(this.currentExpr)
  this.currentExpr.push(newObj)
  this.currentExpr = expr
}
GameListener.prototype.popExpr = function() {
  const parentExpr = this.exprStack.pop()
  this.currentExpr = parentExpr
}

GameListener.prototype.enterFnExpr = function(ctx) {
  const id = ctx.ID().getText()
  this.pushExpr(id)
}
GameListener.prototype.exitFnExpr = function(ctx) {
  this.popExpr()
}

GameListener.prototype.enterOneVarExpr = function(ctx) {
  const varStr = ctx.ID().getText()
  this.currentExpr.push({
    var: varStr
  })
}
GameListener.prototype.exitOneVarExpr = function(ctx) {}

GameListener.prototype.enterVarExpr = function(ctx) {
  const varStr = ctx.ID().getText()
  // console.log('enterVarExpr: ', varStr)
  this.currentVarExpr = [varStr]
  this.getAtStack.push(this.currentGAStack)
  this.currentGAStack = undefined
}
GameListener.prototype.enterIdx = function(ctx) {
  if(ctx.ID()) {
    // concatenate this id to the var name
    const id = ctx.ID().getText()
    // console.log('ID: ', id)
    this.currentVarExpr.push(id)
  } else {
    // console.log('expr: ', ctx.getText())
    const targetExpr = []
    if(this.currentGAStack && this.currentVarExpr.length) {
      const oldGet = this.currentGAStack
      targetExpr.push({
        getAt: [
          oldGet,
          this.currentVarExpr.join('.')
        ]
      })
    } else if(this.currentGAStack) {
      const oldGet = this.currentGAStack
      targetExpr.push(oldGet)
    } else {
      targetExpr.push({ var: this.currentVarExpr.join('.') })
    }
    this.currentGAStack = {
      getAt: targetExpr
    }
    this.exprStack.push(this.currentExpr)
    this.currentExpr = targetExpr
  }
}
GameListener.prototype.exitIdx = function(ctx) {
  if(ctx.expr()) {
    this.currentExpr = this.exprStack.pop()
    this.currentVarExpr = []
    // console.log('exitIdx.expr: ', this.currentGAStack)
  }
}

GameListener.prototype.exitVarExpr = function(ctx) {
  if(this.currentVarExpr.length && this.currentGAStack) {
    const oldGet = this.currentGAStack
    this.currentGAStack = {
      getAt: [
        oldGet,
        this.currentVarExpr.join('.')
      ]
    }
  }
  const newExpr = []
  if(this.currentGAStack) {
    newExpr.push(this.currentGAStack)
  } else {
    newExpr.push({
      var: this.currentVarExpr.join('.')
    })
  }
  // console.log('newExpr: ', newExpr[0])
  this.currentExpr.push(newExpr[0])

  this.currentGAStack = this.getAtStack.pop()
}

GameListener.prototype.enterIfthen = function(ctx) {
  const id = 'if'
  this.pushExpr(id)
}
GameListener.prototype.exitIfthen = function(ctx) {
  this.popExpr()
}

GameListener.prototype.enterMuldiv = function(ctx) {
  const id = ctx.mulDiv().getText()
  this.pushExpr(id)
}
GameListener.prototype.exitMuldiv = function(ctx) {
  this.popExpr()
}

GameListener.prototype.enterAddsub = function(ctx) {
  console.log('enterAddSub: ', ctx)
  const id = ctx.addSub().getText()
  this.pushExpr(id)
}
GameListener.prototype.exitAddsub = function(ctx) {
  this.popExpr()
}

GameListener.prototype.enterBinop = function(ctx) {
  const id = ctx.binOp().getText()
  let opName = id
  if(id === '&&') {
    opName = 'and'
  } else if(id === '||') {
    opName = 'or'
  }
  this.pushExpr(opName)
}
GameListener.prototype.exitBinop = function(ctx) {
  this.popExpr()
}

GameListener.prototype.enterUnop = function(ctx) {
  const id = ctx.unOp().getText()
  this.pushExpr(id)
}
GameListener.prototype.exitUnop = function(ctx) {
  this.popExpr()
}

GameListener.prototype.enterPrimitive = function(ctx) {
  if(ctx.NUM()) {
    // console.log('Num primitive: ', ctx.getText())
    this.currentExpr.push(parseFloat(ctx.getText()))
  } else if(ctx.STRING()) {
    // console.log('String primitive: ', ctx.getText())
    this.currentExpr.push(ctx.getText().slice(1, -1))
  } else {
    // console.log('Bool primitive: ', ctx.getText())
    this.currentExpr.push(ctx.getText() === 'true')
  }
}
GameListener.prototype.exitPrimitive = function(ctx) {
}

export default function sharp2json(sharpFile) {
  const input = sharpFile
  const chars = new antlr4.InputStream(input)
  const lexer = new SharpLexer(chars)
  const tokens = new antlr4.CommonTokenStream(lexer)
  const parser = new SharpParser(tokens)

  parser.buildParseTrees = true
  const tree = parser.game()

  const printer = new GameListener()
  antlr4.tree.ParseTreeWalker.DEFAULT.walk(printer, tree)

  return printer.gameObj
}

/*
if(process.argv.length > 2) {
  fs.readFile(process.argv[2], 'utf8', (err, data) => {
    console.log('Trying to open ' + process.argv[2])
    try {
      const gameOutput = JSON.stringify(sharp2json(data))
      const fileName = process.argv[2].replace(/\.sharp$/, '.json')
      console.log('writing file to ', fileName)
      fs.writeFile(fileName, gameOutput, (err) => {
          if (err) throw err;
          console.log('The file has been saved!');
      });
    }
    catch(ex) {
      console.log('Caught an exception trying to parse.', ex)
    }
  })
}
*/
