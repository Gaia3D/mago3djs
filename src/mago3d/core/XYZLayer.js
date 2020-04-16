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
	this.maxZoom = defaultValue(options.maxZoom, 18);
	this.minZoom = defaultValue(options.minZoom, 0);
	this.show = defaultValue(options.show, true);
};

XYZLayer.prototype.getUrl = function(info) 
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
};