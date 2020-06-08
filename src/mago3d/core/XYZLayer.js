'use strict';

/**
 * @typedef {TextureLayer~option} XYZLayer~option
 * @property {string} url xyz url. If urlFunction undefined, url is required.
 * @property {function(tileCoord)} urlFunction xyz url function. If url undefined, urlFunction is required.
 */
/**
 * @constructor
 * @class this layer is imager service class for tile map service (TMS, XYZ).
 * @extends TextureLayer
 * 
 * @param {XYZLayer~option} options 
 * 
 * @example
 * // use url.
 * var options = {maxZoom : 18, minZoom : 0, opacity : 0.5, url : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'};
 * var xyzLayer = new Mago3D.XYZLayer(options);
 * 
 * // use urlFunction
 * var baseLayer = new Mago3D.XYZLayer({
 * 		// coordinate = {x, y ,z}
 *       urlFunction : function(coordinate) {
 *           var url = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
 *           return url.replace('{z}',coordinate.z)
 *           .replace('{y}',coordinate.y)
 *           .replace('{x}',coordinate.x);
 *       }
 * });
 */
var XYZLayer = function(options) 
{
	if (!(this instanceof XYZLayer)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	TextureLayer.call(this, options);

	var url = options.url;
	var urlFunction = options.urlFunction;
	if (isEmpty(url) && isEmpty(urlFunction)) 
	{
		throw new Error(Messages.REQUIRED_EMPTY_ERROR('url or urlFunction'));
	}

	this.url = url;
	this.reg = /{[^}]+}/g;
	this.urlFunction = defaultValue(urlFunction, undefined);
	
	if (!this.urlFunction) 
	{
		this._setDefaultUrlFunction();
	}
};
XYZLayer.prototype = Object.create(TextureLayer.prototype);
XYZLayer.prototype.constructor = XYZLayer;

/**
 * @private
 */
XYZLayer.prototype.getUrl = function(info) 
{	
	return this.urlFunction.call(this, info);
};
/**
 * @private
 */
XYZLayer.prototype._setDefaultUrlFunction = function()
{
	var that = this;
	var urlFunction = function(info)
	{
		var matchs = that.url.match(that.reg);
		var auxUrl = that.url;
		for (var i=0, len=matchs.length;i<len;i++) 
		{
			var match = matchs[i];
			var key = match.substring(1, match.length - 1);
			var value = info[key.toLowerCase()];
			auxUrl = auxUrl.replace(match, value);
		}
		return auxUrl;
	};
	that.urlFunction = urlFunction;
};