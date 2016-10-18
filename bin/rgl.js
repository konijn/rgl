"use strict";

//Modules and globals
//Todo make fs work in browser as well
//Get browser arguments in preArgs and postArgs
let isNode = !this.window,
    fs          = isNode?require("fs"):{},
    preArgs     = [],
    postArgs    = [],
    filename    = '',
    app         = isNode?process.argv.shift():navigator.appName,
    interpreter = isNode?process.argv.shift():'Running in browser',
    myProcess   = isNode?process:{ argv : [], exit: n=>console.log('RGL loaded:'+n) , stdout : { write : s=>$('output').innerHTML +=s } };

//Parsing parameters
for( let argument of myProcess.argv ){
  if( argument.startsWith('-') ){
    if( filename ){
      postArgs.push( argument );
    } else {
      preArgs.push( argument );
    }       
  }else{
    if( filename ){
      postArgs.push( argument );
    }else{
      filename = argument;
      if( !filename.endsWith('.rgl') ){
        console.warning('Roguelike Golf Language script files should have the .rgl extension (' + filename + ')');
      }
    }
  }
}

//Be verbose if requested
if( ~preArgs.indexOf('-verbose') ){
  console.info( 'App               : ' + app );
  console.info( 'RGL Interpreter   : ' + interpreter );
  console.info( 'RGL Script        : ' + filename );
  console.info( 'RGL Arguments     : ' + preArgs ); 
  console.info( 'Script Arguments  : ' + postArgs ); 
}

//Most pretentious function ;]
upgradeNode();

//Run the script if provided
if( isNode ){
  if ( filename ){
    //'binary' is required to parse ANSI files correctly!
    fs.readFile(filename , 'binary', (err, data) => {
      if (err) throw err;
      runFile( data );
    });
  }else {
    console.error( 'No rgl script name was provided' );
    myProcess.exit(1);
  }
}

//***Layout***\\
function Layout( line ){
  this.lines = [ line ];
  this.scripts = [];
}

Layout.prototype.add = function layoutAdd( line ){
  this.lines.push( line );
}

Layout.prototype.getEntry = function getEntry(){
  for( var l = 0 ; l < this.lines.length ; l++ )
    for( var c = 0 ; c < this.lines[l].length ; c++ )
      if( this.lines[l][c] != '#' )
        return new Cell( l,  c );
  console.warn( 'Could not find an entry in layout:\n' + this.lines.join('\n') );
  process.exit(1);
}

Layout.prototype.exists = function exists( line, char ){
  return this.lines[line] && this.lines[line][char] !== undefined;
}

Layout.prototype.findNextPortal = function jumpNextPortal( runtime ){
  var cell = runtime.cell,
      line = cell.line,
      char = cell.char,
      type = this.lines[line][char],
      possibleLocation = this.lines[line].indexOf( type, char+1 );
  //Strategy 1, did we find something on the same line
  if( possibleLocation != -1 ){
    runtime.cell.char = possibleLocation;
  }else{
    //Strategy 2, do we find something on deeper lines?
    for( line = cell.line + 1 ; line < this.lines.length; line++ ){
      possibleLocation = this.lines[line].indexOf( type );
      if( possibleLocation != -1 ){
        runtime.cell.char = possibleLocation;
        runtime.cell.line = line;
        return;
      }
    }
    //Strategy 3, do we find something on earlier lines? 
    for( line = 0 ; line < cell.line; line++ ){
      possibleLocation = this.lines[line].indexOf( type );
      if( possibleLocation != -1 ){
        runtime.cell.char = possibleLocation;
        runtime.cell.line = line;
        return;
      }
    }
    //Strategy 4, do we find something on earlier lines?
    possibleLocation = this.lines[cell.line].indexOf( type );
    if( possibleLocation != -1 && possibleLocation != char ){
      runtime.cell.char = possibleLocation;
      return;
    }
    //Strategy 5, blame the 'developer'
    console.log('No matching portal found :/');
  }
}

