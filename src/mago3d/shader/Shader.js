'use strict';
/**
 * 조명 입력 및 재질 구성을 기반으로 렌더링 된 각 픽셀의 색상을 계산하기위한 수학적 계산 및 알고리즘을 포함하는 작은 스크립트
 * @class Shader
 */
var Shader = function() 
{
	if (!(this instanceof Shader)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.shader_name;
	this.shader_vertex_source;
	this.shader_fragment_source;
	this.SHADER_PROGRAM;

	this.shader_vertex;
	this.shader_fragment;

	this._ModelViewProjectionMatrixRelToEye;
	this._RefTransfMatrix;
	this._NormalMatrix;

	this._encodedCamPosHIGH;
	this._encodedCamPosLOW;
	this._BuildingPosHIGH;
	this._BuildingPosLOW;
	this._lightDirection;

	this._color;
	this._position;
	this._texcoord;
	this._normal;

	// test.
	this.samplerUniform;
};

Shader.createProgram = function(gl, vertexSource, fragmentSource) 
{
	// static function.
	var program = gl.createProgram();

	var vertexShader = Shader.createShader(gl, gl.VERTEX_SHADER, vertexSource);
	var fragmentShader = Shader.createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);

	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) 
	{
		throw new Error(gl.getProgramInfoLog(program));
	}

	var wrapper = {program: program};

	var numAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
	for (var i = 0; i < numAttributes; i++) 
	{
		var attribute = gl.getActiveAttrib(program, i);
		wrapper[attribute.name] = gl.getAttribLocation(program, attribute.name);
	}
	var numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
	for (var i = 0; i < numUniforms; i++) 
	{
		var uniform = gl.getActiveUniform(program, i);
		wrapper[uniform.name] = gl.getUniformLocation(program, uniform.name);
	}

	return wrapper;
};

Shader.createShader = function(gl, type, source) 
{
	var shader = gl.createShader(type);
	gl.shaderSource(shader, source);

	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) 
	{
		throw new Error(gl.getShaderInfoLog(shader));
	}

	return shader;
};
