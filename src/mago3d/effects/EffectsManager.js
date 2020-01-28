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

EffectsManager.prototype.executeEffects = function(id, currTime)
{
	var effectsObject = this.getEffectsObject(id);
	var effectExecuted = false;
	if (effectsObject === undefined)
	{ return false; }
	
	var effectsCount = effectsObject.effectsArray.length;
	for (var i=0; i<effectsCount; i++)
	{
		var effect = effectsObject.effectsArray[i];
		if (effect.execute(currTime/1000))
		{
			effectsObject.effectsArray.splice(i, 1);
			effectsCount = effectsObject.effectsArray.length;
		}
		effectExecuted = true;
		
		if (effectsObject.effectsArray === 0)
		{ this.effectsObjectsMap[id] = undefined; }
	}
	
	return effectExecuted;
};



































