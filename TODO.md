# TODO

## Check in Auto Chess

Cost of dota auto chess upgraded units
    Level 2, type 4 -> sells for 6 (his level) +2 for now

## Backend

Move updates:
    Mana updates
        Move manaIncrease function logic to 2 functions
        One calculate mana changes and return the value
            Can also be used in move
        The other calculates newBoard from manaChanges calculated

No target move (splash) shouldnt deal damage (curr 1 it seems)

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
        Use this information, typeBuffs in the stats panel
            If type is buffed, show green + 25 for example at the hp for the unit

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

Type displayName

## Frontend

KeyInput
    If chat input is in focus, disable hotkey logic

ActionMessage coloring
    Green for spells
    Red/White when you take damage

Ability displayNames

Help Messages
    Temp: Bottom right with a toggle
    Also show information about resistance weaknesses from types here

Css:
    Grey out / show isDisabled for clicking shopUnits / refreshShop/ buyExp when you don't have enough money
    Nidoran display name new line in button

ActionMessage:
    Put .actionMessage on receivers end instead, DamageTaken instead of given displayed
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
    Move to separate file and import, requires sending props

Startscreen: 
    If connection with host is gone, exit game
        If server is restarted, terminate all active games
    Features:
        Allow to start game without all connected sockets ready
            Countdown and start with all ready players when countdown finishes
        Add leaveGame button
            Are you sure you want to leave? Prompt

TopBar:
    Add option to choose playerNames, do login system for this
    Piece Image

Battle
    Clear actionMessages after all moves are done
    Show mana bar
        Requires mana changes to be sent in move, added in backend todo
        Max 200, 50/200 => 25% mana bar full
        Change color of manabar when above ability.cost
    Select units working during battle (Investigate)

Infopanel
    Show bars in infopanel screen for stats (Easier comparisons)
    Show all evolutions, highlight selected unit
    Click on evolution, expand that unit
        evoName: evoImage
        ^Click -> stats for evolution in indexed tree follows
    Level of unit displayed (Cost, worth to sell)
    Pokedex look?

Shop
    Buy unit button, third of shop div size
    Rest is infopanel selectable, information from unit before buying

Scoreboard: 
    Css me, Stick to right like a menu
    Make players clickable
        Show their board when that is done

Board css:
    pseduoElements :select 
    Fix z-index (or something) to place selected on top
        outline ugly, not on right side
    Display Which unit will be called back/selected when too many units on board
        Noted todo in backend
        Gray background or something

Message:
    Update position and size to be overboard and use for vital information
        Css required a lot
    Use Message more, especially for errors
        Red text if error
    Display winner of battle more clear

Show permenent buffs at left of board  

Timer
    On top or left, very visible
    BattleTime effect to setTimeout function
    After endbattle, start this setTimeout for battleTime function

Chat system bottom right, below shop
    Give piece upgrade information there for players

Help Message:
    Show type information temporarily

Sound: 
    Set position, moves a lot when selecting and deselecting unit
    onVolumeChange slider change directly (ref usage)
    One of these:
        Allow sound to be played if press something on stats screen (not autoPlay)
        Play sound again when unit is pressed (currently only when other unit has been pressed in between)
    Add hotkey m for toggle mute (for music or both)
    More sounds:
        Sell unit sound *clir
        Battle end sound 
        Levelup sound (Pokemon levelup sound)
        Game won (Victory! (Trainer))
        Not valid press (not enough money etc)
        Timer click (close to 0)
        Unit upgrade

## Communication

If reconnected to server, update look to start layout
    If server disconnected mid game, make the user go back to main menu if game was cancelled

## Tests

More tests in general, easier to test in theory when frontend done

Test combos/buffs from types

Abilities: 
Test dot damage functionality
Test lifesteal functionality

## Code / Javascript Check me

Load / Set time factor better

Cache More Information
    Cache images/gifs (Store image, paddingTop, width and height, might not work)

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

Consistent naming of pokemon unit and piece (Unit preferred)

Separate logic into more files if possible

Remove unused variables in imports

Cleanup comments, better structure

Potential to use more functional code, map/filter

## Optional Features

Spinning wheel animating time between moves for all pokemon
    Easier to see when a unit does move

Login with name system
    Requires start page
    Starts game with player.name set for all players
        Display player.name instead of player.index in own name and enemy name during battle
        Also scoreboard show name
    Features for stored logins (same account every game):
        Login system
        Stats for player:
            Wins/Losses
            Favorite units possibility 

Crit
    Suggestion: 20% chance crit 1.5x damage

Type buffs - Add typebuffs from sheets directly

Shuffle deck of pieces when 20 (40?) pieces are discarded? Chance for not all pieces should be in every game

Shop: Modal?
    Allows for centering board and more dynamic layout

eevee:
    Currently: Random evolution
    Placement of eevees decides evolution!
    Evolution based on amount of unit types on board
    Temp: Random

## Balance

Strongest 1: 

Second wave 2 rattatas seem strong

Rhyhorn 4 -> 5?
Horsea 4 -> 3? Is dragon tho on kingdra
elekid 4 -> 3?
Check slowpoke - really slow

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