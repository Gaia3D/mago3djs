'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class NeoSimpleBuilding
 */
var NeoSimpleBuilding = function() 
{
	if (!(this instanceof NeoSimpleBuilding)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.accesorsArray = [];
	this.vbo_vicks_container = new VBOVertexIdxCacheKeysContainer();
	this.texturesArray = [];
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns accesor
 */
NeoSimpleBuilding.prototype.newAccesor = function() 
{
	var accesor = new Accessor();
	this.accesorsArray.push(accesor);
	return accesor;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns texture
 */
NeoSimpleBuilding.prototype.newTexture = function() 
{
	var texture = new NeoTexture();
	this.texturesArray.push(texture);
	return texture;
};
