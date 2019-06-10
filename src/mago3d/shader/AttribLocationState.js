'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class AttribLocationState
 */
var AttribLocationState = function() 
{
	if (!(this instanceof AttribLocationState)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.attribLocationEnabled = false;
};