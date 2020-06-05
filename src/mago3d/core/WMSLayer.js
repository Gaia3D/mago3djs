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
	this.filter = defaultValue(options.filter, undefined);

	var maxZoom = defaultValue(options.maxZoom, 18);
	var minZoom = defaultValue(options.minZoom, 0);
	this._freezeAttr = {
		maxZoom : maxZoom,
		minZoom : minZoom
	};
	Object.freeze(this._freezeAttr);

	this.show = defaultValue(options.show, true);
	this.opacity = defaultValue(options.opacity, 1.0);
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

Object.defineProperties(WMSLayer.prototype, {
	maxZoom: {
		get: function()
		{
			return this._freezeAttr.maxZoom;
		}
	},
	minZoom: {
		get: function()
		{
			return this._freezeAttr.minZoom;
		}
	}
});

WMSLayer.DEAFULT_PARAM = {
	SERVICE     : 'WMS',
	VERSION     : '1.1.1',
	REQUEST     : 'GetMap',
	SRS         : 'EPSG:3857',
	CRS         : 'EPSG:3857',
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

	// Debug.
	if (minGeographicCoord.longitude > maxGeographicCoord.longitude)
	{ var hola = 0; }

	if (minGeographicCoord.latitude > maxGeographicCoord.latitude)
	{ var hola = 0; }
	// End debug.

	// Test to convert coords to meters.***********************************
	var minMercator = Globe.geographicToMercatorProjection(minGeographicCoord.longitude, minGeographicCoord.latitude, undefined);
	var maxMercator = Globe.geographicToMercatorProjection(maxGeographicCoord.longitude, maxGeographicCoord.latitude, undefined);
	// End test.-----------------------------------------------------------

	var isLatest = this._requestParam.get('VERSION') === '1.3.0';
	/*
	var minx = isLatest ? minGeographicCoord.latitude : minGeographicCoord.longitude;
	var miny = isLatest ? minGeographicCoord.longitude : minGeographicCoord.latitude;
	var maxx = isLatest ? maxGeographicCoord.latitude : maxGeographicCoord.longitude;
	var maxy = isLatest ? maxGeographicCoord.longitude : maxGeographicCoord.latitude;
	*/
	var minx = minMercator.x;
	var miny = minMercator.y;
	var maxx = maxMercator.x;
	var maxy = maxMercator.y;
	var bbox = minx + ',' + miny + ',' + maxx + ',' + maxy;

	this._requestParam.set('BBOX', bbox);
	return this.url + '?' + this._requestParam.toString();
};