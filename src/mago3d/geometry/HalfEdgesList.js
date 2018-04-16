
'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class HalfEdgesList
 */
var HalfEdgesList = function() 
{
	if (!(this instanceof HalfEdgesList)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.hEdgesArray;
};

HalfEdgesList.prototype.newHalfEdge = function()
{
	if (this.hEdgesArray === undefined)
	{ this.hEdgesArray = []; }
	
	var hedge = new HalfEdge();
	this.hEdgesArray.push(hedge);
	return hedge;
};

HalfEdgesList.prototype.addHalfEdgesArray = function(hEdgesArray)
{
	if (hEdgesArray === undefined)
	{ return; }
	
	if (this.hEdgesArray === undefined)
	{ this.hEdgesArray = []; }
	
	Array.prototype.push.apply(this.hEdgesArray, hEdgesArray);
};