Layout.prototype.walk = function walk( runtime ){
  var cell = runtime.cell,
      direction = runtime.direction,
      lastCall = runtime.callStack.last(),
      currentVortex = lastCall instanceof TimeVortex?lastCall:undefined;

  if( !cell ){
    runtime.cell = runtime.level.layout.getEntry();
    //A bit of a hack, we need .clone() and I dont want to copy paste
    runtime.direction = new Cell( 0, 1 );
    return true;
  }
  
  if( currentVortex && !currentVortex.cell.equals(cell) && currentVortex.type == 'v' ){
    //Minor time vortexes set you back, do not change direction
    //reduce time vortex counter
    if(!--currentVortex.count)
      runtime.callStack.pop();
    else
      return true;
  }

  //Can we still walk in our current direction?
  if( this.exists( cell.line + direction.line , cell.char + direction.char ) ){
    cell.line += direction.line;
    cell.char += direction.char;
    return true;
  }
  //We cant, is this a one dimension dungeon? then let's get out
  if( this.lines.length == 1 ){
    return false;
  }
  //We are following a turn right first approach
  //We only support cardinal directions
  if( !direction.line ){
    let line = direction.char > 0 ? -1 : 1;
    if( this.exists( cell.line + line, cell.char ) ){
      direction.line = line;
      direction.cell = 0;
      cell.line += line;
      return true;
    }
    line = line * -1;    
    if( this.exists( cell.line + line, cell.char ) ){
      direction.line = line;
      direction.cell = 0;
      cell.line += line;
      return true;
    }
  }else{
    let char = direction.char > 0 ? 1 : -1;
    if( this.exists( cell.line, cell.char + char ) ){
      direction.char = char;
      direction.line = 0;
      cell.char += char;
      return true;
    }
    char = char * -1;
    if( this.exists( cell.line, cell.char + char ) ){
      direction.char = char;
      direction.line = 0;
      cell.char += char;
      return true;
    }
  }
  return false;
}


//***Config***\\
function Config( line ){
  this.lines = [line];
}

Config.prototype.add = function configAdd( line ){
  this.lines.push( line );
}

Config.prototype.get = function configGet( type, index ){
  return !this[type] ? '' :
          this[type].length ? this[type][index] : this[type];
}

Config.prototype.set = function configSet( type, script, index ){
  //Are we not dealing with an asterisk, then just store the entry in an array
  if( index != '*' ){
    //Make sure we have an array
    this[type] = this[type] || [];
    //If the index is not provided, then add it at the end
    if(index){
      this[type][index] = script;
    } else {
      this[type].push( script );
    }
  } else {
    //Otherwise store it straight
    this[type] = script;
  }
}

//***Level***\\
function Level( layout ){
  this.layout = layout;
}

//***lex***\\
function lex( lines ){

  var levels, level;

  //console.log( lines );
  for( let line of lines ){

    if(!level){
     levels = [ level = new Level( new Layout( line ) ) ];
     continue;
    }

    //Are we dealing with a layout?
    if( line.startsWith('.') || line.startsWith('#') ){
      //Have we dealt already with config?
      if( level.config ){
        //We are on a new level
        levels.push( level = new Level( new Layout( line ) ) );
      }else{
        //Add to the current level
        level.layout.add( line );
      }
    //We are dealing with config then
    }else{
      if( !level.config ){
        level.config = new Config( line );
      }else{
        level.config.add( line );
      }
    }
  }
  if( !level.config )
    level.config = new Config( '' );

  return levels;
}

//***parse***\\
function parse( levels ){
  //Deep thoughts were had on this
  //We could lazily read the config and not parse up front
  //Especially since we are not actually going to write Operating Systems in PGL
  //Still, for time-limited challenges, especially related to recursion

  //We parse up front the config
  for( let level of levels ){

    //level.config = level.config || new Config('');
    //console.log( level.config.lines );
    //Prep config first, I guess?
    for( let line of level.config.lines ){
      
      if( line.startsWith('*') ){
        //
      } else if( line.startsWith( ' ' ) ){
        let type = line.trim().slice(0,1);
        while( line.startsWith( ' ' ) ){
          level.config.set( type, '' );
          line = line.slice( 1 );
        }
        level.config.set( type, line.slice(1) ); 
      } else {
        level.config.set( line.slice(0,1), line.slice(1) );
      }
    }

    //We keep track per config type of the current count
    let counts = {};
    //Now parse the layouts
    for( let line of level.layout.lines ){
      let scripts = [];
      for( const char of line ){
        counts[char] = counts[char] || 0;;
        scripts.push( level.config.get( char , counts[char] ) || null ); 
        counts[char]++
      }
      //Dont you love encapsulationless OO ;)
      level.layout.scripts.push( scripts );
    }
  }

  return levels;
}

