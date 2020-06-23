'use strict';
/**
 * @typedef {TextureLayer~option} WMSLayer~option
 * @property {string} url wms request url. required.
 * @property {string} param wms GetMap paramter. Optional.
 * @property {string} filter Optional. we can support only BATHYMETRY, when call dem data.
 */
/**
 * @constructor
 * @class this layer is imager service class for web map service (WMS).
 * @extends TextureLayer
 * 
 * @param {WMSLayer~option} options
 * 
 * @example
 *  var wmsLayer = new Mago3D.WMSLayer({
 *  	url: 'http://localhost:8080/geoserver/mago3d/wms/', 
 *      param: {layers: 'mago3d:dem', tiled: true}
 *  });
 *  magoManager.addLayer(wmsLayer);
 * 
 *  //GeoWebCache 사용 시.
 *  var wmsLayer = new Mago3D.WMSLayer({
 *      url: 'http://localhost:8080/geoserver/mago3d/gwc/service/wms', 
 *      show: true, 
 *      //BATHYMETRY filter는 dem 형태의 데이터에서만 사용. 
 *      filter:Mago3D.CODE.imageFilter.BATHYMETRY,  
 *      param: {layers: 'mago3d:dem', tiled: true}
 *  });
 *  magoManager.addLayer(wmsLayer);
 */
var WMSLayer = function(options) 
{
	if (!(this instanceof WMSLayer)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	TextureLayer.call(this, options);

	this.url = options.url;
	this.param = Object.assign({}, WMSLayer.DEAFULT_PARAM, options.param||{});
	/**
  * 
  * filter : {
  * 	type : Mago3D.CODE.imageFilter.BATHYMETRY,
  * 	property : {min, max, caustics}
  * }
  */
	this.filter = defaultValue(options.filter, undefined);
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
WMSLayer.prototype = Object.create(TextureLayer.prototype);
WMSLayer.prototype.constructor = WMSLayer;

/**
 * DEFAULT WMS REQUEST PARAMETER.
 * @static
 */
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

/**
 * @private
 */
WMSLayer.prototype.getUrl = function(info) 
{
	var rectangle = SmartTile.getGeographicExtentOfTileLXY(parseInt(info.z), parseInt(info.x), parseInt(info.y), undefined, CODE.imageryType.WEB_MERCATOR);

	var minGeographicCoord = rectangle.minGeographicCoord;
	var maxGeographicCoord = rectangle.maxGeographicCoord;

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