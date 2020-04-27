'use strict';

var XYZLayer = function(options) 
{
	if (!(this instanceof XYZLayer)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
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
	var rectangle = SmartTile.getGeographicExtentOfTileLXY(parseInt(info.z), parseInt(info.x), parseInt(info.y), undefined, CODE.imageryType.WEB_MERCATOR);
	
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
};