
'use strict';

/**
 * HalfEdge객체의 리스트
 * @exception {Error} Messages.CONSTRUCT_ERROR
 * 
 * @class HalfEdgesList
 * @constructor
 */
var HalfEdgesList_ = function() 
{
	/**
	 * @type {Array.<HalfEdge>}
	 */
	this.hEdgesArray;
};

HalfEdgesList_.prototype.addHalfEdgesArray = function(hEdgesArray)
{
	if (hEdgesArray === undefined)
	{ return; }
	
	if (this.hEdgesArray === undefined)
	{ this.hEdgesArray = []; }
	
	Array.prototype.push.apply(this.hEdgesArray, hEdgesArray);
};