'use strict';

/**
 * SunSystem.
 * 
 * @class SunSystem
 * @constructor 
 */
var SunSystem = function(options) 
{
	if (!(this instanceof SunSystem)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.sunGeoLocDataManager = new GeoLocationDataManager();
	this.lightSourcesArray;
	this.date; // month, day, hour, min, sec.
	
	if (options !== undefined)
	{
		// todo:
	}
	
	// create the initial position of the sun.
	var geoLocData = this.sunGeoLocDataManager.newGeoLocationData("sunPosition");
	var lon = 115.31586919332165;
	var lat = 10.0;
	var alt = 0.0;
	geoLocData = ManagerUtils.calculateGeoLocationData(lon, lat, alt, undefined, undefined, undefined, geoLocData);
	
	this.init();
};

SunSystem.prototype.init = function() 
{
	if (this.lightSourcesArray === undefined)
	{ this.lightSourcesArray = []; }
	
	// provisionally create 3 lightSources.
	// 1rst light.
	var lightType = 2; // omni = 0, spot = 1, directional = 2, area = 3, volume = 4.
	var light = new LightSource(lightType);
	light.directionalBoxWidth = 400.0;
	light.geoCoord = new GeographicCoord(126.61255088096084, 37.58071053758259, 50);
	this.lightSourcesArray.push(light);
	
	// 2nd light.
	lightType = 2; // omni = 0, spot = 1, directional = 2, area = 3, volume = 4.
	light = new LightSource(lightType);
	light.directionalBoxWidth = 400.0;
	light.geoCoord = new GeographicCoord(126.61255088096084, 37.58071053758259, 50);
	this.lightSourcesArray.push(light);
};

SunSystem.prototype.getLight = function(idx) 
{
	if (this.lightSourcesArray === undefined)
	{ return undefined; }
	
	return this.lightSourcesArray[idx];
};

SunSystem.prototype.getLightsMatrixFloat32Array = function() 
{
	var lightsCount = this.lightSourcesArray.length;
	
	if (this.lightMatrixFloat32Array === undefined)
	{ this.lightMatrixFloat32Array = new Float32Array(16*lightsCount); }
	
	for (var i=0; i<lightsCount; i++)
	{
		var light = this.getLight(i);
		var lightMat = light.tMatrix;
		if (lightMat === undefined)
		{ continue; }
		
		for (var j=0; j<16; j++)
		{
			this.lightMatrixFloat32Array[j + 16*i] = lightMat._floatArrays[j];
		}
	}
	
	return this.lightMatrixFloat32Array;
};

SunSystem.prototype.getLightsPosLOWFloat32Array = function() 
{
	var lightsCount = this.lightSourcesArray.length;
	
	if (this.lightPosLOWFloat32Array === undefined)
	{ this.lightPosLOWFloat32Array = new Float32Array(3*lightsCount); }
	
	for (var i=0; i<lightsCount; i++)
	{
		var light = this.getLight(i);
		var lightPosLOW = light.positionLOW;
		if (lightPosLOW === undefined)
		{ continue; }
		for (var j=0; j<3; j++)
		{
			this.lightPosLOWFloat32Array[j + 3*i] = lightPosLOW[j];
		}
	}
	
	return this.lightPosLOWFloat32Array;
};

SunSystem.prototype.getLightsPosHIGHFloat32Array = function() 
{
	var lightsCount = this.lightSourcesArray.length;
	
	if (this.lightPosHIGHFloat32Array === undefined)
	{ this.lightPosHIGHFloat32Array = new Float32Array(3*lightsCount); }
	
	for (var i=0; i<lightsCount; i++)
	{
		var light = this.getLight(i);
		var lightPosHIGH = light.positionHIGH;
		if (lightPosHIGH === undefined)
		{ continue; }
		for (var j=0; j<3; j++)
		{
			this.lightPosHIGHFloat32Array[j + 3*i] = lightPosHIGH[j];
		}
	}
	
	return this.lightPosHIGHFloat32Array;
};

SunSystem.prototype.updateSun = function(magoManager, options) 
{
	if (this.lightSourcesArray === undefined)
	{ return; }

	if (magoManager.frustumVolumeControl === undefined)
	{ return; }

	//var date = new Date();
	
	if (options)
	{
		if (options.date)
		{
			//
		}
	}
	
	var camera = magoManager.sceneState.getCamera();
	var camPos = camera.position;
	var camDir = camera.getDirection();
	
	// Find the 3 locations of the lights for lod0, lod1, lod2.
	// provisionally assign arbitrary values.
	var dist0 = 50.0; // 50m.
	var dist1 = 300.0;
	var dist2 = 1000.0;
	
	// calculate the parameters of the light.
	var frustumVolumenObject = magoManager.frustumVolumeControl.getFrustumVolumeCulling(0); 
	var visibleNodes = frustumVolumenObject.visibleNodes; // class: VisibleObjectsController.
	
	if (!visibleNodes.hasRenderables())
	{ return; }
	
	var bSphere = visibleNodes.bSphere;
	if (bSphere === undefined)
	{ return; }
	
	// Test. Make a frustum fitted newBSphere in the same distance of the bSphere.
	
	var frustum = camera.getFrustum(0);
	var tangentOfHalfFovy = frustum.tangentOfHalfFovy;
	var dist = camPos.distToPoint(bSphere.centerPoint);
	var minDist = dist - bSphere.r;
	var maxDist = dist + bSphere.r;
	
	
	var newRadius = Math.abs(tangentOfHalfFovy*dist)*4.0;
	var newPoint = new Point3D(camPos.x + camDir.x * dist, camPos.y + camDir.y * dist, camPos.z + camDir.z * dist);
	
	bSphere.setCenterPoint(newPoint.x, newPoint.y, newPoint.z);
	bSphere.setRadius(newRadius);
	
	var lightsCount = this.lightSourcesArray.length;
	for (var i=0; i<lightsCount; i++)
	{
		var light = this.lightSourcesArray[i];
		light.lightPosWC = bSphere.centerPoint;
		light.directionalBoxWidth = bSphere.r*4.0;
		this.updateLight(light);
	}
};

/**
 * This function renders the sunPointOfView depth.
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 * @param {VisibleObjectsController} visibleObjControlerNodes This object contains visible objects for the camera frustum.
 */
SunSystem.prototype.updateLight = function(light) 
{
	var sunGeoLocData = this.sunGeoLocDataManager.getCurrentGeoLocationData();
	var sunTMatrix = sunGeoLocData.rotMatrix;
	
	if (light.tMatrix === undefined)
	{ light.tMatrix = new Matrix4(); }

	// calculate sunTransformMatrix for this light.***
	var lightPosWC = light.lightPosWC;
	
	var ortho = new Matrix4();
	var nRange = light.directionalBoxWidth/2;
	var left = -nRange, right = nRange, bottom = -nRange, top = nRange, near = -10*nRange, far = 10*nRange;
	ortho._floatArrays = glMatrix.mat4.ortho(ortho._floatArrays, left, right, bottom, top, near, far);
	
	light.tMatrix = sunTMatrix.getMultipliedByMatrix(ortho, light.tMatrix);

	if (light.positionHIGH === undefined)
	{ light.positionHIGH = new Float32Array([0.0, 0.0, 0.0]); } 
	
	if (light.positionLOW === undefined)
	{ light.positionLOW = new Float32Array([0.0, 0.0, 0.0]); } 
	
	ManagerUtils.calculateSplited3fv([lightPosWC.x, lightPosWC.y, lightPosWC.z], light.positionHIGH, light.positionLOW);
};



















