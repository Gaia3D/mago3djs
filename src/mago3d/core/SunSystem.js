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
	
};

SunSystem.prototype.getLight = function(idx) 
{
	if (this.lightSourcesArray === undefined)
	{ return undefined; }
	
	return this.lightSourcesArray[idx];
};

SunSystem.prototype.updateSun = function(magoManager) 
{
	if (this.lightSourcesArray === undefined)
	{ return; }

	if (magoManager.frustumVolumeControl === undefined)
	{ return; }
	
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
	var bSphere = visibleNodes.bSphere;
	if (bSphere === undefined)
	{ return; }
	
	
	var lightsCount = this.lightSourcesArray.length;
	for (var i=0; i<lightsCount; i++)
	{
		var light = this.lightSourcesArray[i];
		light.lightPosWC = bSphere.centerPoint;
		light.directionalBoxWidth = bSphere.r*2;
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



















