export class BasicShader
{
    constructor(gl, vertexShaderCode=null, fragmentShaderCode=null, debug=true)
    {
        this.vertexShaderCode = vertexShaderCode!=null ? vertexShaderCode : vertexShaderText;
        this.fragmentShaderCode = fragmentShaderCode!=null ? fragmentShaderCode : fragmentShaderText; 
        this.debug = debug;
        this.gl=gl;
    };

    getCompiledShaders()
    {
        var vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
        var fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);

        this.gl.shaderSource(vertexShader,this.vertexShaderCode);
        this.gl.shaderSource(fragmentShader,this.fragmentShaderCode);

        this.gl.compileShader(vertexShader); //Compile vertex shader
        if(this.debug)
        {
            if(!this.gl.getShaderParameter(vertexShader, this.gl.COMPILE_STATUS))
            {
                console.error('ERROR COMPILING vertexSHADEr', this.gl.getShaderInfoLog(vertexShader));
                return;
            }
            console.log("vertexShader compiled!");
        }

        this.gl.compileShader(fragmentShader); // Compile fragment Shader
        if(this.debug)
        {
            if(!this.gl.getShaderParameter(fragmentShader, this.gl.COMPILE_STATUS))
            {
                console.error('ERROR COMPILING fragmentShader', this.gl.getShaderInfoLog(fragmentShader));
                return;
            }
            console.log("fragmentShader compiled!");
        }
        
        this.compiledShaders =  {
            "fragmentShader" : fragmentShader,
            "vertexShader" : vertexShader
        };
        return this.compiledShaders;
    }
}

//vec4( u_world * u_object * vec3(a_position, 1), 1);
var vertexShaderText = [
    "precision mediump float;",
    "",
    "attribute vec2 a_vertPosition;",
    "attribute vec3 a_vertColor;",
    "attribute vec2 a_vertTexCoord;",
    "",
    "uniform mat3 u_mWorld;",
    "uniform mat3 u_mView;",
    "uniform mat3 u_mProj;",
    "",
    "varying vec3 v_fragColor;",
    "varying vec2 v_te;",
    "varying vec2 v_fragTextCoord;",

    "void main()",
    "{",
      "   v_fragTextCoord = a_vertTexCoord;",
    "     gl_Position = vec4( u_mWorld * u_mView * vec3(a_vertPosition, 1.0), 1.0);",
    "}"
].join('\n');

var fragmentShaderText = [
    "precision mediump float;",
    "",
    "varying vec2 v_fragTextCoord;",
    "uniform sampler2D u_sampler;",
    "void main()",
    "{",
    "   gl_FragColor = texture2D(u_sampler,v_fragTextCoord);",
    "}"
].join('\n');
