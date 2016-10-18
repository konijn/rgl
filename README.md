# Roguelike Golf Language

Conceived on September 17, 2016. 
Inspired by 
* https://esolangs.org/wiki/List_of_ideas#Game
* http://codegolf.stackexchange.com/
* http://angband.oook.cz/stuff/manual.txt

"Vocabulary"

* The item on top of the stack, (last added item), is henceforth called the **Dingle**, I am open to counter suggestions

"IDE"

https://konijn.github.io/rgl/

"Syntax"

Every RGL program can have 2 sections:

1. Dungeon, mandatory
  * Dungeons are defined in lines 
    * Dungeon lines must start with open floors (' ') or walls '#'
    * Dungeon lines are terminated by \n
    * Dungeons can have up to 9 portals, defined by their corresponding number (1-9)
    * Dungeons can connect to other dungeons by using stairs ('>')
      * They will connect to the next dungeon ( scanning right/down wards to find it, or to a file)
    * Dungeons can have lice ('l') who can act on lists
    * Dungeons can have ancient dragons ('D') who will destroy data
    * Dungeons can have chests ('&') which can put data on the stack
    * Dungeons can have scrolls ('?') which can output data (dingle by default)
    * Dungeons can have chaos hounds ('Z') who change the dingle
    * Dungeons can have Zoth Ommog('R') who can perform regular expressions on the dingle
    * Dungeons can have zero portals ('0'), which will place the player back on the last 'V' or '>' or '1' thru '9'
    * Dungeons can have down stairs ('>') which will place the player in the next dungeon
    * Dungeons can have up stairs which will place the player in the previous dungeon, or ends the program
    * Dungeons can have minor time vortexes ('v') which throw the player into the next cell n times
    * Dungeons can have major time vortexes ('V') which are used in conjunction with zero portals for longer loops
    * Dungeons can have torches ('~') which set the mood lightning
2. Config, optional
  * '~' Torches
    * `k` -> Keep values on stack after most operations (impacts scrolls and time vortexes)
    * 'l' -> Loose values on stack after most operations (impacts scrolls and time vortexes) *Default*
    * 'c' -> Concatenate all scroll outputs
    * 'n' -> Separate scroll outputs with newlines *Default*
    * 'R' -> Read all Yuggs (Regular Expressions) from the top of the stack and apply them on scroll outputs
    * Set a context
      * 's' -> The next character will determine the internal list separator (impacts split/join)
      * 'S' -> The next character will determine the separator between scroll outputs (@ will use the top stack as separator)
      * 'r' -> The next character will determine the separator between regex operation parameters
  * '&' Chests
    * Starting with ' -> take the rest of the line and put on stack as string 
    * Starting with a char from [1-9] -> take the rest of the line and put on stack as number
    * **TODO** Starting with 'r' -> Find `..` in the remainder of the string and try to build a range (could be numberic or character) 
    




