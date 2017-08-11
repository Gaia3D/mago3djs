

'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class ModelReferencedGroup
 */
var ModelReferencedGroup = function() 
{
	if (!(this instanceof ModelReferencedGroup)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.model; // there are only one model.
	this.referencesArray = []; // all references has the same model.
};