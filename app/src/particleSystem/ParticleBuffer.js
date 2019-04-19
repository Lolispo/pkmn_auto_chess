import { Matrix3} from "./Matrix3.js";
import {ShaderProgram} from "./ShaderProgram.js";

var globalTexture = null;

export class ParticleBuffer
{
    constructor(gl,compiledShaders,worldSpaceMatrix,sprite,particle)
    {
        this.gl=gl;
        this.shaderProgram = new ShaderProgram(gl,compiledShaders);
        this.program = this.shaderProgram.program;
        this.worldSpaceMatrix = worldSpaceMatrix;
        this.particle=particle;
        this.isDisposed=false;
        this.sprite=sprite;

        this.size = 16;

        var quadVertices = 
        [
            -this.size ,  this.size ,    0, 1, 
            this.size ,  this.size ,    1, 1, 
            this.size , -this.size ,     1, 0,
            -this.size , -this.size ,     0, 0, 
        ]; 
        gl.useProgram(this.program);

        //this.createTexture();

        this.quadVertexBufferObject = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,this.quadVertexBufferObject);
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(quadVertices),gl.STATIC_DRAW);

        this.quadIndexBufferObject = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.quadIndexBufferObject);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(quadIndices), gl.STATIC_DRAW)

        this.positionAttribLocation = gl.getAttribLocation(this.program, 'a_vertPosition');
        this.texCoordAttribLocation = gl.getAttribLocation(this.program, 'a_vertTexCoord');
        gl.vertexAttribPointer(
            this.positionAttribLocation,
            2, //two number of elements per attribute
            gl.FLOAT,
            gl.FALSE,
            4 * Float32Array.BYTES_PER_ELEMENT,
            0
        );
        gl.vertexAttribPointer(
            this.texCoordAttribLocation,
            2, //two number of elements per attribute
            gl.FLOAT,
            gl.FALSE,
            4 * Float32Array.BYTES_PER_ELEMENT,
            2 *  Float32Array.BYTES_PER_ELEMENT
        );
        this.createTexture();


        gl.enableVertexAttribArray(this.positionAttribLocation);
        gl.enableVertexAttribArray(this.texCoordAttribLocation);

        //this.addIdentityMatrix("u_mWorld");
        window.worldMatrix = worldSpaceMatrix;
        this.addMatrix("u_mWorld",worldSpaceMatrix);
        this.addIdentityMatrix("u_mView");
        this.addIdentityMatrix("u_mProj");
    }

    createTexture()
    {
        this.spriteTexture = this.gl.createTexture();
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.spriteTexture);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE); //this.gl.mirror --> this.gl.CLAMP_TO_EDGE
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
		this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.sprite);
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    }

    dispose()
    {
        this.gl.deleteProgram(this.program);
        this.isDisposed=true;
    }

    addAttribute(name,elementCount)
    {

    }

    bindBuffer()
    {

    }

    setLocation(x,y)
    {
    }


    addMatrix(name,matrix)
    {
        var matUniformLocation = this.gl.getUniformLocation(this.program, name); //u_mWorld
        this[name] = matrix;
        this.gl.uniformMatrix3fv(matUniformLocation, this.gl.FALSE, matrix.getFloatArray());
    }

    setMatrix(name,matrix)
    {
        var matUniformLocation = this.gl.getUniformLocation(this.program, name); //u_mWorld
        this[name] = matrix;
        this.gl.uniformMatrix3fv(matUniformLocation, this.gl.FALSE, matrix.getFloatArray());
    }

    getMatrix(name)
    {
        return this[name];
    }

    addIdentityMatrix(name)
    {
        var matUniformLocation = this.gl.getUniformLocation(this.program, name); //u_mWorld
        var identityMatrix = new Matrix3();
        this[name] = identityMatrix;
        this.gl.uniformMatrix3fv(matUniformLocation, this.gl.FALSE, identityMatrix.getFloatArray());
    }


    render()
    {
        if(this.isDisposed==true)
        {
            return;
        }
        
        this.gl.useProgram(this.program);
        this.gl.enableVertexAttribArray(this.positionAttribLocation);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.quadVertexBufferObject);
        this.gl.vertexAttribPointer(
            this.positionAttribLocation,
            2, //two number of elements per attribute
            this.gl.FLOAT,
            this.gl.FALSE,
            4 * Float32Array.BYTES_PER_ELEMENT,
            0
        );

        this.gl.enableVertexAttribArray(this.texCoordAttribLocation);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER,this.quadIndexBufferObject);
        this.gl.vertexAttribPointer(
            this.texCoordAttribLocation,
            2, //two number of elements per attribute
            this.gl.FLOAT,
            this.gl.FALSE,
            4 * Float32Array.BYTES_PER_ELEMENT,
            2 *  Float32Array.BYTES_PER_ELEMENT
        );
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.spriteTexture );

        this.setMatrix("u_mWorld",this.worldSpaceMatrix);
        this.setMatrix("u_mView",new Matrix3().transition(this.particle.location.x,this.particle.location.y));
        this.gl.drawElements(this.gl.TRIANGLES, quadIndices.length, this.gl.UNSIGNED_SHORT, 0);
        this.gl.useProgram(null);
    }
}

var quadIndices = [3,2,1,3,1,0];