function execute( runtime ){
  let cell = runtime.cell,
      type = runtime.level.layout.lines[cell.line][cell.char],
      script  = runtime.level.layout.scripts[cell.line][cell.char];

 runtime.async = false;

  //The switch, it requires break
  if( type == '?' ) scroll( script, runtime );
  else if( type == '&' ) chest( script, runtime );
  else if( type == '~' ) light( script, runtime );
  else if( type == 'Z' ) chaos( script, runtime );
  else if( type == 'V' ) timeVortex( script, runtime, 'V' );
  else if( type == 'v' ) timeVortex( script, runtime, 'v' );
  else if( type == '0' ) jump( script, runtime );
  else if( type == 'R' ) zothOmmog( script, runtime );
  else if( type == '+' ) door( script, runtime );
  else if( type == '<' ) goUpstairs( script, runtime );
  else if( type == '(' ) wield( script, runtime);
  else if( type == '[' ) heavyWield( script, runtime);
  else if( type == ')' ) unwield( script, runtime);
  else if( type == 'l' ) lice( script, runtime );
  else if( type.match(/\d/) ) portal( script, runtime, type );
  else console.log( type + ' not recognized, infinite loop!');

  //run( runtime ); 
  if( !runtime.async ){
    setTimeout( () => run(runtime) , 0);
  }
}

function heavyWield(script, runtime){
  let oldKeepValue = runtime.mods.keep;
  runtime.mods.keep = true;
  wield( script, runtime );
  runtime.mods.keep = oldKeepValue;
}

//Wielding does not consume, not sure if this makes sense though
function wield( script, runtime ){
  if(!script){
    runtime.registers[0] = runtime.stack.last();
    return;
  }
  //Multi move from stack to registers
  if(script.startsWith('*')){
    let moveCount = Math.min( runtime.stack.length, runtime.mods.maxRegisters ),
        registerIndex = 0;
    while(moveCount--){
      wield( String.fromCharCode(97+registerIndex++) + script.shift() , runtime );
    }
    return;
  }
  let target = script.first();
  if( target == 'a' || target == 'Ò' )
    target = 0; //Though, that is retarded..
  else if( target == 'b' || target == 'Ó' )
    target = 1; //Though, that is retarded..
  else if( target == 'c' || target == 'Ô' )
    target = 2; //Though, that is retarded..
  else if( target == 'd' || target == 'Õ' )
    target = 3; //Though, that is retarded..
  else if( target == 'e' || target == 'Ö' )
    target = 4; //Though, that is retarded..
  else {
    target = 0;
    script = 'a' + script;
  }
  //Make sure that if we keep the value that 
  if(runtime.mods.keep)
    runtime.stack.doubleDingle();
  if(script.length!=1){
    chaos( script.shift(), runtime );
  }
  runtime.registers[target] = runtime.stack.last(false); //Keep = false
}

function unwield( script, runtime ){
  if(!script){
    runtime.stack.push( runtime.registers[0] );
    return;
  }
  let source = script.first();
  if( source == 'a' || source == 'Ò' )
    source = 0; //Though, that is retarded..
  else if( source == 'b' || source == 'Ó' )
    source = 1; //Though, that is retarded..
  else if( source == 'c' || source == 'Ô' )
    source = 2; //Though, that is retarded..
  else if( source == 'd' || source == 'Õ' )
    source = 3; //Though, that is retarded..
  else if( source == 'e' || source == 'Ö' )
    source = 4; //Though, that is retarded..
  else {
    source = 0;
    script = 'a' + script;
  }
  runtime.stack.push( runtime.registers[source] );
  if(script.length!=1){
    chaos( script.shift(), runtime );
  }
}

function portal( script, runtime, type ){

  script = script || 'true';
  let statement = templateString( script, runtime );
  let value = eval(statement);
  if(value){
    runtime.level.layout.findNextPortal( runtime );
  }
}

function goUpstairs( script, runtime ){

  if( runtime.levelStack.length == 1 ){
    //We have left the dungeon
    runtime.done = true;
  }else{
    //We are about to experience more pain
  }

}


