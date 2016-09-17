# Roguelike Golf Language

Conceived on September 17, 2016. 
Inspired by https://esolangs.org/wiki/List_of_ideas#Game and http://codegolf.stackexchange.com/

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
    * Dungeons can have dragons ('D') who will destroy data
    * Dungeons can have chests ('&') which can put data on the stack
    * Dungeons can have scrolls ('?') which can output data
    * Dungeons can have chaos hounds ('Z') who can act on each individual item in a list on a stack
2. Config, optional




consists out of 1 part, the dungeon. Most RGL programs have a second part providing guidance on the dungeon.
