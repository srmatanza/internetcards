grammar Sharp;

// A game must be a collection of:
// properties
// variable declarations
// and at least one phase
//  phases contains at least one action
//   actions contain any number of statements, expressions, or property declarations
game : (prop | var_decl)* phase+ ;

// props are single line JSON property declarations.
prop : '; ' ID (STRING | NUM) ;

// var_decl is either a pvar or a gvar followed by an assignment.
var_decl : (GVAR | PVAR) ID ASS decl ;

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
stat : ID ASS expr                    # assignment
     | ID '(' exprList? ')'           # fnStat
     | predicate stat+ 'endif'         # ifStat
     ;
predicate : 'if' expr 'then' ;

// Expressions return a value.
// If statements used as an expression will always return a value
expr : ID '(' exprList? ')'            # fnExpr
     | (ID IDX?) ('.' ID IDX?)*        # varExpr
     | 'if' expr 'then' expr ('elif' expr 'then' expr)* ('else' expr)? # ifthen
     | expr '.' expr                   # dotop
     | expr MULDIV expr                # muldiv
     | expr ADDSUB expr                # addsub
     | expr BINOP expr                 # binop
     | UNOP expr                       # unop
     | (NUM | STRING | BOOL)           # primitive
     | '(' expr ')'                    # paren
     ;
exprList : expr (',' expr)* ;

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

ID : [a-zA-Z]+ [a-zA-Z_0-9]* | '$' ID;
NUM : '-'? [0-9]* '.'? [0-9]+ ;

STRING : '"' (ESC|.)*? '"' ;
fragment ESC : '\\' [btnr"\\] ;

WS : [ \t\r\n]+ -> skip ;
SL_COMMENT : WS* '#' .*? '\n' -> skip ;

/* NEWLINE : '\r'? '\n' ;
 */

IDX : '[' ([0-9]+ | ID) ']' ;
UNOP : SUB | NOT ;
MULDIV : MUL | DIV | MOD ;
ADDSUB : ADD | SUB ;
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