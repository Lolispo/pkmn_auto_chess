# TODO

## Check in Auto Chess

Mana: 15% of damage to mana or 10
    Math.min(0.15 * damage, 10);
    For both giving and receiving
    Double amount for spellheavy units

## Backend

Add longestTimeAllowed for battle, where a tie occurs

Dps stats after round

Weak against type list (Currently only strong against, ineffective and no effect)

Target Priorities
    Make more like move priority, in front of you first
        Weaknesses
    Never stick on a target where attacks are < x1

Messages show level 3 upgrade as well
    2 messages for these upgrades

Matchup system
    Temp: Random
    Does it work for 3 players?
    More advanced TODO

Player eliminated logic
    Move all pieces back to pieces in session
        hand + board
    Send information to frontend that you are out, display something else

No target move (splash) shouldnt deal damage (curr 1 it seems)

Gold:
    Reward for winning battle?
    Streak for losing?
    Gold information calculation
        Move outside of function, calculate at gold changes and update frontend
        Maybe streak is received on frontend and everything can then be calculated there already?
        Show streak / next gold

PlacePieceEvent (All piece interactions):
    Type bonuses calculations, what combos are active
        Current logic in: markBoardBonuses
        Recalculate and update unitbuffs and boardBuffs on piece interactions
        Set on board units (not battle, already had)
            Every unit has buff or empty
        Render on left side of board, buffs
            boardBuffs, [players, 0, boardBuffs]
        Use this information, typeBuffs in the stats panel
            If type is buffed, show green + 25 for example at the hp for the unit
    Which units to be sent back
        Current logic in: fixTooManyUnits
        Move logic so units to be called back is already marked in the state
            'expendableUnit': true
        In frontend: if (unit.expendableUnit) Color me
    Piece Upgrade occured
        Current logic in: checkPieceUpgrade
        event NEW_CHAT_MESSAGE with unit upgraded for which player
        States returned where upgrade might have occured (PlacePiece) should 
            have a check for if it occured or not, and send message update if it did

New_CHAT_MESSAGE
    Separate sender, message, pieceUpgradeMessage, battleResult

Handle empty boards for battle
    Should still visualize the enemy units

Pieces:
    Max 9 units for each player
        Fixes: Stop spawning units of certain type for player if has level 3

Aoe damage logic

Finish abilities implementation (teleport)

ToggleLock Refactor: dispatch directly, dont interact with server (Easy spam)

Move
    Don't move furthest away immeditely, move in max steps 1-3 in correct direction
        Otherwise high speed means => jump into all enemies and die

first move
    Current Logic in: setRandomFirstMove
    
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

Ability ranges implementation requries check for if ability.withinRange

Level 5 unit upgrades?

Attack priority
    Type effective?

Add next round opponent
    pvp, gym battle, npc
    Add/Find images for gym leaders

## Frontend

Rendering board more efficient, think immutable 

confetti on win http://www.cagrimmett.com/til/2018/01/05/css-confetti.html

Restart reset more variables
    SoundEffect unitSound chat reset

Crash: 
    Geodude game@1162 . typesJS.getBuffFuncAll(...) is not a function
        Problem due to Rock and Ground both having increaseDefense?
    Move type undefined after ember applied dot
        Check ember tests, dot for fire
    Weird bug, battle crash, pos undefined <- IMPORTANT TO FIX
        Board is undefined for that battle, or something
        Check if board can be undefined from combineBoards, markBoardBonuses, setRandomFirstMove
    Psychic Debuff enemy units crash
        Only for 2 units? Kadabra Kadabra slowbro

mainMenu
    Add more functionality, not important tho

BattleResults in chat

Add icons for types, to be used for buffs
    Can be inspired from card icons if none are found
        Hard for fighting / ground

KeyInput
    If chat input is in focus, disable hotkey logic

ActionMessage coloring
    Multiple actionMessages to support taken multiple instance of damage?
        Have to figure out that they only render once
    positioning
    Green for spells
    Red/White when you take damage
    ^These two should probably be positioned differently
        Damage directly on unit, fading and going up
        Spell top right of unit, fading to the right

Help Messages
    Color Type messages so easier to read fast
    Font color / text shadow feels weird overall here

Css:
    Shine the lock a bit, fades into background
    Attack left animation return too far to the left
    Bonus hp as shield bar (Original hp + bonus)
    Prettier Volume slider
    WinningAnimation: Check me
    Nidoran display name new line in button
    Eevee evolutions stats screen
    Mark default radio button in bottom right as Chat (Make selected)
    Auto scroll down chat

SellPieceEvent:
    Allow selling piece not in battle during battle

ActionMessage:
    Position on top of unit

Animations: 
    Units turn small
    Death Animations
        Flip 90 degrees and then fade
    Animation on actionMessage (Damage and effective)
        Fadeout and move down
    Level up animation -> too full bar and down to zero (or xp over 0)
    Hp bar changes animation
    growAnimation looks bad on firefox, instant instead of in stages

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
    Piece Image

Battle
    Clear actionMessages after all moves are done
    Show mana bar
        Requires mana changes to be sent in move, added in backend todo
        Max 200, 50/200 => 25% mana bar full
        Change color of manabar when above ability.cost

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
        Gray tinted background or something

Message:
    Update position and size of message to be overlayed over the board and use for vital information
        Css required a lot
    Use Message more, especially for errors
        Red text if error
    Display winner of battle more clear

Show permenent buffs at left of board  

Timer
    On top or left, very visible
    BattleTime effect to setTimeout function
    After endbattle, start this setTimeout for battleTime function

Sound: 
    Disconnect sound
    Multiple sound effect variables?
        To play concurrently
    New Music/Sounds:
        Different sounds for own upgrade?
        Music before any game starts, gold theme main menu
        Battle Music same style as idle music?
        More sounds:
            Battle start sound, horn
            player levelup sound
            Battle end sound 
                Sad cheer, aww
            Game won (Victory! (Trainer))
            Not valid press (not enough money etc)
                Use on invalid attempts, message invalid is made now
            Timer click (close to 0)
    Set position of mute buttons, moves a lot when selecting and deselecting unit
    Add hotkey m for toggle mute (for music or both)

Credits somewhere in frontend (P and R.Music)

## Communication

disconnect make win if alone
    Disable when reconnect allowed
    disconnect problematic during battle

Auto Ready options

Sessions: 
    Room join /url

## Tests

Tests are broken, fix

More tests in general, easier to test in theory when frontend done

Test combos/buffs from types

Abilities: 
Test dot damage functionality
Test lifesteal functionality

## Code / Javascript Check me

Firefox Check

Load / Set time factor better

Cache More Information
    Cache images/gifs (Store image, paddingTop, width and height, might not work)
        Store gifs locally, resave with sizes and padding set

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

Https

Spinning wheel animating time between moves for all pokemon
    Easier to see when a unit does move

Reconnect feature
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

Speed might be too strong atm
    Buff tanky units

Strongest 1: 

Rhyhorn 4 -> 5?
Horsea 4 -> 3? Is dragon tho on kingdra
elekid 4 -> 3?
Check slowpoke - really slow

Sheets dps check for balance

New abilities:
    Raticate hyper fang

gym balance

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