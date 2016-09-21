"use strict";
var fs          = require("fs"),
    preArgs     = [],
    postArgs    = [],
    filename    = '',
    node        = process.argv.shift(),
    interpreter = process.argv.shift();

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
  console.log( 'Node              : ' + node );
  console.log( 'RGL Interpreter   : ' + interpreter );
  console.log( 'RGL Script        : ' + filename );
  console.log( 'RGL Arguments     : ' + preArgs ); 
  console.log( 'Script Arguments  : ' + postArgs ); 
}

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
        return { line : l , char : c };
  console.log( 'Could not find an entry in layout:\n' + this.lines.join('\n') );
  process.exit(1);
}

Layout.prototype.exists = function exists( line, char ){
  return this.lines[line] && this.lines[line][char] !== undefined;
}

Layout.prototype.walk = function walk( cell , direction ){
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
  return this[type].length ? this[type][index] : this[type];
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
      
      } else {
        level.config.set( line.slice(0,1), line.slice(1) );
      }
    }

    //We keep track per config type of the current count
    let counts = {};
    //Now parse the layouts
    for( let line of level.layout.lines ){
      //console.log( '->' + line );
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

function execute( type, script, stack, registers, mods ){
 if( type == '?' )
   scroll( script , stack, registers );
}


function scroll( script, stack, registers, mods ){

  //Without script we just dump what is on the stack
  if( !script ){
    console.log( stack.slice(-1) );
    if( !mods.keep ){
     stack.pop();
    }
  }
  //If we see a string constant, dump it
  if( script.startsWith("'") ){
    console.log( script.slice(1) );
  }

}


function runLevel( levels, levelIndex, stack, registers, mods ){

  var level = levels[levelIndex];
  var cell = level.layout.getEntry();
  var direction = { line : 0 , char : 1 };
  //console.log(level.layout.scripts);
  //console.log(level.config );
  do {
    execute( level.layout.lines[cell.line][cell.char], level.layout.scripts[cell.line][cell.char], stack, registers, mods );
  }
  while ( level.layout.walk( cell , direction ) );
}



function run( fileContent ){

  //console.log(fileContent.toString( ) );
  var levels = parse( lex( fileContent.toString( ).split('\n') ) );
  runLevel( levels, 0, postArgs, [], {} ); 
}
