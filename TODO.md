# TODO

## Fix for play

Enable sounds @ reducer 'enabledSound'

Timer -> 30 @ reducer 'timerDuration' 

Pieces in board -> default @ game_constants

debugMode -> false @ game_constants

hp/Money -> 100/1 @ player

## Check in Auto Chess

Mana: 15% of damage to mana or 10
    Math.min(0.15 * damage, 10);
    For both giving and receiving
    Double amount for spellheavy units

## Crash and Tests for ingame

Crash: 
    Dead player
    
Fixed Check:
    RefillPieces - shouldnt get a list from playerlost (board units)
    Eevee stats panel (takes big size)
    Sell piece button cost css alignment

Test me ingame:
    9 units of a base type
        Can you receive anymore?
        Can you get 2 in shop when you have 8 of that type?
    Move
        Does it allow jumping over if close enough?
    Visit dead player
        Should move to yourself as dead (require a new move)
    Low Prios Tests:
        Player disconnects
            During battle or normally

Known issues:
    Battle ending with units from both teams alive
        Effects Probably: Dot damage, healing, multistrike
    Battle ending before finish
        longest battle duration check

Odd behaviour:

    Something doing 0.5 damage (brock vs parasect)

    No target move (splash) shouldnt deal damage (curr 1 it seems)
        Check

# Fix me - Prio

    Check battle
        DotDamage - NOT MATCHING UP
        Multistrike - Check

## Add me - Prio



## Backend

Sp.attack Sp.defense for ability calculations
    Required in stats panel
    Dragon +sp.attack

Improve shuffle
    Some combinations are way more common than others

Crash - players[key] = null, somewhere players get null back from server
    Shouldnt crash on this atleast for now

Move logic of upcoming enemy to calculate before next round beginnings
    currentLogic -> buildMatchups
    To logic -> endBattle sending
    Pvp Battle -> Id of next opponent

PlacePieceEvent (All piece interactions):
    Which units to be sent back
        Current logic in: fixTooManyUnits
        Move logic so units to be called back is already marked in the state
            'expendableUnit': true
        In frontend: if (unit.expendableUnit) Color me

Pieces from shop refactor:
    Max 9 units for each player
        Good limit for units that doesn't have level 3?
        Max 6 units if 2 levels, Max 3 for level 1 units

Send information if unit evolved for animation
    Positions of units that got evolved
    https://jsfiddle.net/z92y8pa3/

Target Priorities
    Never stick on a target where attacks are x0 (No effect)
    If multiple within range: 
        Type effective priority
            Get all units at same length from target as List
            Get Unit with highest effectivness against
            If multiple, random

Speed rework how it is applied
    Instead of upperlimit - speed = cd between actions

Lock
    ToggleLock Refactor: dispatch directly, dont interact with server (Easy spam)
        During battle: Interact with server, otherwise no

Add next round opponent
    pvp: name
    Npc waves
        Alt1: Image/text of matchup
            Either give information about them in up next
        Alt2: random the wave between different presets (wave 2 and 3)
            Shouldnt have advantage of knowing meta in early game

Players deaths:
    After own battle is done, send post battle state to user?
        Pro: Make battle results come more interactively
        Start timeouts for all players with their battle length and updatePlayer
            with result to all, 
            player = received money for win, but not for income
                Requires refactor

Rivals:
    When playing against the person you played the most
    > 3 Battles
    Make interesting: Keep record of results from battle between players
    Rival is the one opponent where you have lost and won to most equally
        People might not have each other as rivals

StepsToTake dependent on pokemon stats

Add longestTimeAllowed for battle, where a tie occurs

Type effectivness List
    Weak against type list
        Currently only strong against, ineffective and no effect
        Make this list available as well
    Make searchable to find quickly
        Simple input field that clears when changing radio button

first move implement
    Current Logic in: setRandomFirstMove
    Not required atm
    
Longer range than 1
    Animations:
        Canvas? Draw projectiles from fromPosition to toPosition
        Requires more attack animations
        Better way to do these animations


Ability ranges implementation requries check for if ability.withinRange

More advanced Matchup system

Aoe damage logic

## Frontend

End battle isn't reached for spectators
    Doesnt get up next and stuff

Spectator cant currently see lock toggles

Length of move animation connected to when next move should be made

Fix actionMessage
    Ugly atm, super ugly
    Only render ON CHANGE of attack info
        Rerender actionMessage if changed, otherwise let it be

Max size of shop base (mewtwo moltres wide)

Sounds - Currently only one at a time
    Fix playing multiple sounds, currently replays all
        Would in theory be fixed by not storing in array

Display more clearly as a loser if you are eliminated
    Also when game is over when you are not winner

Matchup gym leaders for same spot all the time
    Upnext / gymleader text same width
    Put span -> div => width: 100px maybe (ish)
        Only when img is relevant put it as forced size

Buying unit when visiting -> change back visited to state.index

No animation if moving hand -> hand during battle
    Check if onGoingBattle allow pokemonSpawn if !isBoard

Make chat text more easily readable
    Dont show damage Dealt if empty

Redo battle rendering
    Redo frontend battle rendering to make possible to jump between battles
    Init: startBattleTime = new Date(),  
    moves.forEach((move) => {
        timeouts.push(setTimeout((dispatch) => {
            check bordindex is correct
                Do move calculations on board
        }))
    })
    onBoardChange: timeouts.forEach((timeout) => {
        clearTimeout(timeouts)
        battleStartBoard = battleStartBoards[i]
        currentTime = newDate = startBattleTime
        Calc all moves up until currentTime
        Render moves from here on out with same method as above
            Array[i - last] where i is where time is at
    })

