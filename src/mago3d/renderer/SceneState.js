'use strict';

/**
 * This class contains the camera transformation matrices and other parameters that affects the scene.
 * @class SceneState
 */
var SceneState = function() 
{
	if (!(this instanceof SceneState)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.gl;

	// this contains the model matrices and camera position.
	this.modelMatrix = new Matrix4(); // created as identity matrix.
	this.viewMatrix = new Matrix4(); // created as identity matrix.
	this.modelViewProjRelToEyeMatrix = new Matrix4(); // created as identity matrix.
	this.modelViewRelToEyeMatrix = new Matrix4(); // created as identity matrix.
	this.modelViewRelToEyeMatrixInv = new Matrix4(); // created as identity matrix.
	this.modelViewMatrix = new Matrix4(); // created as identity matrix.
	this.modelViewMatrixInv = new Matrix4(); // created as identity matrix.
	this.projectionMatrix = new Matrix4(); // created as identity matrix.
	this.projectionMatrixInv = new Matrix4(); // created as identity matrix.
	this.modelViewProjMatrix = new Matrix4(); // created as identity matrix.
	this.modelViewProjMatrixInv; // initially undefined.
	this.normalMatrix4 = new Matrix4(); // created as identity matrix.
	this.identityMatrix4 = new Matrix4(); // created as identity matrix.
	this.modelViewMatrixLast = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // Number array.
	this.projectionMatrixLast = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // Number array.
	
	// Matrices for sky rendering (large far).
	this.projectionMatrixSky = new Matrix4(); // created as identity matrix.
	this.modelViewProjRelToEyeMatrixSky = new Matrix4(); // created as identity matrix.

	this.encodedCamPosHigh = new Float32Array([0.0, 0.0, 0.0]);
	this.encodedCamPosLow = new Float32Array([0.0, 0.0, 0.0]);
	
	this.camera = new Camera();
	this.drawingBufferWidth = new Int32Array([1000]);
	this.drawingBufferHeight = new Int32Array([1000]);
	this.mouseAction = new MouseAction();
	
	// Sun.***
	// omni = 0, spot = 1, directional = 2, area = 3, volume = 4.
	var lightType = 2;
	this.sunLight = new LightSource(lightType); // OLD.***
	this.sunSystem = new SunSystem();
	this.applySunShadows = false;
	
	// lighting & ssao.
	this.ambientReflectionCoef = new Float32Array([0.5]); // 0.7.
	this.diffuseReflectionCoef = new Float32Array([1.0]); // 0.4
	this.specularReflectionCoef = new Float32Array([0.6]); // 0.6
	this.specularColor = new Float32Array([0.7, 0.7, 0.7]);
	this.ambientColor = new Float32Array([1.0, 1.0, 1.0]);
	this.ssaoRadius = new Float32Array([0.15]);
	this.shininessValue = new Float32Array([40.0]);
	this.ssaoNoiseScale2 = new Float32Array([1.0, 1.0]); // [this.depthFboNeo.width[0]/this.noiseTexture.width, this.depthFboNeo.height[0]/this.noiseTexture.height]
	this.ssaoKernel16 = new Float32Array([ 0.33, 0.0, 0.85,
		0.25, 0.3, 0.5,
		0.1, 0.3, 0.85,
		-0.15, 0.2, 0.85,
		-0.33, 0.05, 0.6,
		-0.1, -0.15, 0.85,
		-0.05, -0.32, 0.25,
		0.2, -0.15, 0.85,
		0.6, 0.0, 0.55,
		0.5, 0.6, 0.45,
		-0.01, 0.7, 0.35,
		-0.33, 0.5, 0.45,
		-0.45, 0.0, 0.55,
		-0.65, -0.5, 0.7,
		0.0, -0.5, 0.55,
		0.33, 0.3, 0.35]);
	/*
	var hAux = 1.0;
	this.ssaoKernel16 = new Float32Array([ 0.33, 0.0, hAux,
		0.25, 0.3, hAux,
		0.1, 0.3, hAux,
		-0.15, 0.2, hAux,
		-0.33, 0.05, hAux,
		-0.1, -0.15, hAux,
		-0.05, -0.32, hAux,
		0.2, -0.15, hAux,
		0.6, 0.0, hAux,
		0.5, 0.6, hAux,
		-0.01, 0.7, hAux,
		-0.33, 0.5, hAux,
		-0.45, 0.0, hAux,
		-0.65, -0.5, hAux,
		0.0, -0.5, hAux,
		0.33, 0.3, hAux]);
		*/
		
	this.ssaoSphereKernel32 = new Float32Array([ 0.33, 0.0, 0.85,
		0.25, 0.3, 0.5,
		0.1, 0.3, 0.85,
		-0.15, 0.2, 0.85,
		-0.33, 0.05, 0.6,
		-0.1, -0.15, 0.85,
		-0.05, -0.32, 0.25,
		0.2, -0.15, 0.85,
		0.6, 0.0, 0.55,
		0.5, 0.6, 0.45,
		-0.01, 0.7, 0.35,
		-0.33, 0.5, 0.45,
		-0.45, 0.0, 0.55,
		-0.65, -0.5, 0.7,
		0.0, -0.5, 0.55,
		0.33, 0.3, 0.35,
		
		 0.33, 0.0, -0.85,
		0.25, 0.3, -0.5,
		0.1, 0.3, -0.85,
		-0.15, 0.2, -0.85,
		-0.33, 0.05, -0.6,
		-0.1, -0.15, -0.85,
		-0.05, -0.32, -0.25,
		0.2, -0.15, -0.85,
		0.6, 0.0, -0.55,
		0.5, 0.6, -0.45,
		-0.01, 0.7, -0.35,
		-0.33, 0.5, -0.45,
		-0.45, 0.0, -0.55,
		-0.65, -0.5, -0.7,
		0.0, -0.5, -0.55,
		0.33, 0.3, -0.35]);
		
	this.bMust = false;
	
	// webWorldWind vars.
	this.dc;
	
	// insertIssue states.
	this.insertIssueState = 0; // 0 = no started. 1 = started.
	
	// provisionally.
	this.textureFlipYAxis = false;
	
	// mouse.
	this.mouseButton = -1;
	
	// some stadistics.
	this.trianglesRenderedCount = 0;
	this.pointsRenderedCount = 0;
	this.fps = 0.0;

	//mago earth 사용 시 초기 scene 세팅
	if (MagoConfig.getPolicy().basicGlobe !== 'cesium') 
	{
		this.initMagoSceneState();
	}
};
/**
 * mago earth 사용 시 초기 scene 세팅
 */
SceneState.prototype.initMagoSceneState = function() 
{
	var containerDiv = document.getElementById(MagoConfig.getContainerId());
	if (!containerDiv) 
	{
		throw new Error('container is empty.');
	}
	var canvas = document.createElement('canvas');
	canvas.style.width = '100%';
	canvas.style.height = '100%';
	containerDiv.appendChild(canvas);
	var glAttrs = {antialias          : true, 
		stencil            : true,
		premultipliedAlpha : false};
	var gl = canvas.getContext("webgl", glAttrs);
	if (!gl)
	{ gl = canvas.getContext("experimental-webgl", glAttrs); }
    
	// Problem: canvas-width initially is 300 and canvas-height = 150.***
	canvas.width = canvas.clientWidth;
	canvas.height = canvas.clientHeight;

	this.canvas = canvas;
	this.textureFlipYAxis = true;
	this.gl = gl;
	this.drawingBufferWidth[0] = canvas.clientWidth;
	this.drawingBufferHeight[0] = canvas.clientHeight;
	this.camera.frustum.aspectRatio[0] = canvas.clientWidth/canvas.clientHeight;
	this.camera.frustum.fovRad[0] = Math.PI/3*1.8;
	this.camera.frustum.fovyRad[0] = this.camera.frustum.fovRad[0]/this.camera.frustum.aspectRatio;
	this.camera.frustum.tangentOfHalfFovy[0] = Math.tan(this.camera.frustum.fovyRad[0]/2);
    
	// initial camera position.***
	this.camera.position.set(-7586937.743019165, 10881859.054284709, 5648264.99911627);
	this.camera.direction.set(0.5307589970384617, -0.7598419113077192, -0.3754132585133587);
	this.camera.up.set(0.23477224008249162, -0.29380469331271475, 0.9265855321012102);
    
	// test init camera position.***
	//sphere.r = 6378137.0;
	this.encodedCamPosHigh[0] = -7536640;
	this.encodedCamPosHigh[1] = 10878976;
	this.encodedCamPosHigh[2] = 5636096;
    
	this.encodedCamPosLow[0] = -50297.7421875;
	this.encodedCamPosLow[1] = 2883.05419921875;
	this.encodedCamPosLow[2] = 12168.9990234375;
};

/**
 */
SceneState.prototype.resetStadistics = function() 
{
	this.trianglesRenderedCount = 0;
	this.pointsRenderedCount = 0;
	this.fps = 0.0;
};

/**
 */
SceneState.prototype.restoreDefaultValuesAmbientDiffuseSpecularCoeficients = function() 
{
	this.ambientReflectionCoef[0] = 0.7; 
	this.diffuseReflectionCoef[0] = 0.40; 
	this.specularReflectionCoef[0] = 0.6; 
};

/**
 * Returns the modelViewMatrixInverse.
 * @returns {Matrix4} modelViewMatrixInv.
 */
SceneState.prototype.getModelViewMatrixInv = function() 
{
	return this.modelViewMatrixInv;
};

/**
 * Returns the modelViewMatrixInverse.
 * @returns {Matrix4} modelViewMatrixInv.
 */
SceneState.prototype.getProjectionMatrixInv = function() 
{
	if (this.projectionMatrixInv === undefined)
	{
		this.projectionMatrixInv = new Matrix4();
		this.projectionMatrixInv._floatArrays = glMatrix.mat4.invert(this.projectionMatrixInv._floatArrays, this.projectionMatrix._floatArrays);
	}
	return this.projectionMatrixInv;
};

/**
 * Returns the modelViewMatrixInverse.
 * @returns {Matrix4} modelViewMatrixInv.
 */
SceneState.prototype.getModelViewProjectionMatrixInv = function() 
{
	if (this.modelViewProjMatrixInv === undefined)
	{
		this.modelViewProjMatrixInv = new Matrix4();
		this.modelViewProjMatrixInv._floatArrays = glMatrix.mat4.invert(this.modelViewProjMatrixInv._floatArrays, this.modelViewProjMatrix._floatArrays);
	}
	return this.modelViewProjMatrixInv;
};

/**
 * Returns the modelViewMatrixInverse.
 * @returns {Matrix4} modelViewMatrixInv.
 */
SceneState.prototype.getModelViewRelToEyeMatrixInv = function() 
{
	if (this.modelViewRelToEyeMatrixInv === undefined)
	{
		this.modelViewRelToEyeMatrixInv = new Matrix4();
		this.modelViewRelToEyeMatrixInv._floatArrays = glMatrix.mat4.invert(this.modelViewRelToEyeMatrixInv._floatArrays, this.modelViewRelToEyeMatrix._floatArrays);
	}
	return this.modelViewRelToEyeMatrixInv;
};

/**
 * Returns the camera.
 */
SceneState.prototype.getCamera = function() 
{
	return this.camera;
};

/**
 * Returns the camera.
 */
SceneState.prototype.setApplySunShadows = function(bApplySunShadows) 
{
	this.applySunShadows = bApplySunShadows;
};
































