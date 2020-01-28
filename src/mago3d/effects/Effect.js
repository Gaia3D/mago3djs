'use strict';

/**
 * @alias Effect
 * @class Effect
 */
var Effect = function(options) 
{
	if (!(this instanceof Effect)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	// Test class to do effects.
	this.effectsManager;
	this.birthData;
	this.durationSeconds;
	this.effectType = "unknown";
	
	if (options)
	{
		if (options.effectType)
		{ this.effectType = options.effectType; }
		
		if (options.durationSeconds)
		{ this.durationSeconds = options.durationSeconds; }
	}
	
	// available effectType:
	// 1: zBounce
};

/**
 *
 */
Effect.prototype.execute = function(currTimeSec)
{
	var effectFinished = false;
	if (this.birthData === undefined)
	{
		this.birthData = currTimeSec;
		return effectFinished;
	}
	
	if (this.effectType === "zBounce")
	{
		var timeDiffSeconds = (currTimeSec - this.birthData);
		var zScale = 1.0;
		var gl = this.effectsManager.gl;
		if (timeDiffSeconds >= this.durationSeconds)
		{
			zScale = 1.0;
			effectFinished = true; // if return true, then this effect is finished, so this effect will be deleted.
		}
		else
		{
			zScale = timeDiffSeconds /this.durationSeconds;
			
		}
		gl.uniform3fv(this.effectsManager.currShader.scaleLC_loc, [1.0, 1.0, zScale]); // init referencesMatrix.
		return effectFinished;
	}
};