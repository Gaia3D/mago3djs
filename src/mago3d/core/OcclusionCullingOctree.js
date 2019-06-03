'use strict';
	
/**
 * OcclusionCullingOctree
 * @class
 * 
 * @see OcclusionCullingOctreeCell
 */
var OcclusionCullingOctree = function() 
{
	if (!(this instanceof OcclusionCullingOctree)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this._ocCulling_box = new OcclusionCullingOctreeCell(null);
	this._infinite_ocCulling_box = new OcclusionCullingOctreeCell(null);
};