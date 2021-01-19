grammar Sharp;

// A game must be a collection of:
// properties
// variable declarations
// and at least one phase
//  phases contains at least one action
//   actions contain any number of statements, expressions, or property declarations
game : (prop | var_decl)* phase* ;

// props are single line JSON property declarations.
prop : ID ':' (STRING | NUM) ;

// var_decl is either a pvar or a gvar followed by an assignment.
var_decl : (GVAR | PVAR) ID (ASS decl)? ;

// phase declares a block that contains one or more actions.
phase : 'phase' ID action* 'endphase' ;

// actions are things the player can do during the game.
// They can be derived from built-in actions.
// Disable actions with the optional given block.
action : 'action' ID prop* stat* givenClause? 'endaction' ;
givenClause : 'given' expr+ ;

// Statements can be assignments, built-in functions, or if clauses.
// Statements cannot be general expressions like in some other languages
// This means there are two types of 'if' clauses--for statements and expressions
stat : ID (ASS | PLAYERASS) expr      # assignment
     | ID '(' exprList? ')'           # fnStat
     | predicate elseblock? 'endif'   # ifStat
     ;
predicate : 'if' expr 'then' stat+ ;
elseblock : 'else' stat+ ;

// Expressions return a value.
// If statements used as an expression will always return a value
expr : ID '(' exprList? ')'            # fnExpr
     | 'if' expr 'then' expr ('elif' expr 'then' expr)* ('else' expr)? # ifthen
     | (SUB|NOT) expr                  # unop
     | expr MULDIV expr                # muldiv
     | expr (ADD|SUB) expr             # addsub
     | expr BINOP expr                 # binop
     | (NUM | STRING | BOOL)           # primitive
     | '(' expr ')'                    # paren
     | ID idx+                         # varExpr
     | ID                              # oneVarExpr
     ;
exprList : expr (',' expr)* ;
idx: '.' ID | '[' expr ']' ;

decl : STRING
     | NUM
     | array
     | BOOL
     ;
     
array : '[' value (',' value)* ']'
      | '[' ']'
      ;

value : NUM
      | BOOL
      | STRING
      ;

// Tokens
PVAR : 'pvar' ;
GVAR : 'gvar' ;
BOOL : 'true' | 'false' ;

ID : [a-zA-Z]+ [a-zA-Z_0-9]* | '$' ID | '_' ID ;
NUM : '-'? [0-9]* '.'? [0-9]+ ;

STRING : '"' (ESC|.)*? '"' ;
fragment ESC : '\\' [btnr"\\] ;

WS : [ \t\r\n]+ -> skip ;
SL_COMMENT : WS* '#' .*? '\n' -> skip ;

/* NEWLINE : '\r'? '\n' ;
 */

MULDIV : MUL | DIV | MOD ;
BINOP : EQ | LT | GT | LTE | GTE | NEQ | AND | OR ;

MOD : '%' ;
MUL : '*' ;
DIV : '/' ;

ADD : '+' ;
SUB : '-' ;

AND : '&&' ;
OR : '||' ;
EQ : '==' ;
LT : '<' ;
GT : '>' ;
LTE : '<=' ;
GTE : '>=' ;
NEQ : '!=' ;

NOT : '!' ;

ASS : '=' ;
PLAYERASS : '@=' ;
