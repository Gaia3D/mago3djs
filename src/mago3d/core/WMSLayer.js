'use strict';

var WMSLayer = function(options) 
{
	if (!(this instanceof WMSLayer)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this._id = createGuid();
	this.url = options.url;
	this.param = Object.assign({}, WMSLayer.DEAFULT_PARAM, options.param||{});

	this.maxZoom = defaultValue(options.maxZoom, 18);
	this.minZoom = defaultValue(options.minZoom, 0);
    
	this._requestParam = new URLSearchParams(this.param);
	if (this._requestParam.get('version') === '1.3.0') 
	{
		this._requestParam.delete('srs');
	}
	else 
	{
		this._requestParam.delete('crs');
	}
};
WMSLayer.DEAFULT_PARAM = {
	service     : 'WMS',
	version     : '1.1.1',
	request     : 'GetMap',
	srs         : 'EPSG:4326',
	crs         : 'EPSG:4326',
	width       : 256,
	height      : 256,
	format      : 'image/png',
	transparent : true
};
WMSLayer.prototype.getUrl = function(info) 
{
	var rectangle = SmartTile.getGeographicExtentOfTileLXY(parseInt(info.z), parseInt(info.x), parseInt(info.y), undefined, CODE.imageryType.WEB_MERCATOR);

	var minGeographicCoord = rectangle.minGeographicCoord;
	var maxGeographicCoord = rectangle.maxGeographicCoord;
	var bbox = minGeographicCoord.longitude + ',' + minGeographicCoord.latitude + ',' + maxGeographicCoord.longitude + ',' + maxGeographicCoord.latitude;

	var reqParam = this._requestParam.toString();
	reqParam  += '&bbox='+bbox;
	return this.url + '?' + reqParam;
};