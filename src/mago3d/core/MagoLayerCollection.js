'use strict';

/**
 * This is the collection for MagoLayer.
 * @class MagoLayerCollection
 * 
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
}
MagoLayerCollection.prototype = Object.create(Emitter.prototype);
MagoLayerCollection.prototype.constructor = MagoLayerCollection;

MagoLayerCollection.EVENT_TYPE = {
	'ADD'                  	    : 'add',
	'REMOVE'                	: 'remove'
};

/**
 * add MagoLayer
 * @param {object} layer mago layer object
 */
MagoLayerCollection.prototype.add = function(layer)
{
    if(!defined(layer))
    {
        throw new Error(Messages.REQUIRED_EMPTY_ERROR('layer'));
    }
    if(!(layer instanceof MagoLayer))
    {
        layer = new MagoLayer(layer);
    }
   
    this.layers.push(layer);

    this.emit(MagoLayerCollection.EVENT_TYPE.ADD, {
        type      : MagoLayerCollection.EVENT_TYPE.ADD,
        layer     : layer,
		timestamp : new Date()
	});
}