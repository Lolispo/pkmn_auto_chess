
import { Vector2f } from "./Vector2f.js";
import { BasicShader } from "./BasicShader.js";
import { Matrix3, M3 } from "./Matrix3.js";
import { ParticleBuffer } from "./ParticleBuffer.js";
import { BaseParticleEmitterOptions, BaseParticleEmitter, setupBaseParticleEmitter } from "./BaseParticleEmitter";
import { BaseParticle } from "./BaseParticle";
import { FlameThrower } from "./Custom/FlameThrower";

var renderer;

export function initWebgl(canvas,spriteSheet)
{
    console.log("init webgl;");
    renderer = new webGlRenderer(canvas,spriteSheet);
    setupBaseParticleEmitter(renderer);
    var hej = new FlameThrower(new Vector2f(400,400),new Vector2f(900,400));

    //new BaseParticleEmitter(BaseParticle,"flamethrower",new Vector2f(400,400),10000,8);
}

export class webGlRenderer
{
    constructor(canvas,spriteSheet)
    {
        this.particleEmitterList = new Array();
        this.canvas = canvas;
        this.spriteSheet = spriteSheet;
        this.canvas.style.width="696px";
        this.canvas.style.height="696px";
        this.canvas.style.zIndex ="150";
        this.gl = this.canvas.getContext("webgl" || "experimental-webgl");

        this.calculateWorldmatrix();
        
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        
        var bShader = new BasicShader(this.gl);
        this.compiledShaders = bShader.getCompiledShaders();
        this.render();
        this.loopCounter=0;
    }

    calculateWorldmatrix()
    {
        var wantedResolution = 696;
        var width = this.canvas.width;
        var height = this.canvas.height;
        
        this.worldSpaceMatrix = new Matrix3().transition(new Vector2f(-1,1)).scale(2/696,-2/696);
        this.gl.viewport(0, 0, width, height );
    }


    deleteEmitter(index)
    {
        this.particleEmitterList.splice(index,1);
    }


    render()
    {
        this.loopCounter+=1;
        this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
        this.gl.clear(this.gl.DEPTH_BUFFER_BIT | this.gl.COLOR_BUFFER_BIT);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        let delta = 1;
        for(var i=this.particleEmitterList.length-1;i>=0;i--)
        {
            let emitter = this.particleEmitterList[i];
            emitter.update(delta);
            if(emitter.isDead && emitter.particleList.length==0)
            {
                this.deleteEmitter();
            }
        }

        requestAnimationFrame(()=>this.render());
    }
}





