# TODO

## Check

Cost of dota auto chess upgraded units
    Equal to cost? 
    (3 doom -> doom level 2 -> cost = 12? Sell for 12? )
    Sells for much less but don't know how much
    3 level 3 becomes 5
    1 -> 3
    2 -> 4
    Increase level by 2 (cost) from level1 to 2
    Unsure of 2 to 3

How much hp to lose? 1 point per level of unit

Shuffle deck of pieces when 20 (40?) pieces are discarded? Chance for not all pieces should be in every game

Check exp required for every level

Check gold income basic increase when (1-5, max 5)

winstreak math

## General

Get all close interactions with state separated from functions used further up

game.js either contain functions for front-end interaction OR state manipulation, not both!

Mapper: Json object to transfer to fron-end with relevant information

Socket.io connection, simple listeners that connect to the functions

battle: first movement random, then -> jump to closets target one team at a time, if in range attack until teams are dead

## Everywhere

Remove unused variables in imports

Cleanup comments, better structure

More tests

Potential to use more functional code, map/filter
