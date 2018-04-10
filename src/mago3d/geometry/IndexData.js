'use strict';
/**
* 어떤 일을 하고 있습니까?
* @class IndexData
*/
var IndexData = function() 
{
	if (!(this instanceof IndexData)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.owner;
	this.idx;
};