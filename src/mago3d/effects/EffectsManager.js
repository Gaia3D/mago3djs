'use strict';

/**
 * @alias EffectsManager
 * @class EffectsManager
 */
var EffectsManager = function(options) 
{
	if (!(this instanceof EffectsManager)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.effectsObjectsMap = {};
	this.gl;
	this.currShader;
};

/**
 *
 */
EffectsManager.prototype.setCurrentShader = function(shader)
{
	this.currShader = shader;
};

/**
 *
 */
EffectsManager.prototype.getEffectsObject = function(id)
{
	return this.effectsObjectsMap[id];
};

EffectsManager.prototype.hasEffects = function(id) 
{
	
	if (!this.effectsObjectsMap[id]) 
	{
		return false;
	}

	if (!this.effectsObjectsMap[id].effectsArray || this.effectsObjectsMap[id].effectsArray.length === 0)
	{
		return false;
	}

	return true;
};


/**
 *
 */
EffectsManager.prototype.addEffect = function(id, effect)
{
	var effectsObject = this.getEffectsObject(id);
	
	if (effectsObject === undefined)
	{
		effectsObject = {};
		this.effectsObjectsMap[id] = effectsObject;
	}
	
	if (effectsObject.effectsArray === undefined)
	{ effectsObject.effectsArray = []; }
	
	effect.effectsManager = this;
	effectsObject.effectsArray.push(effect);
};

EffectsManager.prototype.executeEffects = function(id, magoManager)
{
	var effectsObject = this.getEffectsObject(id);
	var effectExecuted = false;
	var currTime = magoManager.getCurrentTime();
	if (effectsObject === undefined)
	{ return false; }
	
	var effectsCount = effectsObject.effectsArray.length;
	for (var i=0; i<effectsCount; i++)
	{
		var effect = effectsObject.effectsArray[i];
		if (effect.execute((currTime/1000), magoManager))
		{
			if (effect.complete && typeof effect.complete === 'function') 
			{
				effect.complete.call(null, magoManager);
			}
			effectsObject.effectsArray.splice(i, 1);
			effectsCount = effectsObject.effectsArray.length;
		}
		effectExecuted = true;
		
		if (effectsObject.effectsArray.length === 0)
		{ 
			this.effectsObjectsMap[id] = undefined;
			delete this.effectsObjectsMap[id];
		}
	}
	
	return effectExecuted;
};



































