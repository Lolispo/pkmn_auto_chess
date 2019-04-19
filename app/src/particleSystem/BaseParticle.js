import {Vector2f} from "./Vector2f.js";
import {ParticleBuffer} from "./ParticleBuffer";

export class BaseParticle {
    constructor()
    {
        this.location = new Vector2f(0,0);
        this.velocity = new Vector2f(0,0);
        this.target = new Vector2f(0,0);
        this.killOnTargetHit = false;
    }

    createBuffer(particleEmitter)
    {
        this.buffer = new ParticleBuffer(particleEmitter.gl,particleEmitter.shader,particleEmitter.worldSpaceMatrix,particleEmitter.sprite,this);
    }

    setLocation(vector)
    {
        this.location = vector;
    }

    disposeBuffer()
    {
        this.buffer.dispose();
    }

    onDeath() //Override-able!
    {

    }

    update() //Override-able!
    {
        
    }

    superUpdate(delta)
    {
        var newLocation = this.location.clone();
        newLocation.add(this.velocity.clone().multiply(delta));
        this.setLocation(newLocation);

        this.age+=delta;
        if(this.age>=this.maxAge)
        {
            this.isDead=true;
        }
        if(this.killOnTargetHit)
        {
            var minDistanceFromTarget = 15;
            var currentDist = this.location.distSquaredToVector(this.target);
            if(currentDist<=minDistanceFromTarget*minDistanceFromTarget)
            {
                this.isDead=true;
            }
        }
    }
}