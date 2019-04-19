import { initWebgl } from './webgl.js';
import React, { Component } from 'react';
import spriteImg from '../assets/images/sprites/FireSprite.png';


export class ParticleSystemComponent extends React.Component {


  componentDidMount() {
    this.initParticleSystem();
  }

  initParticleSystem()
  {
    //Load image of particles etc...
    let canvas = this.refs.canvas;
    canvas.style["pointer-events"] = "none"; //This has to be set this way and not the react way.
    canvas.style.width="696px";
    canvas.style.height="696px";
    canvas.style.zIndex ="150";
    initWebgl(canvas, this.refs.spriteSheet);
  }

  render() {
    return (
      <div>
        <img ref="spriteSheet" src={(spriteImg)} style={{display:"none"}} />
        <canvas ref="canvas" width="800px" height="800px" style={{position:'fixed'}}></canvas>
      </div>
    );
  }
}


