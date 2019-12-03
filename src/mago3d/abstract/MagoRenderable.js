'use strict';

var MagoRenderable = function() 
{
	this.objectsArray = [];
	this.meshArray = [];

	this.id;
	this.name;
	this.owner;

	this.attributes = {
		isVisible: true
	};
	// Use this matrix if this is child.
	this.tMat;
	this.tMatOriginal;

	// use this geoLocDataManager if this is no child.
	this.geoLocDataManager;
	
	this.dirty = true;
	this.color4;
};

MagoRenderable.prototype.render = function(magoManager, shader, renderType, glPrimitive) 
{
	return abstract();
};
MagoRenderable.prototype.renderAsChild = function(magoManager, shader, renderType, glPrimitive) 
{
	return abstract();
};
MagoRenderable.prototype.makeMesh = function() 
{
	return abstract();
};
MagoRenderable.prototype.updateMatrix = function(ownerMatrix) 
{
	if (!ownerMatrix) 
	{
		if (this.geoLocDataManager === undefined || this.geoLocDataManager === null) 
		{
			return;
		}

		var geoLocDataManager = this.geoLocDataManager;
		var geoLocData = geoLocDataManager.getCurrentGeoLocationData();
		this.tMat = geoLocData.rotMatrix;
	}
	else 
	{
		this.tMat = this.tMatOriginal.getMultipliedByMatrix(ownerMatrix, this.tMat);
	}
    
	if (this.objectsArray === undefined)
	{ return; }
	for (var i=0, len=this.objectsArray.length; i <len;++i) 
	{
		var object = this.objectsArray[i];
		if (object instanceof MagoRenderable)
		{
			this.objectsArray[i].updateMatrix(this.tMat);
		}
	}
};
MagoRenderable.prototype.setDirty = function(dirty) 
{
	this.dirty = dirty;
};
/**
 * Set the unique one color of the box
 * @param {Number} r
 * @param {Number} g
 * @param {Number} b 
 * @param {Number} a
 */
MagoRenderable.prototype.setOneColor = function(r, g, b, a)
{
	// This function sets the unique one color of the mesh.***
	if (this.color4 === undefined)
	{ this.color4 = new Color(); }
	
	this.color4.setRGBA(r, g, b, a);

	//TODO : 좀 더 정교한 근사값 구하기로 변경
	if (a < 1) 
	{
		this.setOpaque(false);
	}
};
MagoRenderable.prototype.setOpaque = function(opaque)
{
	this.attributes.opaque = opaque;
};
MagoRenderable.prototype.isOpaque = function()
{
	if (this.attributes.opaque === undefined) 
	{
		return true;
	}

	return this.attributes.opaque;
};
MagoRenderable.prototype.getGeoLocDataManager = function()
{
	return this.geoLocDataManager;
};