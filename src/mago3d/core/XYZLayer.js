'use strict';

var XYZLayer = function(options) 
{
	if (!(this instanceof XYZLayer)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	if (isEmpty(options.url) && isEmpty(options.urlFunction)) 
	{
		throw new Error(Messages.REQUIRED_EMPTY_ERROR('url or urlFunction'));
	}
	this._id = createGuid();
	this.url = options.url;
	this.reg = /{[^}]+}/g;

	var maxZoom = defaultValue(options.maxZoom, 18);
	var minZoom = defaultValue(options.minZoom, 0);
	this._freezeAttr = {
		maxZoom : maxZoom,
		minZoom : minZoom
	};
	Object.freeze(this._freezeAttr);
	this.show = defaultValue(options.show, true);
	this.opacity = defaultValue(options.opacity, 1.0);
	this.urlFunction = defaultValue(options.urlFunction, undefined);
};

Object.defineProperties(XYZLayer.prototype, {
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