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
	// 1: zBounceLinear
	// 2: zBounceSpring
	// 3: borningLight
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
	
	var timeDiffSeconds = (currTimeSec - this.birthData);
	var gl = this.effectsManager.gl;
	
	if (this.effectType === "zBounceSpring")
	{
		var zScale = 1.0;
		if (timeDiffSeconds >= this.durationSeconds)
		{
			zScale = 1.0;
			effectFinished = true; // if return true, then this effect is finished, so this effect will be deleted.
		}
		else
		{
			//https://en.wikipedia.org/wiki/Damped_sine_wave
			var amp = 1.0;
			var lambda = 0.1; // is the decay constant, in the reciprocal of the time units of the X axis.
			var w = 5/this.durationSeconds; // angular frequency.
			var t = timeDiffSeconds;
			var fita = 0.0; // initial angle in t=0.
			zScale = amp*Math.pow(Math.E, -lambda*t)*(Math.cos(w*t+fita) + Math.sin(w*t+fita));
			zScale = (1.0-zScale)*Math.log(t/this.durationSeconds+1.1);
		}
		gl.uniform3fv(this.effectsManager.currShader.scaleLC_loc, [1.0, 1.0, zScale]); // init referencesMatrix.
		return effectFinished;
	}
	else if (this.effectType === "zBounceLinear")
	{
		var zScale = 1.0;
		if (timeDiffSeconds >= this.durationSeconds)
		{
			zScale = 1.0;
			effectFinished = true; // if return true, then this effect is finished, so this effect will be deleted.
		}
		else
		{
			zScale = timeDiffSeconds/this.durationSeconds;
		}
		gl.uniform3fv(this.effectsManager.currShader.scaleLC_loc, [1.0, 1.0, zScale]); // init referencesMatrix.
		return effectFinished;
	}
	else if (this.effectType === "borningLight")
	{
		var colorMultiplier = 1.0;
		if (timeDiffSeconds >= this.durationSeconds)
		{
			colorMultiplier = 1.0;
			effectFinished = true; // if return true, then this effect is finished, so this effect will be deleted.
		}
		else
		{
			var timeRatio = timeDiffSeconds/this.durationSeconds;
			colorMultiplier = 1/(timeRatio*timeRatio);
		}
		gl.uniform4fv(this.effectsManager.currShader.colorMultiplier_loc, [colorMultiplier, colorMultiplier, colorMultiplier, 1.0]);
		return effectFinished;
	}
};






























