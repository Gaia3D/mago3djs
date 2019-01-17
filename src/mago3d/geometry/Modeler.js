
'use strict';


/**
 * 어떤 일을 하고 있습니까?
 * @class Modeler
 */
var Modeler = function() 
{
	if (!(this instanceof Modeler)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.mode = CODE.modelerMode.INACTIVE; // 
	this.drawingState = CODE.modelerDrawingState.NO_STARTED;
};

/**
 * 어떤 일을 하고 있습니까?
 */
Modeler.prototype.addPoint = function(point) 
{
	
};