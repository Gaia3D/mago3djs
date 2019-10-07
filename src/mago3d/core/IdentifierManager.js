
'use strict';


/**
 * Now under implementation
 * @class IdentifierManager
 */
var IdentifierManager = function() 
{
	if (!(this instanceof IdentifierManager)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.identifierMap = {};
	this.identifiersCount = 0;
};

IdentifierManager.prototype.newId = function()
{
	this.identifiersCount++;
	var id = (this.identifiersCount).toString();
	
	this.identifierMap[id] = 1;
	return id;
};