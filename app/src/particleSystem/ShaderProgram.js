export class ShaderProgram
{
    constructor(gl,combinedShader,debug = false)
    {
        this.gl=gl;
        this.vertexShader = combinedShader.vertexShader;
        this.fragmentShader = combinedShader.fragmentShader;
        this.debug = debug;

        this.program = gl.createProgram();
        gl.attachShader(this.program,this.vertexShader);
        gl.attachShader(this.program,this.fragmentShader);
        gl.linkProgram(this.program);
        if(this.debug)
        {
            if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))
            {
                console.error("ERROR linking program!", gl.getProgramInfoLog(this.program));
                return;
            }
        }
    }
}