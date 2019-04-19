import { BaseParticleEmitter } from "../BaseParticleEmitter";
import { BaseParticle } from "../BaseParticle";
import { Vector2f } from "../Vector2f";

export class FlameThrower extends BaseParticleEmitter
{
    constructor(location,target)
    {
        super();

        let velocity = target.clone().sub(location).normalize().multiply(0.9);

        this.setOptions({
            "pps" : 15,
            "lastParticleCreatedWhen" : (1000/15), //1000 is milliseconds in seconds. This will create a particle on start. Set to zero to wait for first particle.
            "particleType" : FlameThrowerParticle,
            "location" : location,
            "age" : 0,
            "maxAge" : 5000,
            "isDead" : false,
            "maxParticles" : 1,
            //sprite = "flamethrower" //Not changeable yet
        });

        this.setParticleBirthOptions({
            "velocity" : velocity,
            "location" : location,
            "target" : target,
            "age" : 0,
            "maxAge" : 2500,
            "isDead" : false,
            "killOnTargetHit" : true
        });

    }

    onParticleBirth()
    {
        //Edit velicity and create a more random effect.
        /*this.setParticleBirthOptions({
            ////"velocity" : velocity
        });*/
    }
}

class FlameThrowerParticle extends BaseParticle
{
    constructor()
    {
        super();
    }

    update(delta)
    {
        this.superUpdate(delta);
    }

    onDeath()
    {
        //
    }
}