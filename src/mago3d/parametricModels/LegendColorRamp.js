'use strict';

/**
 * LegendColorRamp. This is a screenSpace object.
 * @class LegendColorRamp
 */
var LegendColorRamp = function(options) 
{
	if (!(this instanceof LegendColorRamp)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
    
    options = options? options : {};

	this.width = options.width;
    this.height = options.height;
    this.position; // screenSpacePosition.***
    this.minValue = options.minValue;
    this.maxValue = options.maxValue;
    this.colorRampType = options.colorRampType; // for example RGBCMY

	this.geoLocDataManager;
    this.vboKeysContainer;
    this.dirty = true;
};

/**
 * Makes the mesh.***
 * @param {MagoManager} magoManager
 */
LegendColorRamp.prototype.makeMesh = function(magoManager)
{
    // Make a rectangle.***
    if(!this.vboKeysContainer)
    this.vboKeysContainer = new VBOVertexIdxCacheKeysContainer();

    var posDataArray = new Float32Array([0, 0,   this.width, 0,   0, this.height,   0, this.height,   this.width, 0,   this.width, this.height]);
	var vboCacheKey = this.vboKeysContainer.newVBOVertexIdxCacheKey();
	var dimensions = 2;
    vboCacheKey.setDataArrayPos(posDataArray, vboMemManager, dimensions);
    
    this.dirty = false;
};

/**
 * Renders the legend.***
 * @param {MagoManager} magoManager
 */
LegendColorRamp.prototype.render = function(magoManager)
{
    if(this.dirty)
    this.makeMesh(magoManager);

    var shader = magoManager.postFxShadersManager.getShader("modelRefDepth"); 

};

