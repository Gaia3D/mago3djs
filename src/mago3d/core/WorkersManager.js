'use strict';

/**
 * Manager of workers.
 * @exception {Error} Messages.CONSTRUCT_ERROR
 * 
 * @class WorkersManager
 * @constructor
 */
var WorkersManager = function(magoManager) 
{
	if (!(this instanceof WorkersManager)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.magoManager = magoManager;
	//mergedObject
	this.workerExtrudeManager;
	this.tenelevenExtrudeWorkerManager;
	//ExtrusionBuilding
	this.extrusionWorkerManager;
};

WorkersManager.prototype.getExtrudeWorkerManager = function () 
{
	if (!this.workerExtrudeManager) 
	{
		this.workerExtrudeManager = new ExtrudeWorkerManager(this);
	}
	return this.workerExtrudeManager;
};

WorkersManager.prototype.getTenElevenExtrudeWorkerManager = function () 
{
	if (!this.tenelevenExtrudeWorkerManager) 
	{
		this.tenelevenExtrudeWorkerManager = new TenelevenExtrudeWorkerManager(this);
	}
	return this.tenelevenExtrudeWorkerManager;
};

WorkersManager.prototype.getExtrusionWorkerManager = function () 
{
	if (!this.extrusionWorkerManager) 
	{
		this.extrusionWorkerManager = new ExtrusionWorkerManager(this);
	}
	return this.extrusionWorkerManager;
};

