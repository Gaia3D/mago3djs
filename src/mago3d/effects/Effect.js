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
	
		if (options.zVelocity)
		{ this.zVelocity = options.zVelocity; }
	
		if (options.zMax)
		{ this.zMax = options.zMax; }
		
		if (options.zMin)
		{ this.zMin = options.zMin; }
	
	}
	
	// available effectType:
	// 1: zBounceLinear
	// 2: zBounceSpring
	// 3: borningLight
	// 4: zMovement
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
	else if (this.effectType === "zMovement")
	{
		if (this.zVelocity === undefined)
		{ this.zVelocity = 1.0; }

		if (this.zMax === undefined)
		{ this.zMax = 1.0; }

		if (this.zMin === undefined)
		{ this.zMin = -1.0; }

		if (this.zOffset === undefined)
		{ this.zOffset = 0.0; }

		if (this.lastTime === undefined)
		{ this.lastTime = currTimeSec; }


		if (timeDiffSeconds >= this.durationSeconds)
		{
			this.zOffset = 0.0;
			effectFinished = true; // if return true, then this effect is finished, so this effect will be deleted.
		}
		else
		{
			var diffTime = currTimeSec - this.lastTime;
			this.zOffset += this.zVelocity * diffTime;

			if (this.zVelocity > 0.0)
			{
				if (this.zOffset > this.zMax)
				{
					var diff = (this.zOffset - this.zMax);
					this.zOffset = this.zMax - diff;
					this.zVelocity *= -1.0;
				}
			}
			else
			{
				if (this.zOffset < this.zMin)
				{
					var diff = (this.zOffset - this.zMin);
					this.zOffset = this.zMin - diff;
					this.zVelocity *= -1.0;
				}
			}
		}
		gl.uniform3fv(this.effectsManager.currShader.aditionalOffset_loc, [0.0, this.zOffset, 0.0 ]); // init referencesMatrix.
		this.lastTime = currTimeSec;
		return effectFinished;
	}
};