Enemy type bonuses during battle

Firefox make chat scrollable

Chat sound overlap normal sounds

Enable sound on connect
    Acts weird

2 volume sliders instead of 1

More obvious 'lock' when your actions wont be stored anymore
    When battleready is sent set onGoingBattle to true

Battle Css:
    Last attack isn't displayed
    better death animation
    buffMessage not clickable
        Click on unit beneath it

Gold information calculation
    Calculate and show potential next goal
        win: +5, loss: +2

Types leftbar:
    Show goals for types in leftbar
        bottom right corner having number of next tier to unlock
    Show bonus information
        Clickable (Hoverable): show information typeBonus
        marked['typeBuff'] + ': ' + marked['value']

Dynamic css animations for movement and attacks
    Currently hardcoded, hard to expand to longer walk and attack range

Pressing 1-8 when not hovering board selects the unit in that position

Cache / Store gifs somehow in browser?
    Only get sprites if not stored
    Localstorage was not big enough, might not be possible

EnemyDebuff: 
    Select unit
        Notice if marking friendly or enemy unit during battle
    Mark debuffs for enemies when selecting enemy units .team === 1
        For this to be relevant: Needs to load enemy buffs aswell

Rotate unit in attack direction
    Up and down normal front and back
    Left mirrored back?
    css mirror, transform: scaleX(-1)

Ability effects from canvas

Redo pokeball
    696x696
    pokeball align middle
    pokeball design as in 
    https://i.guim.co.uk/img/media/3b962fbea708f7ca583ed67ff88119a428aaa504/0_443_1440_1440/master/1440.jpg?width=300&quality=85&auto=format&fit=max&s=bda14865f2c3976cbc163108ef92e7c1
    Color as in costColor1 or gray in pokeball

forceStartGame update for not start 

Shrink animation fix during battle

Clickable (:hover) effect

Horn sound lower

gameEnd
    Show that you won more visibly than message, since message is easily replaced
    Confetti!

Select unit
    Save information on deselect in left side but remove sell button
        Use logic from shopInfoSelect possibly

Message:
    Update player -> information about what was updated from server

Timer set to system.time and calculated from that
    If game is canceled, make that timeout clearinterval

Leave Game button
    Prompt (pseudo alert): are you sure you want to leave the game?

Error console logs logic in frontend:
    onChange to start battle error fix
        Had issue starting event in other way from this element

Restart -> reset everything except sprites
    To be used in leave Game (end Game leaving), otherwise refresh is fine

Chat:
    BattleResults in chat
    Separate Chats into categories
        Battleresults
        unit upgrades
            Maybe only temporary? Too strong to have it stored forever...
        Normal Chat

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

Contain information about all pokemon in the game somewhere
    Wiki? (Could link to sheet in beginning)

Css:
    hp bar % padding better (100% vs 95%)
    GrowText better - Firefox looks bad
    Info button position better?
    Bonus hp as shield bar (Original hp + bonus)
    Prettier Volume slider
    Nidoran display name new line in button
    Mark default radio button in bottom right as Chat (Make selected)
    Make more obvious you can't place on enemy part of board
    Sell button left bar align more centered (length is long)
    Chat:
        Chat different background color or something to separate from background?
        Radio buttons css
    
Animations: 
    Level up animation -> too full bar and down to zero (or xp over 0)
    Hp bar changes animation

TopBar:
    Piece Image

Infopanel
    Add getting information from the types in infoPanel
    Show bars in infopanel screen for stats (Easier comparisons)
    Show all evolutions, highlight selected unit
    Click on evolution, expand that unit
        evoName: evoImage
        ^Click -> stats for evolution in indexed tree follows
    Pokedex give inspiration for some part of infopanel?

Scoreboard: 
    Css me, Stick to right like a menu
    *Later: 
        Name and (preselected)image
        Make players clickable
            Show their board when that is done

Message:
    Use Message more for errors
    Display winner of battle more clear
    Positioning better at cursor
        Alt: Overlayed on the board

Sound: 
    Scale music so start middle of bar instead -> not as loud possible
    Add hotkey m for toggle mute (for music m, sound n, chat c)
    Edit he gone sound, shorter / remove unnecessary meta data
    New Music/Sounds:
        Temp musics
            Main Menu
            Victory Trainer (Game won)
        Battle Music same style as idle music?
        More sounds:
            Start New Round sound
            player levelup sound
                pokemon level up sound from games

Credits somewhere in frontend (P and R.Music)
    The bois: Arvid, Anton, Robin, Lowe

React Native port

## Communication

Timer reset if ongoing battle server restart (end battle)
    For leaveGame functionality (where refresh isn't wanted)

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

battleStartBoard -> battleBoard
visiting -> visitId

Put all switch cases in blocks

Optimize asset sizes
    webm pikachuBackground (half size)

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
    For Sets?

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

http -> Https

Spinning wheel animating time between moves for all pokemon
    Easier to see when a unit does move
    https://css-tricks.com/css-pie-timer/

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

## New features to add (Not as core)

Find a way of choosing pokemon in play
    Ban base types in beginning, before game start
    Oak theme

Automatic JSON download from google sheet

Fix working npm script to start both react and node server
    Currently requires two terminals, concurrent script not working

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