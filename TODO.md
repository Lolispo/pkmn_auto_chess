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
    not consistent, enc 3 -> 4 cost

How much hp to lose? 1 point per level of unit
Definitely not, 6 level 6 units would be 36 hp, more like 14 damage from them (6-0)

Shuffle deck of pieces when 20 (40?) pieces are discarded? Chance for not all pieces should be in every game

Check exp required for every level

Check how many pieces in auto chess

winstreak math

## General

Get all close interactions with state separated from functions used further up

game.js either contain functions for front-end interaction OR state manipulation, not both!

Mapper: Json object to transfer to fron-end with relevant information

Socket.io connection, simple listeners that connect to the functions

battle: first movement random, then -> jump to closets target one team at a time, if in range attack until teams are dead

check Promise.all alternative for loops

.has instead of !f.isUndefined

cleanup async usage, using Promise.all in places where multíple calculations are needed
 makes it bottleneck on the slowest one
    example: 
    // Promise.all() allows us to send all requests at the same time. 
    let results = await Promise.all([ getValueA, getValueB, getValueC ]); 

Find a way of choosing pokemon in play
    shouldn't play all 151 at once

Alternatives:
    Auto chess: Jynx1 jynx2 jynx3
        drawbacks: jynx2 jynx3
        Jynx2 = jynx level 50, Jynx3 = jynx level 100
        Find math for getting a better version of one pokemon that is balanced and comparable to others evolving
    /*Some kind of class bonus for base no evollution (jynx scyther)
        drawbacks: all jynxs are equal
    Xp system?*/

eevee:
    Evolution based on amount of unit types on board

prevent getting more units of same type if you have max of that type

## Npc rounds / Item rounds

Gym leader rounds:
    gives special item money,
    max 3 hp round loss
    can give item (low chance)

Shop rounds: 
    Buy items for item money in item shop

## Items

1 item per pokemon

X-speed, attack etc

Rare Candy - 2 less pokemon required for 

leftovers/lifesteal functionality
    item / type buff


## Everywhere

Remove unused variables in imports

Cleanup comments, better structure

More tests

Potential to use more functional code, map/filter
