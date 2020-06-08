'use strict';
   
/**
 * 
 * @typedef {object} XYZLayer~option
 * @property {string} url
 * @property {function()} urlFunction
 * @property {number} maxZoom
 * @property {number} minZoom
 * @property {boolean} show
 * @property {number} opacity
 */
/**
 * @constructor
 * @class XYZLayer
 * @extends TextureLayer
 * 
 * @param {XYZLayer~option} options 
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
};
XYZLayer.prototype = Object.create(TextureLayer.prototype);
XYZLayer.prototype.constructor = XYZLayer;

XYZLayer.prototype.getUrl = function(info) 
{	

	if (this.urlFunction && typeof this.urlFunction ==='function')
	{
		return this.urlFunction.call(this, info);
	}
	else 
	{
		var matchs = this.url.match(this.reg);
		var auxUrl = this.url;
		for (var i=0, len=matchs.length;i<len;i++) 
		{
			var match = matchs[i];
			var key = match.substring(1, match.length - 1);
			var value = info[key.toLowerCase()];
			auxUrl = auxUrl.replace(match, value);
		}
		return auxUrl;
	}
};