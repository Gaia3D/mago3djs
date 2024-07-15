'use strict';

var ViewerInit = function(containerId, serverPolicy) 
{

	if (!containerId || !document.getElementById(containerId)) 
	{
		console.error('[MagoJs] containerId is required.');
		throw new Error('[MagoJs] containerId is required.');
	}
	var magoConfig = new MagoConfig();
	magoConfig.init(serverPolicy, null, null);

	this.config = magoConfig;
	this.targetId = containerId;
	this.magoManager = undefined;
	this.viewer = undefined;
	this.policy = magoConfig.getPolicy();

	magoConfig.setContainerId(this.targetId);
	this.init();
};

ViewerInit.prototype.init = function() 
{
	return throwAbstractError();
};

ViewerInit.prototype.initMagoManager = function() 
{
	return throwAbstractError();
};

ViewerInit.prototype.setEventHandler = function() 
{
	return throwAbstractError();
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

		if (isNaN(duration)) { duration = 0; }
		this.magoManager.flyTo(lon, lat, height, duration);
	}
};