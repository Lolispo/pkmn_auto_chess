// Author: Petter Andersson

// Images
import lockedLock from './assets/images/lockedLock.png';
import openLock from './assets/images/openLock.png';
import refreshShopImage from './assets/images/refreshShop.png';
import pokemonLogo from './assets/images/pokemonLogo.png';
import autoChess from './assets/images/AutoChess.png';
import soundMuted from './assets/images/soundMuted.png';
import sound from './assets/images/sound.png';
import music from './assets/images/note.png';
import musicMuted from './assets/images/noteMuted.png';
import chatSound from './assets/images/chatSound.png';
import chatSoundMuted from './assets/images/chatSoundMuted.png';
import pieceImg from './assets/images/piece.png';
import info from './assets/images/info.png';
import flame from './assets/images/flame.png';
import icecube from './assets/images/icecube.png';
import pokedollar from './assets/images/pokedollarWhite.png';
import collapseWhite from './assets/images/collapseWhite.png';
import collapseNotWhite from './assets/images/collapseNotWhite.png';

// Type images
import normal from './assets/images/types/typeNormal.png';
import fire from './assets/images/types/typeFire.png';
import water from './assets/images/types/typeWater.png';
import electric from './assets/images/types/typeElectric.png';
import grass from './assets/images/types/typeGrass.png';
import ice from './assets/images/types/typeIce.png';
import fighting from './assets/images/types/typeFighting.png';
import poison from './assets/images/types/typePoison.png';
import ground from './assets/images/types/typeGround.png';
import flying from './assets/images/types/typeFlying.png';
import psychic from './assets/images/types/typePsychic.png';
import bug from './assets/images/types/typeBug.png';
import rock from './assets/images/types/typeRock.png';
import ghost from './assets/images/types/typeGhost.png';
import dragon from './assets/images/types/typeDragon.png';
import dark from './assets/images/types/typeDark.png';
import steel from './assets/images/types/typeSteel.png';
import fairy from './assets/images/types/typeFairy.png';

export function getImage(name) {
  switch(name) {
    case 'lockedLock':
      return lockedLock;
    case 'openLock':
      return openLock;
    case 'goldCoin':
      //return goldCoin;
    case 'pokedollar':
      return pokedollar;
    case 'refreshShopImage':
      return refreshShopImage;
    case 'pokemonLogo':
      return pokemonLogo;
    case 'autoChess':
      return autoChess;
    case 'soundMuted':
      return soundMuted;
    case 'sound':
      return sound;
    case 'music':
      return music;
    case 'musicMuted':
      return musicMuted;
    case 'chatSound':
      return chatSound;
    case 'chatSoundMuted':
      return chatSoundMuted;
    case 'pieceImg':
      return pieceImg;
    case 'info':
      return info;
    case 'trophy':
    case 'flame':
      return flame;
    case 'icecube':
      return icecube;
    case 'collapse':
      return collapseWhite;
    case 'collapseNot':
      return collapseNotWhite;
    default:  
      return info;
  }
}

export function getTypeImg(type) {
  switch(type) {
    case 'normal':
      return normal;
    case 'fire':
      return fire;
    case 'water':
      return water;
    case 'electric':
      return electric;
    case 'grass':
      return grass;
    case 'ice':
      return ice;
    case 'fighting':
      return fighting;
    case 'poison':
      return poison;
    case 'ground':
      return ground;
    case 'flying':
      return flying;
    case 'psychic':
      return psychic;
    case 'bug':
      return bug;
    case 'rock':
      return rock;
    case 'ghost':
      return ghost;
    case 'dragon':
      return dragon;
    case 'dark':
      return dark;
    case 'steel':
      return steel;
    case 'fairy':
      return fairy;
    default:  
      return normal;
  }
}