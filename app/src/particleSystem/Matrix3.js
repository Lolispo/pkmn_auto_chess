import {Vector2f} from "./Vector2f.js"

export class Matrix3
{
    constructor()
    {
        this.matrix = [
            1,0,0,
            0,1,0,
            0,0,1
        ];
    }
    multiply(m)
    {
        var output = new Matrix3();
        output.matrix = [
            this.matrix[M3.M00] * m.matrix[M3.M00] + this.matrix[M3.M10] * m.matrix[M3.M01] + this.matrix[M3.M20] * m.matrix[M3.M02],
            this.matrix[M3.M01] * m.matrix[M3.M00] + this.matrix[M3.M11] * m.matrix[M3.M01] + this.matrix[M3.M21] * m.matrix[M3.M02],
            this.matrix[M3.M02] * m.matrix[M3.M00] + this.matrix[M3.M12] * m.matrix[M3.M01] + this.matrix[M3.M22] * m.matrix[M3.M02],

            this.matrix[M3.M00] * m.matrix[M3.M10] + this.matrix[M3.M10] * m.matrix[M3.M11] + this.matrix[M3.M20] * m.matrix[M3.M12],
            this.matrix[M3.M01] * m.matrix[M3.M10] + this.matrix[M3.M11] * m.matrix[M3.M11] + this.matrix[M3.M21] * m.matrix[M3.M12],
            this.matrix[M3.M02] * m.matrix[M3.M10] + this.matrix[M3.M12] * m.matrix[M3.M11] + this.matrix[M3.M22] * m.matrix[M3.M12],

            this.matrix[M3.M00] * m.matrix[M3.M20] + this.matrix[M3.M10] * m.matrix[M3.M21] + this.matrix[M3.M20] * m.matrix[M3.M22],
            this.matrix[M3.M01] * m.matrix[M3.M20] + this.matrix[M3.M11] * m.matrix[M3.M21] + this.matrix[M3.M21] * m.matrix[M3.M22],
            this.matrix[M3.M02] * m.matrix[M3.M20] + this.matrix[M3.M12] * m.matrix[M3.M21] + this.matrix[M3.M22] * m.matrix[M3.M22],
        ]
        return output;
    }
    transition(v, v2)
    {
        if(v2!=undefined)
        {
            let temp = v;
            v = new Vector2f(temp,v2);
        }
        var output = new Matrix3();
        output.matrix = [
            this.matrix[M3.M00],
            this.matrix[M3.M01],
            this.matrix[M3.M02],

            this.matrix[M3.M10],
            this.matrix[M3.M11],
            this.matrix[M3.M12],

            v.x * this.matrix[M3.M00] + v.y * this.matrix[M3.M10] + this.matrix[M3.M20],
            v.x * this.matrix[M3.M01] + v.y * this.matrix[M3.M11] + this.matrix[M3.M21],
            v.x * this.matrix[M3.M02] + v.y * this.matrix[M3.M12] + this.matrix[M3.M22],
        ];
        return output;
    }

    getLocation()
    {
        return new Vector2f();
    }

    scale(x,y=x)
    {
        var output = new Matrix3();
        output.matrix = [
            this.matrix[M3.M00] * x,
            this.matrix[M3.M01] * x,
            this.matrix[M3.M02] * x,

            this.matrix[M3.M10] * y,
            this.matrix[M3.M11] * y,
            this.matrix[M3.M12] * y,

            this.matrix[M3.M20],
            this.matrix[M3.M21],
            this.matrix[M3.M22],
        ];
        return output;
    }
    getFloatArray(){
		return new Float32Array(this.matrix);
	}
}

export class M3{
    constructor()
    {

    }
}

M3.M00 = 0;
M3.M01 = 1;
M3.M02 = 2;
M3.M10 = 3;
M3.M11 = 4;
M3.M12 = 5;
M3.M20 = 6;
M3.M21 = 7;
M3.M22 = 8;