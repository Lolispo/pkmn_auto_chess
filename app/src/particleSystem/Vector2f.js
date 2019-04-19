export class Vector2f
{
    constructor(x=0,y=0)
    {
        this.x=x;
        this.y=y;
    }

    add(v)
    {
        if(isNaN(v))
        {
            this.x = this.x + v.x;
            this.y = this.y + v.y;
        }
        else
        {
            this.x+=v;
            this.y+=v;
        }
        return this;
    }

    sub(v)
    {
        if(isNaN(v))
        {
            this.x = this.x - v.x;
            this.y = this.y - v.y;
        }
        else{
            this.x-=v;
            this.y-=v;
        }
        return this;
    }

    distToVector(v)
    {
        return Math.sqrt(this.distSquaredToVector(v));
    }

    distSquaredToVector(v)
    {
        return (this.x-v.x)*(this.x-v.x) - (this.y-v.y)*(this.y-v.y);
    }

    multiply(input)
    {
        this.x*=input;
        this.y*=input;
        return this;
    }

    length()
    {
        return Math.sqrt(this.lengthSq());
    }

    lengthSq()
    {
        return (this.x*this.x)+(this.y*this.y);
    }

    normalize()
    {
        var l = this.length();
        this.x/=l;
        this.y/=l;
        return this;
    }

    clone()
    {
        return new Vector2f(this.x,this.y);
    }
}