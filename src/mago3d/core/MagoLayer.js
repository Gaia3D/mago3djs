'use strict';

/**
 * This is the layer for MagoModel.
 * @class MagoModel
 * 
 * @param {object} layer layer object.
 */

var MagoLayer = function(layer)
{
    if (!(this instanceof MagoLayer)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
    if(isEmpty(layer.dataGroupId))
    {
        throw new Error(Messages.REQUIRED_EMPTY_ERROR('dataGroupId'));
    }

    if(isEmpty(layer.dataGroupKey))
    {
        throw new Error(Messages.REQUIRED_EMPTY_ERROR('dataGroupKey'));
    }

    if(isEmpty(layer.dataGroupName))
    {
        throw new Error(Messages.REQUIRED_EMPTY_ERROR('dataGroupName'));
    }

    if(isEmpty(layer.dataGroupPath))
    {
        throw new Error(Messages.REQUIRED_EMPTY_ERROR('dataGroupPath'));
    }
    this.id = layer.dataGroupId;
    this.key = layer.dataGroupKey;
    this.name = layer.dataGroupName;
    this.path = layer.dataGroupPath;
    
    this.tiling = defaultValue(layer.tiling, false);
    this.style = Object.assign({}, layer.style||{});

    var longitude = layer.longitude;
    var latitude = layer.latitude;
    var altitude = layer.altitude;
    //datas
} 