'use strict';

/**
 * LoftObject
 * @class LoftObject
 * @param {GeographicCoordList} geographicCoordList
 * @param {number} height
 * @param {object} options
 */
var LoftObject = function(geographicCoordList, height, options) 
{
	if (!(this instanceof LoftObject)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
    }
    
    if(!geographicCoordList) {
        throw new Error(Messages.REQUIRED_EMPTY_ERROR('geographicCoordList'));
	}


};
LoftObject.prototype = Object.create(MagoRenderable.prototype);
LoftObject.prototype.constructor = LoftObject;