function Yugg(script){
  //console.log( 'Creating Yugg with ' + script );
  this.script = script;
}

//Zoth Ommog, 'R', third son of Cthulu, caster of Regex, master of Yuggs
function zothOmmog( script, runtime ){

  if( script.startsWith('&') ){
    runtime.stack.push( new Yugg( script.shift() ) );
  }else{
    chaos( script, runtime );
  }
}

//Retrieve the Yuggs from the stack, apply them to the runtime
function applyYuggs( runtime ){

  while( runtime.stack.length ){
    var o = runtime.stack.pop();
    if( o instanceof Yugg ){
      runtime.mods.regexOut.push( o );
    } else {
      runtime.stack.push( o )
      return;
    }
  }
}

//Unlike roguelikes, these doors ask for input before
//letting you through, I am open to a more roguelike 
//convention for asking user input
//It is symbolic that this is 'blocking'
/*
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
*/

function storeInput( input, script, runtime ){
    if(!script){
      runtime.stack.push( input )
    }else if( script == 'a' || script == 'Ò' ){
      runtime.registers[0] = input;
    }else if( script == 'b' || script == 'Ó' ){
      runtime.registers[1] = input;
    }else if( script == 'c' || script == 'Ô' ){
      runtime.registers[2] = input;
    }else if( script == 'd' || script == 'Õ' ){
      runtime.registers[3] = input;
    }else if( script == 'e' || script == 'Ö' ){
      runtime.registers[4] = input;
    }
}

function door( script, runtime ){

  var input;

  if( isNode ){
    runtime.async = true;
    process.stdin.resume();
    process.stdin.once('data', function (raw) {
      process.stdin.pause();
      //console.log('received data:', input = raw.toString(), raw );
      input = raw.toString().trimRight();
      if( !runtime.fileMode ){
        let lines = input.split( runtime.mods.eol );
        if( lines.length > 1 ){
          input = lines.shift();
          process.stdin.push( lines.join( runtime.mods.eol ) );
        }
      }
      storeInput(input, script, runtime)
      run( runtime );
    });
  } else {
    storeInput( prompt(), script, runtime );
  }
}

function timeVortex( script, runtime, char ){

  var count, originalCount = runtime.stack.last(), fromStack = true;

  if(!script){
    count = runtime.stack.last(runtime)*1;
  }else if( script.startsWithIn(['Ò','Ó','Ô','Õ','Ö'])){
    originalCount = script.charCodeAt(0) - 210;
    script = script.shift();
    fromStack = false;
  }else if( script.startsWithIn(['a','b','c','d','e'])){
    originalCount = script.charCodeAt(0) - 97;
    script = script.shift();
    fromStack = false;
  }else if( !isNaN( script.charAt(0)  ) ){
    count = script*1;
  }

  if(!count){
    runtime.stack.push( originalCount );
    chaos( script, runtime );
    count = runtime.stack.pop();
    if( runtime.mods.keep && fromStack )
      runtime.stack.push(originalCount);  
  }

  runtime.callStack.push( new TimeVortex( char, runtime.cell, count ) );

}

function jump( script, runtime ){

  var o = runtime.callStack.last();

  //It could be a numbered portal,
  if( o instanceof TimeVortex ){
    if(!--o.count)
      return runtime.callStack.pop();
    runtime.cell = o.cell.clone();
  }
}



