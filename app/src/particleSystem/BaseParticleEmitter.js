
import {ParticleBuffer} from "./ParticleBuffer.js";
import { Vector2f } from "./Vector2f";

export class BaseParticleEmitter {
    constructor()
    {
        console.log("SUUUUPEr");
        if(BaseParticleEmitterDefaultOptions.webglRenderer==null)
        {
            console.error("You need to wait for the webgl to fully initialize before creating a particle emitter.");
        }
        BaseParticleEmitterDefaultOptions.webglRenderer.particleEmitterList.push(this); //Add this to list of emitters.

        this.webglRenderer = BaseParticleEmitterDefaultOptions.webglRenderer;
        this.gl = this.webglRenderer.gl;
        this.shader = this.webglRenderer.compiledShaders;
        this.worldSpaceMatrix = this.webglRenderer.worldSpaceMatrix;
        this.particleList = [];
        this.createParticleOptions = {};
        this.particlesCreated = 0;
        //this.buffer = new ParticleBuffer(this.gl,this.shader,this.worldSpaceMatrix);
        
        

        //Emitter settings
       /* this.pps = particlesPerSecond;
        this.lastParticleCreatedWhen = (1000/this.pps); //1000 is milliseconds in seconds. This will create a particle on start. Set to zero to wait for first particle.
        this.velocity = new Vector2f(Math.random()*-4+2,Math.random()*-4+2);
        this.particleType = particleType;
        this.location = location;
        this.age = 0;
        this.maxAge = maxAge;
        this.isDead = false;
        this.maxParticles = 9999;*/
        this.sprite = BaseParticleEmitterDefaultOptions.spriteSheet;
    }

    setOptions(options)
    {
        var keys = Object.keys(options);
        for(var i=0;i!=keys.length;i++)
        {
            var key = keys[i];
            var value = options[key];
            this[key] = value;
        }
    }

    setParticleBirthOptions(options)
    {
        var keys = Object.keys(options);
        for(var i=0;i!=keys.length;i++)
        {
            var key = keys[i];
            var value = options[key];
            this.createParticleOptions[key] = value;
        }
    }

    applyBirthOptions(p)
    {
        var keys = Object.keys(this.createParticleOptions);
        for(var i=0;i!=keys.length;i++)
        {
            var key = keys[i];
            var value = this.createParticleOptions[key];
            p[key] = value;
        }
    }

    onParticleBirth(){
    };
    
    createParticle()
    {
        this.onParticleBirth();
        if(this.particlesCreated>=this.maxParticles)
        {
            return;
        }
        var p = new this.particleType();
        p.createBuffer(this);
        p.setLocation(this.location.clone());
        this.applyBirthOptions(p);
        this.particleList.push(p);
        this.particlesCreated++;
    }

    deleteParticle(index,particle)
    {
        particle.onDeath();
        particle.disposeBuffer();
        this.particleList.splice(index,1);
        //particle.velocity = new Vector2f();
    }





    update(delta)
    {
        delta=1000/144;
        this.age+=delta;
        //console.log(this.isDead + " " + this.particleList.length);
        
        this.lastParticleCreatedWhen+=delta;
        let createParticleEvery = (1000/this.pps);
        if(this.isDead!=true && this.lastParticleCreatedWhen>=createParticleEvery)
        {
            this.createParticle();
            this.lastParticleCreatedWhen=0;
        }
        for(var i=this.particleList.length -1 ;i >= 0;i--) //Loop backwards so it's easier to remove dead particles
        {
            
            var p = this.particleList[i];
            p.update(delta);
            if(p.isDead==true)
            {
                //Delete
                this.deleteParticle(i,p);
            }
            p.buffer.render();
            
        }
        if(this.age>=this.maxAge)
        {
            this.isDead = true;
        }
    }
}

class BaseParticleEmitterDefaultOptions
{
    constructor()
    {

    }
}
BaseParticleEmitterDefaultOptions.webglRenderer=null;

export function setupBaseParticleEmitter(defaultRenderer)
{
    BaseParticleEmitterDefaultOptions.webglRenderer = defaultRenderer;
    BaseParticleEmitterDefaultOptions.spriteSheet = defaultRenderer.spriteSheet;
}

