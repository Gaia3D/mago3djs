'use strict';

/**
 * LightSource.
 * 
 * @class LightSource
 * @constructor 
 * @param {Number} lightType The name of the LightSource.
 */
var LightSource = function(lightType) 
{
	if (!(this instanceof LightSource)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	/**
	 * The name of this LightSource.
	 * @type {String}
	 * @default "noName"
	 */
	this.name;
	this.id;
	
	this.lightType = lightType; // omni = 0, spot = 1, directional = 2, area = 3, volume = 4.
	
	this.geoCoord;
	this.position;
	this.positionHIGH;
	this.positionLOW;
	this.tMatrix;
	this.tMatrixInv;
	this.depthFbo;
	this.bSphere;
	this.minDistToCam; // use only in directional lights.
	this.maxDistToCam; // use only in directional lights.
	
	// light is directionType, must have the rectangle size.
	
	
	//this.targetTextureWidth = new Int32Array([2048]);
	//this.targetTextureHeight = new Int32Array([2048]);
	
	this.targetTextureWidth = new Int32Array([4096]);
	this.targetTextureHeight = new Int32Array([4096]);
	
	//this.targetTextureWidth = new Int32Array([8192]);
	//this.targetTextureHeight = new Int32Array([8192]);
};

