'use strict';

var ViewerInit = function(containerId, serverPolicy) 
{

	if (!containerId || !document.getElementById(containerId)) 
	{
		throw new Error('containerId is required.');
	}
	serverPolicy.maxPartitionsLod0 = 8;
	serverPolicy.maxPartitionsLod1 = 4;
	serverPolicy.maxPartitionsLod2OrLess = 2;

	serverPolicy.maxRatioPointsDist0m = 1.0;
	serverPolicy.maxRatioPointsDist100m = 10.0;
	serverPolicy.maxRatioPointsDist200m = 20.0;
	serverPolicy.maxRatioPointsDist400m = 40.0;
	serverPolicy.maxRatioPointsDist800m = 80.0;
	serverPolicy.maxRatioPointsDist1600m = 160.0;
	serverPolicy.maxRatioPointsDistOver1600m = 320.0;

	serverPolicy.maxPointSizeForPc = 10.0;
	serverPolicy.minPointSizeForPc = 2.0;
	serverPolicy.pendentPointSizeForPc = 60.0;

	serverPolicy.minHeight_rainbow_loc = 0.0;
	serverPolicy.maxHeight_rainbow_loc = 100.0;

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