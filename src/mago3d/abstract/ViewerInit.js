'use strict';

var ViewerInit = function(containerId, serverPolicy) 
{

	if (!containerId || !document.getElementById(containerId)) 
	{
		throw new Error('containerId is required.');
	}
	MagoConfig.init(serverPolicy, null, null);

	this.targetId = containerId;
	this.magoManager;
	this.viewer;
	this.policy = MagoConfig.getPolicy();

	MagoConfig.setContainerId(this.targetId);
	this.init();
};

ViewerInit.prototype.init = function() 
{
	return abstract();
};

ViewerInit.prototype.initMagoManager = function() 
{
	return abstract();
};

ViewerInit.prototype.setEventHandler = function() 
{
	return abstract();
};

ViewerInit.prototype.initPosition = function()
{
	if (this.policy.initCameraEnable) 
	{ 
		var lon = parseFloat(this.policy.initLongitude);
		var lat = parseFloat(this.policy.initLatitude);
		var height = parseFloat(this.policy.initAltitude);
		var duration = parseInt(this.policy.initDuration);

		if (isNaN(lon) || isNaN(lat) || isNaN(height)) 
		{
			throw new Error('Longitude, Latitude, Height must number type.');
		}

		if (isNaN(duration)) { duration = 3; }
		this.magoManager.flyTo(lon, lat, height, duration);
	}
};