function modify( x , script , runtime ){

  let xScript = script, parts;
  while(xScript.length){
    //Lets check for some operators
    if( xScript.startsWith('r') ){ //Round
      x = Math.round(x);
      xScript = xScript.slice(1);     
    }
    else if( xScript.startsWith('U') ){ //Uppercase
      x = x.toString().toUpperCase();
      xScript = xScript.slice(1);
    }
    else if( xScript.startsWith('l') ){ //lowercase
      x = x.toString().toLowerCase();
      xScript = xScript.slice(1);
    }
    else if( xScript.startsWith('T') ){ //Transform thru regex
      parts = xScript.shift().split( runtime.mods.separatorRegex );
      x = ( x + '' ).replace( new RegExp( parts[0] ), parts[1] );
      xScript = '';
    }    
    else if( xScript.startsWithIn(['-','+','/','*','%']) ){ //Basic math operators
      if(isNaN(x * 1)){
        if( xScript.startsWith('+') ){
          parts = xScript.split( runtime.mods.separator );
          x  = x + templateString( parts.shift().shift(), runtime );
          xScript = parts.join( runtime.mods.separator );
        }          
        if( xScript.startsWith('*') ){
          parts = xScript.split( runtime.mods.separator );
          x  = x.repeat( templateString( parts.shift().shift(), runtime ) );
          xScript = parts.join( runtime.mods.separator );
        }          
      }else{
        x = x * 1;
        parts = xScript.split( runtime.mods.separator );
        x = eval( 'x' + templateString( parts.shift(), runtime ) );
        xScript = parts.join( runtime.mods.separator );
      }
    } 
    else if( xScript.startsWithIn(['^']) ){ //Power!
      if(isNaN(x * 1)){
        //Who knows right ;)
      }else{
        x = x * 1;
        parts = xScript.split( runtime.mods.separator );
        x = eval( 'Math.pow( x , ' + templateString( parts.shift().shift(), runtime ) + ')' );
        xScript = parts.join( runtime.mods.separator );
      }
    } else {
      console.log( 'Modify operation not recognized, treating the rest as a string!');
      x = xScript;
      xScript = ''
    }
  }
  return x;
}


function lice( script, runtime){
  
  var stack = runtime.stack,
      data = stack.last();
  
  if(!runtime.mods.keep)
    runtime.stack.pop();

  if(!script){
    if(data.isList){
      runtime.stack.push( runtime.stack.concat([data]).clone() );    
    }else{
      runtime.stack = runtime.stack.concat( data.split(runtime.mods.separator) );
    }
  }

  while(script){
    if( script.startsWith('s') ){ //set the separator, one char only
      runtime.mods.separator = script.shift(1).first();
      script = script.shift(2);
    }
    if(data.isList){
      if( script.startsWith('f') ){ //find the lowest common denominator
        data =  data.reduce( (p, c) => p.concat(Math.factors(c)) , [] ).unique().reduce( (p, c) => p * c , 1  );
        script = script.shift();
      }
      if( script.startsWith('*') ){ //multiply all elements
        data = data.reduce( (p, c) => p * c , 1  );
        script = script.shift();
      }
      if( script.startsWith('l') ){ //make a list of the stack and concat with the dingle list and push that
        runtime.stack = runtime.stack.concat(data);
        data = runtime.stack.pop();
        script = script.shift();
      }
      if( script.startsWith('j') ){ // reverse join -> split, keep last element for shenanigans
        data.forEach( c => runtime.stack.push(c) );
        data = runtime.stack.pop();
        script = script.shift();
      }
    }else{
      //It's not a list, but we are going to make one
      if( script.startsWith('f') ){ //find the factors
        data =  Math.factors( data );
        script = script.shift();
      }
      if( script.startsWith('l') ){ //Split over the separator
        data = data.split(runtime.mods.separator).concat( runtime.stack );
        script = script.shift();
      }
    }
  }
  runtime.stack.push( data );
}


function chaos( script, runtime ){


  var stack = runtime.stack,
      data = stack.slice(-1)[0];

  if( data.isList ){
    for( var i = 0 ; i < data.length ; i++ ){
      data[i] = modify( data[i], script, runtime );
    }
  } else {
    stack.push( modify( stack.pop() , script , runtime ) );  
  }
}


function light( script, runtime ){

  var context,
      mods = runtime.mods;

  for( let char of script ){
    if(!context){
      if( char == 'k' ) mods.keep = true;         //k => keep used values on stack
      if( char == 'l' ) mods.keep = false;        //l => lose used values on stack
      if( char == 'c' ) mods.separatorOut = '';   //c => concat output (no newlines after scrolls)
      if( char == 'n' ) mods.separatorOut = '\n'; //n => newlines after scrolls
      if( char == 'F' ) mods.fileMode = true;     //F => do not split stdin up into newline separated chunks
      if( char == 't' ) mods.printMode = 'string';//t => print strings, do not try to eval with stack
      if( char == 'S' ) context = 'mods.separatorOut';
      if( char == 's' ) context = 'mods.separator';
      if( char == 'r' ) context = 'mods.separatorRegex';
      if( char == 'R' ) applyYuggs( runtime );
      if( char == ' ' ) process.stdout.write("\u001b[2J\u001b[0;0H");
    }else{
      //Todo, allow separator to come from the stack
      if( context == 'mods.separatorOut' ) mods.separatorOut = char;
      if( context == 'mods.separator' ) mods.separator = char;
      if( context == 'mods.separatorRegex' ) mods.separatorRegex = char;
      context = '';
    } 
  }
}


