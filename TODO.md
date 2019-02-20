# TODO

## Check in Auto Chess

Cost of dota auto chess upgraded units
    Level 2, type 4 -> sells for 6 (his level) +2 for now

How much hp to lose? 1 point per level of unit
Definitely not, 6 level 6 units would be 36 hp, more like 14 damage from them (6-0)
Temp: 1 hp per level

Check rarity 'color' connected to piece cost
    $5 pieces are easily spotted in shop

## Backend

Type buffs, add all and test
    Add typebuffs from sheets directly

Type bonuses on current board recalculate and store on piece interactions

Stop spawning units of certain type for player if has level 3
    prevent getting more units of same type if you have max, level 3, of that type

Aoe damage logic

Matchup system
    
## Frontend

Show type bonuses

KeyPress 1-8, binds place unit from that pos index (0-7) to mouseOverId

Timer

Battle

Sound

Max size of units
    Units with big animations: Moltres Pidgeotto Fearow
    Bit bigger: onix, mewtwo
    Units like zapdos, rapidash and arcanine gets fixed by small increase in Cell size

Ready: Show number of connected players on start game button

Shop:
    Modal
    Better outline / card holder
    Open and close shop with space

Hover: 
    Show information about type bonuses on hover and evolution

## Communication

Prevent requests if game isn't active

Hold sessions connected to socketids

## Tests

More tests in general, easier to test in theory when frontend done

Test combos/buffs from types

Abilities: 
Test dot damage functionality
Test lifesteal functionality

## Javascript Check me

check Promise.all alternative for loops

.has instead of !f.isUndefined

cleanup async usage, using Promise.all in places where multíple calculations are needed
 makes it bottleneck on the slowest one
    example: 
    // Promise.all() allows us to send all requests at the same time. 
    let results = await Promise.all([ getValueA, getValueB, getValueC ]); 

## Cleanup / Refactor

Separate logic into more files if possible

Remove unused variables in imports

Cleanup comments, better structure

Potential to use more functional code, map/filter

## Optional Features

Shuffle deck of pieces when 20 (40?) pieces are discarded? Chance for not all pieces should be in every game

eevee:
    Placement of eevees decides evolution!
    Evolution based on amount of unit types on board
    Temp: Random

## New features to add (Not as core)

Mapper: Json object to transfer to front-end with relevant information
    socketcontroller handles communication
    pieces shouldn't be reachable on the client
    session based saving of pieces instead? #Communication

Find a way of choosing pokemon in play
    (Filtered list makes this less important)
    shouldn't play all 151 at once
    1: Ban base types in beginning
    2: Choose (20-40) units to start with

Automatic JSON download from google sheet

Fix working npm script to start both react and node server
    Currently requires two terminals, concurrent script not working

#### Rival: Rival battle when playing against a certain opponent
    > 3 battles
    Alt1: Either when playing against the person you played the most
        Temp implementation makes this irrelevant
    Alt2: The person you lost to the most 
        Problem: People won't be rivals against each other
    Alt1 Best: Revamp over enemy matchups should be done to make this interesting

#### Items

More inspiration can be found [here](https://www.reddit.com/r/AutoChess/comments/ar4cjh/pokemon_autochess_concept/)

1 item per pokemon

X-speed, attack etc

Rare Candy - 2 less pokemon required for 

leftovers/lifesteal functionality
    item / type buff

#### Npc rounds / Item rounds

Gym leader rounds:
    gives special item money,
    max 3 hp round loss
    can give item (low chance)

Shop rounds: 
    Buy items for item money in item shop

## Communication Schema: 

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