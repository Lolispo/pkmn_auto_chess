# TODO

## Check in Auto Chess

Mana: 15% of damage to mana or 10
    Math.min(0.15 * damage, 10);
    For both giving and receiving
    Double amount for spellheavy units

## Crash and Tests for ingame

Crash: 
    FrontEnd battle not matched, some units survive that shouldnt
    Should have found big crash, didnt check if getMovePos was undefined

Test me ingame:  
    Different opponents varies for 3 players?
    Messages show level 3 upgrade as well - check order
    3 psychic - crashed
    WinningAnimation: Apply to all winning units? (Notice multiple of same type)
    Player loses
    Player disconnects (Not prio)
        During battle or normally

## Backend

Target Priorities
    Make more like move priority, in front of you first
    Never stick on a target where attacks are < x1
        (meh)

Type Bonuses are wrongly typed
    Instead of giving first 15, then 15, it gives first 15 then 30: 
        Combos go insane very fast
    Update description of types to be generated automatically from fields instead of manually typed

Rivals:
    When playing against the person you played the most
    > 3 Battles
    Make interesting: Keep record of results from battle between players
    Rival is the one opponent where you have lost and won to most equally
        People might not have each other as rivals

StepsToTake dependent on pokemon stats

MoveRemake
    Does it allow jumping over if close enough?
        Better when priorities are set for target better

Player eliminated logic
    Move all pieces back to pieces in session
        hand + board
    Send information to frontend that you are out
        A message is being sent to everyone in chat
        Disable all board interact functionality for user
            Same functionality that should be used when spectating a player

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

Pieces:
    Max 9 units for each player
        Fixes: Stop spawning units of certain type for player if === 9

Add longestTimeAllowed for battle, where a tie occurs

Dps stats after round

Weak against type list (Currently only strong against, ineffective and no effect)

No target move (splash) shouldnt deal damage (curr 1 it seems)

ToggleLock Refactor: dispatch directly, dont interact with server (Easy spam)

first move implement
    Current Logic in: setRandomFirstMove
    
Longer range than 1
    Requires animation calculate vector instead of fixed amount of pixels
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

More advanced Matchup system

Attack priority
    Type effective?

Add next round opponent
    pvp, gym battle, npc
    Add/Find images for gym leaders

Flying longer movement

max mana? Instead of letting it go over
    Cap at abilityCost? Could work good

Aoe damage logic

Finish abilities implementation (teleport)

## Frontend

Message:
    Update player -> information about what was updated from server

You won / lose -> battle won / lost

Timer set to system.time and calculated from that
    If game is canceled, make that timeout clearinterval

SellPieceEvent:
    Allow selling piece not in battle during battle

Leave Game button
    Prompt (pseudo alert): are you sure you want to leave the game?

Error console logs logic in frontend, move to constructor instead of render (battleStartDetection)

confetti on win http://www.cagrimmett.com/til/2018/01/05/css-confetti.html

Restart reset more variables
    SoundEffect unitSound chat reset
    OnGoingBattle weird

Chat:
    BattleResults in chat
    Separate Chats into categories
        Battleresults
        unit upgrades
            Maybe only temporary? Too strong to have it stored forever...
        Normal Chat

Add icons for types, to be used for buffs
    Can be inspired from card icons if none are found
        Hard for fighting / ground

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
    (Temp) Color Type messages so easier to read fast

Css:
    Shine the lock a bit, fades into background
    Bonus hp as shield bar (Original hp + bonus)
    Prettier Volume slider
    Nidoran display name new line in button
    Eevee evolutions stats screen
    Mark default radio button in bottom right as Chat (Make selected)
    Auto scroll down chat
    more obvious you can't place on enemy part of board

Animations: 
    Better move animation
    Death Animations
        Flip 90 degrees and then fade
    Level up animation -> too full bar and down to zero (or xp over 0)
    Hp bar changes animation
    growAnimation looks bad on firefox, instant instead of in stages

Code: Event code only in one place
    placepieceevent in 2 spots currently
    Move to separate file and import, requires sending props

TopBar:
    Piece Image

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
    Streak Showing
    *Later: Name and (preselected)image
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
    Use Message more for errors - Red text if error
    Display winner of battle more clear
    Positioning better at cursor
        Alt: Overlayed on the board

Show permenent buffs at left of board  

Sound: 
    Scale music so start middle of bar instead -> not as loud possible
    Chat Mute/unmute icons
    Add hotkey m for toggle mute (for music m, sound n, chat c)
    Disconnect sound
    New Music/Sounds:
        Music before any game starts, gold theme main menu
        Battle Music same style as idle music?
        More sounds:
            Start New Round sound
            Game won (Victory! (Trainer))
            Timer click (close to 0)
            player levelup sound
            Different sounds for own upgrade?

Credits somewhere in frontend (P and R.Music)

## Communication

disconnect make win if alone
    Disconnect detect on frontend
    Disable when reconnect allowed
    disconnect problematic during battle

## Tests

Tests are broken, fix

More tests in general, easier to test in theory when frontend done

Test combos/buffs from types

Abilities: 
Test dot damage functionality
Test lifesteal functionality

## Code / Javascript Check me

Rendering board more efficient, think immutable 

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

Drag-n-drop for placing units

Https

Spinning wheel animating time between moves for all pokemon
    Easier to see when a unit does move

Startscreen: 
    Lobbies by Url
        Easier reconnect that doesn't require login
            if(name === missingPlayer) allow; otherwise: no;
    Reconnect feature
        Either through login or lobbies through url /
    Auto Ready options
    Login with name system
        Starts game with player.name set for all players
            Display player.name instead of Player + index
                Scoreboard
                Battle: own name/ enemy name
        Features for stored logins (same account every game):
            Login system
            Stats for player:
                Wins/Losses
                Favorite units possibility 

Crit (meh)
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

Abra 2 -> 1

Sheets balance:
    Rhyhorn 4 -> 5?
    Horsea 4 -> 3? Is dragon tho on kingdra
    elekid 4 -> 3?
    Check slowpoke - really slow
    Check dps, damage

New abilities:
    Raticate hyper fang
    jigglypuff sing, something better (really bad)

gym balance
    Seems really weak, try deeper
    gym 3 -> needs more units

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