function chest( script, runtime ){

  var stack = runtime.stack,
      mods = runtime.mods;

  if(!script){
    stack.push(0);
    return;
  }

  //If we see a string constant, store it on the stack
  if( script.startsWith("'") ){
    stack.push( script.slice(1) );
  }else{
    //todo, numbers will use radixes..
    stack.push( parseInt( script , mods.radixIn ) );
  }

}

function replaceYouMaybe( match, symbol, value ){
  //console.log('replaceYouMaybe', match, symbol, value);
  return match.startsWith('\\') ? symbol : 
         match.length ==2 ? match.slice(0,1).concat( value )
                          : value;
}

function templateString( s  , runtime ){
  //Replace @ with the dingle, but leave \@ alone
  let dingle = runtime.stack.last();
  s = s.replace( /^@/g , function f(s){ return replaceYouMaybe( s , '@' , dingle ) }); 
  s = s.replace( /.@/g , function f(s){ return replaceYouMaybe( s , '@' , dingle ) });

  //console.log( 'Run time register: ' , runtime.registers , runtime.registers[0] );

  s = s.replace( /^Ò/g , function f(s){ return replaceYouMaybe( s , 'Ò' , runtime.registers[0] ) });
  s = s.replace( /.Ò/g , function f(s){ return replaceYouMaybe( s , 'Ò' , runtime.registers[0] ) });
  
  s = s.replace( /^Ó/g , function f(s){ return replaceYouMaybe( s , 'Ó' , runtime.registers[1] ) });
  s = s.replace( /.Ó/g , function f(s){ return replaceYouMaybe( s , 'Ó' , runtime.registers[1] ) });

  s = s.replace( /^Ô/g , function f(s){ return replaceYouMaybe( s , 'Ô' , runtime.registers[2] ) });
  s = s.replace( /.Ô/g , function f(s){ return replaceYouMaybe( s , 'Ô' , runtime.registers[2] ) });

  s = s.replace( /^Õ/g , function f(s){ return replaceYouMaybe( s , 'Õ' , runtime.registers[3] ) });
  s = s.replace( /.Õ/g , function f(s){ return replaceYouMaybe( s , 'Õ' , runtime.registers[3] ) });

  s = s.replace( /^Ö/g , function f(s){ return replaceYouMaybe( s , 'Ö' , runtime.registers[4] ) });
  s = s.replace( /.Ö/g , function f(s){ return replaceYouMaybe( s , 'Ö' , runtime.registers[4] ) });

  return s;
}

function write( s , runtime ){

 s = s.toString().replace( /\\n/g , runtime.mods.eol );
 s = templateString( s , runtime );


 if( runtime.mods.regexOut.length ){

   runtime.stack.push( s );
   for( let regex of runtime.mods.regexOut ){
     chaos( regex.script, runtime );
   }
   s = runtime.stack.pop();
 }

 if(!isNode){
   s = s.replace(/(?:\r\n|\r|\n)/g, '<br>');
 }

  myProcess.stdout.write( s );
 

}

function scroll( script, runtime ){

  var stack = runtime.stack,
      mods = runtime.mods;

  //Without script we just dump what is on the stack
  //Keep the value on stack based on runtime.keep via last()
  if( !script ){
    write( stack.last(runtime), runtime );
  //Otherwise we check and deal with a string constant, keep stack intact
  }else if( script.startsWith("'") ){
    write( script.slice(1), runtime );    
  //Finally, there might be some transformation we might have to apply first
  }else if( script.startsWith('e') ){
    write( eval(templateString( script.shift(), runtime )), runtime );
  }else{
    runtime.stack.push( runtime.stack.last() );
    chaos( script, runtime );
    write( stack.pop(), runtime );
    if( !runtime.mods.keep ) 
      stack.pop();
  }

  //if(!mods.concat)
  write( runtime.mods.separatorOut, runtime );

}

