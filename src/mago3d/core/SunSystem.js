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
	this.sunDirWC;
	
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
	
	var sunRotMat = geoLocData.rotMatrix;
	this.sunDirWC = new Float32Array([-sunRotMat._floatArrays[8], -sunRotMat._floatArrays[9], -sunRotMat._floatArrays[10]]);
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

SunSystem.prototype.getSunDirWC = function() 
{
	return this.sunDirWC;
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

SunSystem.prototype.calculateSunGeographicCoords = function() 
{
	//https://in-the-sky.org/twilightmap.php // web page. sun in current time.
	//----------------------------------------------
	//https://en.wikipedia.org/wiki/Position_of_the_Sun
	//https://www.nrel.gov/docs/fy08osti/34302.pdf
	//https://forum.logicmachine.net/showthread.php?tid=161
	
	//https://astronomy.stackexchange.com/questions/20560/how-to-calculate-the-position-of-the-sun-in-long-lat
	// The boilerplate: fiddling with dates
	var radToDeg = 180/Math.PI;
	var date = new Date();
	
	// test setting hour.
	date.setHours(11);
	date.setMinutes(30);
	
	var fullYear = date.getFullYear();
	var soy = (new Date(date.getFullYear(), 0, 0)).getTime();
	var eoy = (new Date(date.getFullYear() + 1, 0, 0)).getTime();
	var nows = date.getTime();
	var poy = (nows - soy) / (eoy - soy);

	var secs = date.getUTCMilliseconds() / 1e3
                + date.getUTCSeconds()
                + 60 * (date.getUTCMinutes() + 60 * date.getUTCHours());
	var pod = secs / 86400; // leap secs? nah.

	// The actual magic
	var lon = (-pod + 0.5) * Math.PI * 2;
	lon = lon*radToDeg;
	var lat = Math.sin((poy - .22) * Math.PI * 2) * .41;
	lat = lat*radToDeg;
	var alt = 0.0;
	
	// Now, calculate the sun geoLocationData & sun direction world coord.
	var geoLocData = this.sunGeoLocDataManager.getCurrentGeoLocationData();
	geoLocData = ManagerUtils.calculateGeoLocationData(lon, lat, alt, undefined, undefined, undefined, geoLocData);
	
	var sunRotMat = geoLocData.rotMatrix;
	this.sunDirWC = new Float32Array([-sunRotMat._floatArrays[8], -sunRotMat._floatArrays[9], -sunRotMat._floatArrays[10]]);
};


SunSystem.prototype.updateSun = function(magoManager, options) 
{
	// test.
	this.calculateSunGeographicCoords(); // test.***
	// end test.---
	
	if (this.lightSourcesArray === undefined)
	{ return; }

	if (magoManager.frustumVolumeControl === undefined)
	{ return; }

	//var date = new Date();
	
	if (options)
	{
		if (options.date)
		{
			// earthAxis inclination = 23.439281 degree.
			// December solstice -> March equinox (Friday, 20 March 2020, 03:49 UTC) -> June solstice -> September equinox.
			
		}
	}
	
	var camera = magoManager.sceneState.getCamera();
	var camPos = camera.position;
	var camDir = camera.getDirection();

	
	// calculate the parameters of the light.
	var frustumVolumenObject = magoManager.frustumVolumeControl.getFrustumVolumeCulling(0); 
	var visibleNodes = frustumVolumenObject.visibleNodes; // class: VisibleObjectsController.
	
	if (!visibleNodes.hasRenderables())
	{ return; }

	var bFrustumNear = visibleNodes.bFrustumNear;
	var bFrustumFar = visibleNodes.bFrustumFar;
	
	var frustum = camera.getFrustum(0);
	var tangentOfHalfFovy = frustum.tangentOfHalfFovy;
	
	var minDist = bFrustumNear;
	if (minDist < 0.0)
	{ minDist = 0.0; }
	var maxDist = bFrustumFar;
	var distRange = maxDist - minDist;
	
	// light 0 (nearest).
	//var dist0 = minDist + distRange * 0.20;
	var dist0 = minDist + distRange * 0.60;
	if (dist0 < 1.0){ dist0 = 1.0; }
	
	var newRadius = Math.abs(tangentOfHalfFovy*dist0)*4.0;
	var newPoint = new Point3D(camPos.x + camDir.x * dist0, camPos.y + camDir.y * dist0, camPos.z + camDir.z * dist0);
	var bSphere0 = new BoundingSphere(newPoint.x, newPoint.y, newPoint.z, newRadius);
	var light = this.lightSourcesArray[0];
	light.lightPosWC = bSphere0.centerPoint;
	light.directionalBoxWidth = bSphere0.r*2;
	this.updateLight(light);
	
	// light 1 (farest).
	//var dist1 = minDist + distRange * 0.70;
	var dist1 = minDist + distRange * 0.60;
	if (dist1 < 10.0){ dist1 = 10.0; }
	var newRadius = Math.abs(tangentOfHalfFovy*dist1)*4.0;
	var newPoint = new Point3D(camPos.x + camDir.x * dist1, camPos.y + camDir.y * dist1, camPos.z + camDir.z * dist1);
	var bSphere1 = new BoundingSphere(newPoint.x, newPoint.y, newPoint.z, newRadius);
	var light = this.lightSourcesArray[1];
	light.lightPosWC = bSphere1.centerPoint;
	light.directionalBoxWidth = bSphere1.r*2;
	this.updateLight(light);
		
};

/**
 * This function renders the sunPointOfView depth.
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 * @param {VisibleObjectsController} visibleObjControlerNodes This object contains visible objects for the camera frustum.
 */
SunSystem.prototype.updateLight = function(light) 
{
	var sunGeoLocData = this.sunGeoLocDataManager.getCurrentGeoLocationData();
	//var sunTMatrix = sunGeoLocData.rotMatrix;
	var sunTMatrix = sunGeoLocData.getRotMatrixInv();
	if (light.tMatrix === undefined)
	{ light.tMatrix = new Matrix4(); }

	// calculate sunTransformMatrix for this light.***
	var lightPosWC = light.lightPosWC;
	var depthFactor = 10.0;
	var ortho = new Matrix4();
	var nRange = light.directionalBoxWidth/2;
	var left = -nRange, right = nRange, bottom = -nRange, top = nRange, near = -depthFactor*nRange, far = depthFactor*nRange;
	ortho._floatArrays = glMatrix.mat4.ortho(ortho._floatArrays, left, right, bottom, top, near, far);
	
	light.tMatrix = sunTMatrix.getMultipliedByMatrix(ortho, light.tMatrix);

	if (light.positionHIGH === undefined)
	{ light.positionHIGH = new Float32Array([0.0, 0.0, 0.0]); } 
	
	if (light.positionLOW === undefined)
	{ light.positionLOW = new Float32Array([0.0, 0.0, 0.0]); } 
	
	ManagerUtils.calculateSplited3fv([lightPosWC.x, lightPosWC.y, lightPosWC.z], light.positionHIGH, light.positionLOW);
};



















