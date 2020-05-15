'use strict';

/**
 * This class contains rendering settings.
 * @class RenderingSettings
 * @constructor
 */
var RenderingSettings = function() 
{
	if (!(this instanceof RenderingSettings)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	/**
	 * Boolean parameter that indicates if apply screen space ambient occlusion when render.
	 * @type {Boolean}
	 * @default true
	 */
	this._bApplySsao = true;
	
	/**
	 * Boolean parameter that indicates if apply color ramp in pointsCloud.
	 * @type {Boolean}
	 * @default false
	 */
	this._bPointsCloudInColorRamp = false;
};

/**
 * Returns the _bApplySsao variable.
 * @return {Boolean} this._bApplySsao
 */
RenderingSettings.prototype.getApplySsao = function()
{
	return this._bApplySsao;
};

/**
 * Sets the _bApplySsao variable.
 * @param {Boolean} bApplySsao
 */
RenderingSettings.prototype.setApplySsao = function(bApplySsao)
{
	this._bApplySsao = bApplySsao;
};

/**
 * Returns the _PointsCloudInColorRamp variable.
 * @return {Boolean} this._PointsCloudInColorRamp
 */
RenderingSettings.prototype.getPointsCloudInColorRamp = function()
{
	return this._bPointsCloudInColorRamp;
};

/**
 * Sets the _bPointsCloudInColorRamp variable.
 * @param {Boolean} bPointsCloudInColorRamp
 */
RenderingSettings.prototype.setPointsCloudInColorRamp = function(bPointsCloudInColorRamp)
{
	this._bPointsCloudInColorRamp = bPointsCloudInColorRamp;
};