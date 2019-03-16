# TODO

## Fix for play

Enable sounds @ reducer 'enabledSound'

Timer -> 30 @ App '5'

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
    Player loses
        Shouldn't be able to interact with anything board related
            Fix select event
    Move
        Does it allow jumping over if close enough?
            Better when priorities are set for target better
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

    Attack from 2 tiles away bug?

    No target move (splash) shouldnt deal damage (curr 1 it seems)

# Fix me - Prio
    
    Die same round gets weird
        Multiple of same id

    Max size of shop base (mewtwo moltres wide)

    Crash - players[key] = null, somewhere players get null back from server
        Shouldnt crash on this atleast for now

    Lock check

    Players die same round
        Handle order as time eliminated

    Dont allow ready before loaded

    Start screen better sign of loading

    DotDamage - NOT MATCHING UP
    Multistrike - Fixed

    Player loses
        dont crash when new battle starts (check .index)
        dont allow press board during battle
            no battle start board -> undefined error
            check for select event player is alive

## Add me - Prio

    Timer sound

## Backend

http get request (ajax) sprites
    Move transfer of sprites 
    Connect socket first when file is transferred

Move: Get closest enemy
    If undefined, try again for second closest

pieces: 
    Trying refill for 414000 units
    Buy upgrades xd

discarded Pieces
    Nidoran in masses

if alive, reset visited after battle

Dead players
    Get battleStartBoard and actionStack from visited index
    Allow dead players to render battle (currently returns if dead)

battleStartBoard -> battleBoard

Redo frontend battle rendering to make possible to jump between battles

Send information if unit evolved for animation
    Positions of units that got evolved

Target Priorities
    Make more like move priority, in front of you first
    Never stick on a target where attacks are x0 (No effect)
    If multiple within range: 
        Type effective priority
        Get all units at same length from target as List
        Get Unit with highest effectivness against
        If multiple, random

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

Speed rework how it is applied
    Instead of upperlimit - speed = cd between actions

Lock
    ToggleLock Refactor: dispatch directly, dont interact with server (Easy spam)
        During battle: Interact with server, otherwise no

Dps stats after round

Add next round opponent
    pvp: name
    gym battle: image
        Add/Find images for gym leaders
            https://pokemon.fandom.com/wiki/File:Brock_(game)(FrLg)Sprite.png
    npc: Image of matchup

Players die same round
    Need to record time of death, when removePlayerHp is called, check last actionStack time
    Handle in socketController and eliminate in order if multiple
        Check after each elimination if only one player left
    Is While Iterator problematic if 2 players die same round?
        Can it continue iterating if element was deleted previously
    Handle players being eliminated in same round
        After own battle is done, send post battle state to user?

Sp.attack Sp.defense for ability calculations
    Required in stats panel
    Dragon +sp.attack

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
    Requires more attack animations
        Better way to do these animations
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

More advanced Matchup system

Aoe damage logic

## Frontend

Deselect
    Allow deselect but save Stats in infopanel if stats isn't empty

Enemy type bonuses during battle

Level scoreboard

Lock as deadplayer

sync more stuff for visit
    Type bonuses
    Level, gold, 

Firefox make chat scrollable

Chat sound overlap normal sounds

Enable sound on connect
    Acts weird

Enemy -> Npc / Gym
    Images

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

Allow hand moving during battle if hand -> hand
    Needs placePiece to update session
    Check unitPos & target has undefined 'y'

Types leftbar:
    Sort by Bonus Tier - Decreasing
    Show goals for types in leftbar
        bottom right corner having number of next tier to unlock
    Show bonus information
        Hoverable: show information typeBonus
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
    pokeball design as in https://discordapp.com/channels/102097104322711552/102097104322711552/555146735568158763
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
    icecube/flame padding top increase
    GrowText better - Firefox looks bad
    Info button position better?
    Shine the lock a bit, fades into background
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
        Music before any game starts, gold theme main menu
            Own version?
        Battle Music same style as idle music?
        More sounds:
            Start New Round sound
            Game won (Victory! (Trainer))
                Own version?
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

Put all switch cases in blocks

Code: Event code only in one place
    placepieceevent in 2 spots currently
    getStatsEvent
    Move to separate file and import, requires sending props

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