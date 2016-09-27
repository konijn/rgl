"use strict";

//console.log(process);

//Modules and globals
var fs          = this.window?{}:require("fs"),
    preArgs     = [],
    postArgs    = [],
    filename    = '',
    node        = this.window?navigator.appName:process.argv.shift(),
    interpreter = this.window?this:process.argv.shift(),
    myProcess   = this.process?process:{ argv : [], exit: n=>console.log('Exit:'+n) };

//Start clean, if we can
if( console.clear )
  console.clear();

//Parsing parameters
for( let argument of process.argv ){
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
  console.info( 'Node              : ' + node );
  console.info( 'RGL Interpreter   : ' + interpreter );
  console.info( 'RGL Script        : ' + filename );
  console.info( 'RGL Arguments     : ' + preArgs ); 
  console.info( 'Script Arguments  : ' + postArgs ); 
}

//Most pretentious function ;]
upgradeNode();

//Run the script if provided
if ( filename ){
  fs.readFile(filename ,(err, data) => {
    if (err) throw err;
    run( data );
  });
}else {
  console.error( 'No rgl script name was provided' );
  process.exit(1);
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

Layout.prototype.walk = function walk( runtime ){
  var cell = runtime.cell,
      direction = runtime.direction,
      currentVortex = runtime.callStack.last();

  
  if( currentVortex && !currentVortex.cell.equals(cell) && currentVortex.type == 'v' ){
    //Minor time vortexes set you back, do not change direction
    //reduce time vortex counter
    //console.log('v', currentVortex, cell  );
    currentVortex.count--;
    if(!currentVortex.count)
      runtime.callStack.pop();
    else
      return true;
  }


  //Can we still walk in our current direction;
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

  //The switch, it requires break
  if( type == '?' ) scroll( script, runtime );
  else if( type == '&' ) chest( script, runtime );
  else if( type == '~' ) light( script, runtime );
  else if( type == 'Z' ) chaos( script, runtime );
  else if( type == 'V' ) timeN( script, runtime, 'V' );
  else if( type == 'v' ) timeN( script, runtime, 'v' );
  else if( type == '0' ) jump( script, runtime );
  else if( type == 'R' ) zothOmmog( script, runtime );
}

function Container(o){
  this.content = 0;
}


function zothOmmog( script, runtime ){

  var context;
  if( script.startsWith('&') ){
    var operation = script.shift().first();
    runtime.stack.push( new Container([operation].concat( script.shift(2).split( runtime.mods.separatorRegex ) ) ) );
  }else{
    chaos( script.shift(), runtime );
  }
}

function timeN( script, runtime, char ){

  var count, originalCount;

  if(!script){
    //console.log(runtime.stack);
    count = runtime.stack.last(runtime)*1;
    //console.log(count);
  }else if( isNaN( script.charAt(0)  ) ){
    originalCount = runtime.stack.last();
    chaos( script, runtime );
    count = runtime.stack.pop();
    if( runtime.mods.keep )
      runtime.stack.push(originalCount);
  }else{
    count = script*1;
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
    if( xScript.startsWith('U') ){
      x = x.toString().toUpperCase();
      xscript = xscript.slice(1);
    }
    if( xScript.startsWith('l') ){
      x = x.toString().toLowerCase();
      xscript = xscript.slice(1);
    }
    if( xScript.startsWith('T') ){
      parts = xScript.shift().split( runtime.mods.separatorRegex );
      x = ( x + '' ).replace( parts[0], parts[1] );
      xscript = '';
    }    
    if( xScript.startsWith('-') || xScript.startsWith('+') || xScript.startsWith('/') ){
      parts = xScript.split( runtime.mods.separator );
      x = eval( 'x' + parts.shift() );
      xScript = parts.join( runtime.mods.separator );
    }
  }
  return x;
}



function chaos( script, runtime ){


  var stack = runtime.stack,
      data = stack.slice(-1)[0];

  if( data.length ){
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
      if( char == 'k' ) mods.keep = true;      //k => keep used values on stack
      if( char == 'l' ) mods.keep = false;     //l => lose used values on stack
      if( char == 'c' ) mods.separatorOut = '';   //c => concat output (no newlines after scrolls)
      if( char == 'n' ) mods.separatorOut = '\n'; //n =? newlines after scrolls
      if( char == 'S' ) context = 'mods.separatorOut';
      if( char == 's' ) context = 'mods.separator';
      if( char == 'R' ) context = 'mods.separatorRegex';
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

function scroll( script, runtime ){

  var stack = runtime.stack,
      mods = runtime.mods;

  //Without script we just dump what is on the stack
  if( !script ){
    process.stdout.write( stack.last(runtime).toString().replace(/\\n/g,'\r\n') );
  //Otherwise we check and deal with a string constant
  }else if( script.startsWith("'") ){
    process.stdout.write( script.slice(1).replace(/\\n/g,'\n') );    
  //Finally, there might be some transformation we might have to apply first
  }else{
    chaos( script, runtime );
    process.stdout.write( stack.last(runtime).toString().replace(/\\n/g,'\r\n') );
  }

  //if(!mods.concat)
  process.stdout.write( runtime.mods.separatorOut );

}


function runLevel( levels, levelIndex, runtime ){

  runtime.level = levels[levelIndex];
  runtime.cell = runtime.level.layout.getEntry();
  runtime.direction = { line : 0 , char : 1 };

  do {
    execute( runtime );
  }
  while ( runtime.level.layout.walk( runtime ) );
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


function Runtime( stack ){

  this.stack = stack,
  this.callStack = [],
  this.registers = [],
  this.mods = {
    keep : false,
    radixIn : 10,
    radixOut : 10,
    separatorOut : '\n',
    separator : ';',
    separatorRegex: '`'
  }
}

function TimeVortex( type, cell, count ){
  this.type = type;
  this.cell = cell.clone();
  this.count = count;
}

function run( fileContent ){
  debugger;
  var fileContent = fileContent.toString(),
      eol = ~fileContent.indexOf('\r\n') ? '\r\n' : '\n',
      lines = fileContent.split( eol ),
      levels = parse( lex( lines ) );

  runLevel( levels, 0, new Runtime( postArgs ) ); 
}


function upgradeNode(){

  Array.prototype.last = function arrayLast( runtimeOrKeep ){
    let value = this.slice(-1)[0];
    if( runtimeOrKeep === undefined )
      return value;
    if( typeof runtimeOrKeep == 'boolean' )
      return runtimeOrKeep ? value : this.pop();
    if( runtimeOrKeep instanceof Runtime )
      return runtimeOrKeep.mods.keep ? value : pop();
    console.warn( 'Array.last() called not using undefined/boolean/Runtime: ' + JSON.stringify( Object.getPrototypeOf( runtimeOrKeep ) ) );
    return value;
  }

  String.prototype.first = function stringFirst(){
    return this.slice(0,1);
  }

  String.prototype.shift = function stringShift(n){
    return this.slice(0,n||1);  
  }

}
