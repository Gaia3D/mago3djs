'use strict';

/**
 * Geoserver for mago3Djs object.
 * @class Geoserver
 */
var GeoServer = function() 
{

	this.serverInfo = {};
}; 

GeoServer.prototype.setServerInfo = function(info) 
{
	this.serverInfo = info;
};

GeoServer.prototype.getDataUrl = function() 
{
	return this.serverInfo.dataUrl;
};

GeoServer.prototype.getDataWorkspace = function() 
{
	return this.serverInfo.dataWorkspace;
};

GeoServer.prototype.getDataRequestUrl = function() 
{
	return this.getDataUrl() + '/' + this.getDataWorkspace();
};

GeoServer.prototype.getWmsVersion = function() 
{
	return this.serverInfo.wmsVersion;
};