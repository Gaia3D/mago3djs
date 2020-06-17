'use strict';

/**
 * This is the collection for MagoLayer.
 * @class MagoLayerCollection
 * @constructor
*/
var MagoLayerCollection = function()
{
	if (!(this instanceof MagoLayerCollection)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	Emitter.call(this);

	/**
     * array of MagoLayer
     * @type {Array<MagoLayer>}
     * @default Array()
     */
	this.layers = [];
};
MagoLayerCollection.prototype = Object.create(Emitter.prototype);
MagoLayerCollection.prototype.constructor = MagoLayerCollection;

MagoLayerCollection.EVENT_TYPE = {
	'ADD'    : 'add',
	'REMOVE'	: 'remove'
};

/**
 * add MagoLayer
 * @param {object} layer mago layer object
 */
MagoLayerCollection.prototype.add = function(layer)
{
	if (!defined(layer))
	{
		throw new Error(Messages.REQUIRED_EMPTY_ERROR('layer'));
	}
	if (!(layer instanceof MagoLayer))
	{
		layer = new MagoLayer(layer);
	}
	
	//일반 f4d 사용시
	if (!layer.tiling)
	{
		layer.getObjectIndexFile();
	}
   
	this.layers.push(layer);

	this.emit(MagoLayerCollection.EVENT_TYPE.ADD, {
		type      : MagoLayerCollection.EVENT_TYPE.ADD,
		layer     : layer,
		timestamp : new Date()
	});
};

/**
 * remove MagoLayer by id
 * @param {String} id mago layer data group id
 */
MagoLayerCollection.prototype.removeById = function(id)
{
	if (!defined(id))
	{
		throw new Error(Messages.REQUIRED_EMPTY_ERROR('id'));
	}
	
	var layers = this.layers;
	
	var removedObj = {
		id: id
	};
	for (var i = layers.length-1; i >= 0; i--) 
	{
		var layer = layers[i];
		if (layer.id === id) 
		{
			layers.slice(i, 1);
			removedObj.index = i;
			break;
		}
	}
	if (!removedObj.hasOwnProperty('index')) 
	{
		throw new Error('this id is not exist');
	}
	this.emit(MagoLayerCollection.EVENT_TYPE.REMOVE, {
		type      : MagoLayerCollection.EVENT_TYPE.REMOVE,
		layer     : removedObj,
		timestamp : new Date()
	});
};