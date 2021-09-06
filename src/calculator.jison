/* description: Parses and executes mathematical expressions. */

%{
var Decimal = require('decimal.js');

%}

/* lexical grammar */
%lex
%%

\s+                   /* skip whitespace */
[0-9]+("."[0-9]+)?\b  return 'NUMBER'
"*"                   return '*'
"/"                   return '/'
"-"                   return '-'
"+"                   return '+'
"^"                   return '^'
"!"                   return '!'
"%"                   return '%'
"("                   return '('
")"                   return ')'
"PI"                  return 'PI'
"E"                   return 'E'
<<EOF>>               return 'EOF'
.                     return 'INVALID'

/lex

/* operator associations and precedence */

%left '+' '-'
%left '*' '/'
%left '^'
%right '!'
%right '%'
%left UMINUS

%start expressions

%% /* language grammar */

expressions
    : e EOF
        { typeof console !== 'undefined' ? console.log($1) : print($1);
          return $1; }
    ;

e
    : e '+' e
        {$$ = $1.plus($3);}
    | e '-' e
        {$$ = $1.minus($3);}
    | e '*' e
        {$$ = $1.times($3);}
    | e '/' e
        {$$ = $1.dividedBy($3);}
    | e '^' e
        {$$ = $1.toPower($3);}
    | '-' e %prec UMINUS
        {$$ = $2.negated();}
    | '(' e ')'
        {$$ = $2;}
    | NUMBER
        {$$ = new Decimal(yytext);}
    ;
