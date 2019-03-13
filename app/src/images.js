// Author: Petter Andersson

import normal from './assets/types/typeNormal.png';
import fire from './assets/types/typeFire.png';
import water from './assets/types/typeWater.png';
import electric from './assets/types/typeElectric.png';
import grass from './assets/types/typeGrass.png';
import ice from './assets/types/typeIce.png';
import fighting from './assets/types/typeFighting.png';
import poison from './assets/types/typePoison.png';
import ground from './assets/types/typeGround.png';
import flying from './assets/types/typeFlying.png';
import psychic from './assets/types/typePsychic.png';
import bug from './assets/types/typeBug.png';
import rock from './assets/types/typeRock.png';
import ghost from './assets/types/typeGhost.png';
import dragon from './assets/types/typeDragon.png';
import dark from './assets/types/typeDark.png';
import steel from './assets/types/typeSteel.png';
import fairy from './assets/types/typeFairy.png';

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