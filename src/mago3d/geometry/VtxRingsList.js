'use strict';
/**
 * vertex ring list.
 * @exception {Error} Messages.CONSTRUCT_ERROR
 * 
 * @class VtxRing
 * 
 */
var VtxRingsList = function() 
{
	if (!(this instanceof VtxRingsList)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	/**
	 * vertex list.
	 * @type {Array.<VtxRing>}
	 */
	this.vtxRingsArray;
};

/**
 * delete all vertex and element index ranges.
 */
VtxRingsList.prototype.deleteObjects = function()
{
	if (this.vtxRingsArray !== undefined)
	{
		var vtxRingsCount = this.vtxRingsArray.length;
		for (var i=0; i<vtxRingsCount; i++)
		{
			this.vtxRingsArray[i].deleteObjects();
			this.vtxRingsArray[i] = undefined;
		}
		this.vtxRingsArray = undefined;
	}
};


/**
 * get vtxRing count.
 * @return {Number} 
 */
VtxRingsList.prototype.getVtxRingsCount = function()
{
	if (this.vtxRingsArray === undefined)
	{ return 0; }
	
	return this.vtxRingsArray.length;
};

/**
 * get vtxRing.
 * @param {Number} idx.
 * @return {VtxRing|undefined} 
 */
VtxRingsList.prototype.getVtxRing = function(idx)
{
	if (this.vtxRingsArray === undefined)
	{ return undefined; }
	
	return this.vtxRingsArray[idx];
};

/**
 * add new vtxRing and return.
 * @return {IndexRange}
 */
VtxRingsList.prototype.newVtxRing = function()
{
	if (this.vtxRingsArray === undefined)
	{ this.vtxRingsArray = []; }
	
	var vtxRing = new VtxRing();
	this.vtxRingsArray.push(vtxRing);
	return vtxRing;
};

/**
 * vertex ring list copy from another vertex ring list.
 * @param {VtxRingList} vtxRingList
 */
VtxRingsList.prototype.copyFrom = function(vtxRingsList)
{
	if (vtxRingsList === undefined)
	{ return; }
	
	if (this.vtxRingsArray === undefined)
	{ this.vtxRingsArray = []; }
	
	var vtxRing;
	var vtxRingsCount = vtxRingsList.getVtxRingsCount();
	for (var i=0; i<vtxRingsCount; i++)
	{
		vtxRing = this.newVtxRing();
		vtxRing.copyFrom(vtxRingsList.getVtxRing(i));
	}
};

/**
 * vertex point translate.
 * @param {Number} x
 * @param {Number} y
 * @param {Number} z
 * @see Point3D#add
 */
VtxRingsList.prototype.translate = function(x, y, z)
{
	var vtxRingsCount = this.getVtxRingsCount();
	for (var i=0; i<vtxRingsCount; i++)
	{
		this.vtxRingsArray[i].translate(x, y, z);
	}
};

/**
 * vertex point transform by matrix4
 * @param {Matrix4} tMat4
 * @see Matrix4#transformPoint3D
 */
VtxRingsList.prototype.transformPointsByMatrix4 = function(tMat4)
{
	var vtxRingsCount = this.getVtxRingsCount();
	for (var i=0; i<vtxRingsCount; i++)
	{
		this.vtxRingsArray[i].transformPointsByMatrix4(tMat4);
	}
};

/**
 * get all vertex. 
 * @param {Array} resultVerticesArray
 * @return {Array.<Vertex>|undefined} if this.vtxRingsArray is undefined, return resultVerticesArray.
 */
VtxRingsList.prototype.getAllVertices = function(resultVerticesArray)
{
	if (this.vtxRingsArray === undefined)
	{ return resultVerticesArray; }
	
	var vtxRingsCount = this.getVtxRingsCount();
	for (var i=0; i<vtxRingsCount; i++)
	{
		this.vtxRingsArray[i].getAllVertices(resultVerticesArray);
	}
	
	return resultVerticesArray;
};

/**
 * set vertex idx in list.
 * @deprecated Must no use. and VtxRing has no setVerticesIdxInList method.
 */
VtxRingsList.prototype.setVerticesIdxInList = function()
{
	if (this.vtxRingsArray === undefined)
	{ return; }
	
	var vtxRingsCount = this.getVtxRingsCount();
	for (var i=0; i<vtxRingsCount; i++)
	{
		this.vtxRingsArray[i].setVerticesIdxInList();
	}
};

/**
 * get vertex intersected with plane. 
 * @static
 * @param {VtxRingList} vtxRingList if vtxRingList undefined, return resultVtxRingList.
 * @param {Plane} plane. 
 * @param {Point3D} projectionDirection projectionDirection must be unitary.
 * @param {VtxRingList} resultVtxRingList Optional. if undefined, set new VtxRingList instance.
 * @return {VtxRingList} resultVtxRingList
 */
VtxRingsList.getProjectedOntoPlane = function(vtxRingList, plane, projectionDirection, resultVtxRingList)
{
	if (vtxRingList === undefined)
	{ return resultVtxRingList; }
	
	if (resultVtxRingList === undefined)
	{ resultVtxRingList = new VtxRingsList(); }
	
	var vtxRing, projectedVtxRing;;
	var vtxRingsCount = vtxRingList.getVtxRingsCount();
	for (var i=0; i<vtxRingsCount; i++)
	{
		vtxRing = vtxRingList.getVtxRing(i);
		projectedVtxRing = resultVtxRingList.newVtxRing();
		projectedVtxRing = VtxRing.getProjectedOntoPlane(vtxRing, plane, projectionDirection, projectedVtxRing);
	}
	
	return resultVtxRingList;
};


















































