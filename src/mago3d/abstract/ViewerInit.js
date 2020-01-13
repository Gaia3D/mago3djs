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