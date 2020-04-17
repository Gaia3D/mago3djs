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

	var maxZoom = defaultValue(options.maxZoom, 18);
	var minZoom = defaultValue(options.minZoom, 3);
	
	Object.defineProperty(this, 'maxZoom', {
		get: function()
		{
			return maxZoom;
		}
	});
	Object.defineProperty(this, 'minZoom', {
		get: function()
		{
			return minZoom;
		}
	});

	this.show = defaultValue(options.show, true);
	this._requestParam = new URLSearchParams(this.param);
	if (this._requestParam.get('VERSION') === '1.3.0') 
	{
		this._requestParam.delete('SRS');
	}
	else 
	{
		this._requestParam.delete('CRS');
	}
};

WMSLayer.DEAFULT_PARAM = {
	SERVICE     : 'WMS',
	VERSION     : '1.3.0',
	REQUEST     : 'GetMap',
	SRS         : 'EPSG:4326',
	CRS         : 'EPSG:4326',
	WIDTH       : 256,
	HEIGHT      : 256,
	FORMAT      : 'image/png',
	TRANSPARENT : true
};
WMSLayer.prototype.getUrl = function(info) 
{
	var rectangle = SmartTile.getGeographicExtentOfTileLXY(parseInt(info.z), parseInt(info.x), parseInt(info.y), undefined, CODE.imageryType.WEB_MERCATOR);

	var minGeographicCoord = rectangle.minGeographicCoord;
	var maxGeographicCoord = rectangle.maxGeographicCoord;

	var isLatest = this._requestParam.get('VERSION') === '1.3.0';
	
	var minx = isLatest ? minGeographicCoord.latitude : minGeographicCoord.longitude;
	var miny = isLatest ? minGeographicCoord.longitude : minGeographicCoord.latitude;
	var maxx = isLatest ? maxGeographicCoord.latitude : maxGeographicCoord.longitude;
	var maxy = isLatest ? maxGeographicCoord.longitude : maxGeographicCoord.latitude;
	var bbox = minx + ',' + miny + ',' + maxx + ',' + maxy;

	this._requestParam.set('BBOX', bbox);
	return this.url + '?' + this._requestParam.toString();
};