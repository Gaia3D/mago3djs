'use strict';


/**
 * 어떤 일을 하고 있습니까?
 * @class MagoNativeProject
 */
var MagoNativeProject = function() 
{
	if (!(this instanceof MagoNativeProject)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	// This is a "ParametricMeshes" composition.
	this.meshesArray;
	this.geoLocDataManager;
	this.vboKeysContainer; // class: VBOVertexIdxCacheKeysContainer
};

MagoNativeProject.prototype.newParametricMesh = function()
{
	if (this.meshesArray === undefined)
	{ this.meshesArray = []; }
	
	var parametricMesh = new ParametricMesh();
	this.meshesArray.push(parametricMesh);
	return parametricMesh;
};

MagoNativeProject.prototype.deleteObjects = function()
{
	if (this.meshesArray === undefined)
	{ return; }
	
	var parametricMeshesCount = this.meshesArray.length;
	for (var i=0; i<parametricMeshesCount; i++)
	{
		this.meshesArray[i].deleteObjects();
		this.meshesArray[i] = undefined;
	}
	this.meshesArray = undefined;
	
	if (this.geoLocDataManager)
	{ this.geoLocDataManager.deleteObjects(); }
	
	this.geoLocDataManager = undefined;
};

MagoNativeProject.prototype.getMeshesCount = function()
{
	if (this.meshesArray === undefined)
	{ return 0; }
	
	return this.meshesArray.length;
};

MagoNativeProject.prototype.getMesh = function(idx)
{
	if (this.meshesArray === undefined)
	{ return undefined; }
	
	return this.meshesArray[idx];
};
















