function Cell( line, char){
  this.line = line;
  this.char = char;
}

Cell.prototype.clone = function cellClone(){
  return new Cell( this.line, this. char );
}

Cell.prototype.equals = function cellEquals(cell){
  return this.line==cell.line && this.char == cell.char;
}


function Runtime( levels, stack, eol ){

  this.stack = stack,
  this.callStack = [],
  this.registers = [],
  this.levels = levels,
  this.mods = {
    keep : false,
    radixIn : 10,
    radixOut : 10,
    maxRegisters : 5,
    separatorOut : '\n',
    separator : ';',
    separatorRegex: '`',
    regexOut: [],
    eol: eol,
    fileMode: false
  }
}

function TimeVortex( type, cell, count ){
  this.type = type;
  this.cell = cell.clone();
  this.count = count;
}

function LevelEntry( cell, direction ){
  this.cell = cell?cell.clone():undefined;
  this.direction =  direction?direction.clone():undefined;
}

//This is the entry point, the calls go
//runFile -> runLevel -> run <-> execute
//execute will will call back run for synchronous operations
//asynchronous operations (like doors) will call run when the time has come
//run might of course call runLevel, TODO: level stack
function runFile( fileContent ){
  debugger;

  //Start clean, if we can
  if( console.clear )
    console.clear();
  if( !isNode )
    $('output').innerHTML = '';

  var fileContent = fileContent.toString(),
      eol = ~fileContent.indexOf('\r\n') ? '\r\n' : '\n',
      lines = fileContent.split( eol ),
      levels = parse( lex( lines ) );

  runLevel( 0, new Runtime( levels, postArgs, eol ) ); 
}

function runLevel( levelIndex, runtime ){
  //Make sure there is a level stack
  runtime.levelStack = runtime.levelStack || [];
  //Set the level stack
  runtime.levelStack.push(levelIndex);
  //Set the call stack (to know how far to rewind when we come back)
  runtime.callStack.push( new LevelEntry( runtime.cell, runtime.direction ) );
  //Set the level
  runtime.level = runtime.levels[levelIndex];
  //Where are we??
  runtime.cell = undefined;
  //Where are we going??
  runtime.direction = undefined;
  //Calling run will figure this out
  run( runtime );
}

function run( runtime ){
  //walk & execute or exit
  if( !runtime.done && runtime.level.layout.walk( runtime ) ){
    execute( runtime );
  }
}


function upgradeNode(){

  Array.prototype.last = function arrayLast( runtimeOrKeep ){
    let value = this.slice(-1)[0];
    //if( value === undefined )
    //  console.warn('Stack underflow!!');
    if( runtimeOrKeep === undefined )
      return value;
    if( typeof runtimeOrKeep == 'boolean' )
      return runtimeOrKeep ? value : this.pop();
    if( runtimeOrKeep instanceof Runtime )
      return runtimeOrKeep.mods.keep ? value : this.pop();
    console.warn( 'Array.last() called not using undefined/boolean/Runtime: ' + JSON.stringify( Object.getPrototypeOf( runtimeOrKeep ) ) );
    return value;
  }

  Array.prototype.doubleDingle = function arrayDoubleDingle(){
    this.push( this.last() );
  }

  String.prototype.first = function stringFirst(){
    return this.slice(0,1);
  }

  String.prototype.shift = function stringShift(n){
    return this.slice(n||1);  
  }

  String.prototype.startsWithIn = function stringStartsWithIn( list ){
    for( let i = 0 ; i < list.length ; i++ ){
      if(this.startsWith(list[i])){
        return true;
      }
    }
    return false;
  }

  Array.prototype.clone = function() {
	  return this.slice(0);
  };

  Array.prototype.unique = function(){
    let out = [];
    this.forEach( v => ~out.indexOf(v)?0:out.push(v) );
    return out;
  }

  Array.prototype.isList = true;

  Math.factors = function mathFactors( n ){

    var factors = [],
        limit = Math.floor( Math.sqrt( n ) );

    while(limit){
      if( !( n % limit ) )
        factors = factors.concat( [limit,n/limit] );
      limit--;
    }
    return factors.unique().sort((a,b)=>a-b);
  }

}
