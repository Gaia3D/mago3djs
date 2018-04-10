'use strict';
/**
* 어떤 일을 하고 있습니까?
* @class VtxRingsList
*/
var VtxRingsList = function() 
{
	if (!(this instanceof VtxRingsList)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.vtxRingsArray;
};

VtxRingsList.prototype.getVtxRingsCount = function()
{
	if(this.vtxRingsArray === undefined)
		return 0;
	
	return this.vtxRingsArray.length;
};

VtxRingsList.prototype.getVtxRing = function(idx)
{
	if(this.vtxRingsArray === undefined)
		return undefined;
	
	return this.vtxRingsArray[idx];
};

VtxRingsList.prototype.newVtxRing = function()
{
	if(this.vtxRingsArray === undefined)
		this.vtxRingsArray = [];
	
	var vtxRing = new VtxRing();
	this.vtxRingsArray.push(vtxRing);
	return vtxRing;
};

VtxRingsList.prototype.copyFrom = function(vtxRingsList)
{
	if(vtxRingsList === undefined)
		return;
	
	if(this.vtxRingsArray === undefined)
		this.vtxRingsArray = [];
	
	var vtxRing;
	var vtxRingsCount = vtxRingsList.getVtxRingsCount();
	for(var i=0; i<vtxRingsCount; i++)
	{
		vtxRing = this.newVtxRing();
		vtxRing.copyFrom(vtxRingsList.getVtxRing(i));
	}
};

VtxRingsList.prototype.translate = function(x, y, z)
{
	var vtxRingsCount = this.getVtxRingsCount();
	for(var i=0; i<vtxRingsCount; i++)
	{
		this.vtxRingsArray[i].translate(x, y, z);
	}
};

VtxRingsList.prototype.transformPointsByMatrix4 = function(tMat4)
{
	var vtxRingsCount = this.getVtxRingsCount();
	for(var i=0; i<vtxRingsCount; i++)
	{
		this.vtxRingsArray[i].transformPointsByMatrix4(tMat4);
	}
};

VtxRingsList.prototype.getAllVertices = function(resultVerticesArray)
{
	if(this.vtxRingsArray === undefined)
		return resultVerticesArray;
	
	var vtxRingsCount = this.getVtxRingsCount();
	for(var i=0; i<vtxRingsCount; i++)
	{
		this.vtxRingsArray[i].getAllVertices(resultVerticesArray);
	}
	
	return resultVerticesArray;
};

VtxRingsList.prototype.setVerticesIdxInList = function()
{
	if(this.vtxRingsArray === undefined)
		return;
	
	var vtxRingsCount = this.getVtxRingsCount();
	for(var i=0; i<vtxRingsCount; i++)
	{
		this.vtxRingsArray[i].setVerticesIdxInList();
	}
};


















































