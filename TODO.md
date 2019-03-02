# TODO

## Check in Auto Chess

Cost of dota auto chess upgraded units
    Level 2, type 4 -> sells for 6 (his level) +2 for now

How much hp to lose? 1 point per level of unit
Definitely not, 6 level 6 units would be 36 hp, more like 14 damage from them (6-0)
Temp: 1 hp per level

## Backend

Move updates:
    Mana updates
        Move manaIncrease function logic to 2 functions
        One calculate mana changes and return the value
            Can also be used in move
        The other calculates newBoard from manaChanges calculated

end game when peoplePlaying > 2 from start and only one left
    Game over logic
    otherwise let play until dead (good for testing and singleplayer)

Information moving to get to frontend:
    Gold information calculation
        Move outside of function, calculate at gold changes and update frontend
        Maybe streak is received on frontend and everything can then be calculated there already?
    PlacePieceEvent:
        Types
        Which units to be sent back
    Type bonuses calculations, what combos are active
        Recalculate and update unitbuffs and boardBuffs on piece interactions
        Set on board units (not battle, already had)
            Every unit has buff or empty
        Set on left side of board, buffs
            boardBuffs

Handle empty boards for battle
    Should still visualize the enemy units

Pieces:
    Max 9 units for each player
        Fixes: Stop spawning units of certain type for player if has level 3

Aoe damage logic

Matchup system
    Moved to function but still needs logic figured out

first move

Finish abilities implementation (teleport)

ToggleLock Refactor: dispatch directly, dont interact with server (Easy spam)

Callback too many units
    = ?
    
Longer range than 1
    2:
        Caterpie, weedle, pidgey, spearow
        Butterfree
        pikachu
        venomoth
        zubat
        clefairy
        growlithe
        drowzee
        voltorb
        koffing
        elekid
        snorlax
        dratini
    3:
        gastly
        magnemite
        Abra
        Blastoise
        charizard
        mew/mewtwo/articuno/moltres/zapdos

Check money: Feels like you get a lot of money

## Frontend

ActionMessage:
    Put on receivers end instead, test this
    Position on top of unit

Animations: 
    Animation on actionMessage (Damage and effective)
        Fadeout and move down
    Animation on pokemonImg
        Move in direction of attack and then move back (start of animation slow)
    Level up animation -> too full bar and down to zero (or xp over 0)
    Hp bar changes animation

Code: Event code only in one place
    placepieceevent in 2 spots currently

Startscreen: 
    Update connected on disconnect
    Make different actions invalid if game isn't live
    If connection with host is gone, exit game
    Allow to start game without all connected sockets ready
        Countdown and start with all ready players when countdown finishes
    Add leaveGame button
        Are you sure you want to leave? Prompt

TopBar:
    Add option to choose playerNames
    Piece Image

Battle
    Show mana bar
        Requires mana changes to be sent in move, added in backend todo
        Max 200, 50/200 => 25% mana bar full
        Change color of manabar when above ability.cost
    Select units working during battle (Investigate)

Infopanel
    Show bars in infopanel screen for stats (Easier comparisons)
    Show all evolutions, highlight selected unit
    Click on evolution, expand that unit
        Name on evolution
    Level of unit displayed (Cost, worth to sell)
    Pokedex look?

Shop
    Buy unit button, third of shop div size
    Rest is infopanel selectable, information from unit before buying

Scoreboard: 
    Css me
    Make players clickable
        Show their board when that is done

Board css:
    pseduoElements :select 
    Fix z-index (or something) to place selected on top
        outline ugly, not on right side
    Display Which unit will be called back/selected when too many units on board
        Noted todo in backend
        Gray background or something

Cache More Information
    Cache images/gifs (Store image, paddingTop, width and height, might not work)

Message:
    Update position and size to be overboard and use for vital information
        Css required a lot
    Use Message more, especially for errors
        Red text if error
    Display winner of battle more clear

Show permenent buffs at left of board  

Timer

Sound

Support for mouse only gameplay
    Add options to withdraw and sell piece with mouse
    Button appear for option to sell piece with mouse when unit selected
        Button in left bar below selected unit info

## Communication

## Tests

More tests in general, easier to test in theory when frontend done

Test combos/buffs from types

Abilities: 
Test dot damage functionality
Test lifesteal functionality

## Code / Javascript Check me

Load / Set time factor better

Make elements % based instead of pixel based

Give information that playarea isn't in focus when it isn't
    Some error showing when hotkeys are availalbe or not

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

Crit

Chat system on left hand or bottom right of screen
    Use it for information about other people's upgrades

Type buffs - Add typebuffs from sheets directly

Shuffle deck of pieces when 20 (40?) pieces are discarded? Chance for not all pieces should be in every game

Shop: Modal?

eevee:
    Placement of eevees decides evolution!
    Evolution based on amount of unit types on board
    Temp: Random

## Balance

Second wave 2 rattatas seem strong

Too Weak:
    Diglett 2->1
    Vulpix 2->1

Too Strong:
    Sandshrew 1->3(2)

## New features to add (Not as core)

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