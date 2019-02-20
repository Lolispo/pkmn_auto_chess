# TODO

## Check

Cost of dota auto chess upgraded units
    Level 2, type 4 -> sells for 6 (his level) +2 for now

How much hp to lose? 1 point per level of unit
Definitely not, 6 level 6 units would be 36 hp, more like 14 damage from them (6-0)

Check exp required for every level

Check how many pieces in auto chess (different pieces)

Decide if wanted:
Shuffle deck of pieces when 20 (40?) pieces are discarded? Chance for not all pieces should be in every game

## Refactor

game.js either contain functions for front-end interaction OR state manipulation, not both!

Get all close interactions with state separated from functions used further up

## Tests

Test weaknesses applying correctly

Test combos/buffs from types

Abilities: 
Test dot damage functionality
Test lifesteal functionality

## General

Only have same amount of units on board for battle as level

Aoe damage logic

Rival: Rival battle when playing against a certain opponent
    > 3 battles
    Alt1: Either when playing against the person you played the most
        Temp implementation makes this irrelevant
    Alt2: The person you lost to the most 
        Problem: People won't be rivals against each other
    Revamp over enemy matchups should be done to make this interesting


Mapper: Json object to transfer to fron-end with relevant information

Socket.io connection, simple listeners that connect to the functions

check Promise.all alternative for loops

.has instead of !f.isUndefined

cleanup async usage, using Promise.all in places where multíple calculations are needed
 makes it bottleneck on the slowest one
    example: 
    // Promise.all() allows us to send all requests at the same time. 
    let results = await Promise.all([ getValueA, getValueB, getValueC ]); 

Find a way of choosing pokemon in play
    shouldn't play all 151 at once
    1: Ban base types in beginning
    2: Choose (20-40) units to start with

Alt: 
    Focus on many units with many evolutions
    Pro: Doesn't require manual labour of setting stats
    Easier to say if evolution exist or not
    Interesting gameplay aspect?
    Might want 2 levels for some (Level 5 units)
Auto chess: Jynx1 jynx2 jynx3
    drawbacks: jynx2 jynx3
    Jynx2 = jynx level 50, Jynx3 = jynx level 100
    Find math for getting a better version of one pokemon that is balanced and comparable to others evolving

eevee:
    Evolution based on amount of unit types on board
    Placement of eevees decides evolution!

prevent getting more units of same type if you have max of that type

## Npc rounds / Item rounds

Gym leader rounds:
    gives special item money,
    max 3 hp round loss
    can give item (low chance)
    10: Rock: Geodude, Onix
    15: Water: Staryu, Starmie
    20: Electric: voltorb, pikachu, raichu
    25: Grass: victreebel, tangela, vileplume
    30: Poison: koffing, muk, koffing, weezing
    35: Psychic: kadabra, mr. mime, venomoth, alakazam
    40: Fire: Growlithe, ponyta, rapidash, arcanine
    45: Ground: rhyhorn, dugtrio, nidoqueen, nidoking, rhydon
    50: Ice: dewgong, cloyster, slowbro, jynx, lapras
    55: Fighting + Onix: Onix, hitmonlee, hitmonchan, onix, machamp
    60: Ghost + goldbat/arbok: Gengar, golbat, haunter, arbok, gengar
    65: Flying + Dragon: Gyarados, Dragonair, aerodactyl, dragonite
    70: Final Boss: Pidgeot, alakazam, rhydon, arcanine, exeggutor, blastoise

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

## Backend

Stop spawning units of certain type for player if has level 3

Prevent requests if game isn't active

Hold sessions connected to socketids

## Frontend

Ready: Show number of connected players on start game button

Double check if keyPress events should be on Cell
    A lot of events being activated at same time (64)!
    Maybe for placePiece, but not the others?

Units with big animations: Moltres Pidgeotto

Shop:
    Modal
    Better outline / card holder

Hover: 
    Show information about type bonuses on hover and evolution

Placement: Currently Click and Q

Withdraw: W

Sell: Click and E

## Communication

Client                  Server
player ready ->
            <- Amount of players ready
player unready ->
            <- Amount of players ready
startGame ->    
        <- Create initial state (init&start)
        <- Send it to all connected users
            Match socket with playerindex
            Mark time when it is battle time 
                (currentTime + 60)
toggleShop ->
    <- state
buyUnit ->
    <- state
refreshShop ->
    <- state
placePiece ->
    <- state
withdrawPiece ->
    <- state
When timer is out
Send state to server ->
        Build new state given from all users
        Decide what kind of battle is happening
        (pvp, pve, gymbattle)
        calculate battles, with opponents, and store moves
Meanwhile: Have a timer for like 5 sec or something show
        Calculate latest time to finish battle
    <-  Send moves to server
Timer=reached, assuming battle states are achieved,
Visualize battle
TODO: Check visualization speed is reasonable (multiply by factor otherwise)
Sounds etc
        time=reached => 
            <- State after battle, marked next battle time
                Check if players lost, mark correctly etc