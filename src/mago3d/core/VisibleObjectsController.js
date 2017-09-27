'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class VisibleObjectsController
 */
var VisibleObjectsController = function() 
{
	if (!(this instanceof VisibleObjectsController)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.currentVisibles0 = [];
	this.currentVisibles1 = [];
	this.currentVisibles2 = [];
	this.currentVisibles3 = [];
};

VisibleObjectsController.prototype.initArrays = function() 
{
	this.currentVisibles0 = [];
	this.currentVisibles1 = [];
	this.currentVisibles2 = [];
	this.currentVisibles3 = [];
};

VisibleObjectsController.prototype.clear = function() 
{
	this.currentVisibles0.length = 0;
	this.currentVisibles1.length = 0;
	this.currentVisibles2.length = 0;
	this.currentVisibles3.length = 0;
};
