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
	this.workerExtrudeManager;
};

WorkersManager.prototype.getExtrudeWorkerManager = function () 
{
	if (!this.workerExtrudeManager) 
	{
		this.workerExtrudeManager = new ExtrudeWorkerManager(this);
	}
	return this.workerExtrudeManager;
};