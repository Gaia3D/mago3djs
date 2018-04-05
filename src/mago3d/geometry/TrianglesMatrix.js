'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class TrianglesMatrix
 */
var TrianglesMatrix= function() 
{
	if (!(this instanceof TrianglesMatrix)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.trianglesListsArray;
};

TrianglesMatrix.prototype.deleteObjects = function()
{
	if(this.trianglesListsArray === undefined)
		return;
	
	var trianglesListsCount = this.trianglesListsArray.length;
	for(var i=0; i<trianglesListsCount; i++)
	{
		this.trianglesListsArray[i].deleteObjects();
		this.trianglesListsArray[i] = undefined;
	}
	this.trianglesListsArray = undefined;
}