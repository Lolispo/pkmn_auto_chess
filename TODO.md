# TODO

## Check

Cost of dota auto chess upgraded units
    Equal to cost? 
    (3 doom -> doom level 2 -> cost = 12? Sell for 12? )
    Sells for much less but don't know how much

How much hp to lose?

Shuffle deck of pieces when 20 (40?) pieces are discarded? Chance for not all pieces should be in every game

Check exp required for every level

Check gold income basic increase when (every tenth level?)

winstreak math

Check gold early game, how to get 2 gold at level 2 if start at 0, from which rewards
(does npc victories give a gold?)

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
