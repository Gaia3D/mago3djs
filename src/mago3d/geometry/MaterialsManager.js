'use strict';

/**
 * Manages materials of the Mago3D.
 * @class MaterialsManager
 * @constructor
 */
var MaterialsManager = function(magoManager) 
{
	if (!(this instanceof MaterialsManager)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.magoManager = magoManager;
	
	/**
	 * Materials loaded/created array.
	 * @type {Array}
	 */
	this.materialsMap = {}; // map<materialName, Material>
	
	this.texturesManager; // to load textures.
	this.imagesPath = "/images/materialImages";
};

MaterialsManager.prototype.getMaterial = function(materialName)
{
	return this.materialsMap[materialName];
};

MaterialsManager.prototype.getOrNewMaterial = function(materialName)
{
	var material = this.getMaterial(materialName);
	
	if (material === undefined)
	{
		// create the material.
		material = new Material(materialName);
		this.materialsMap[materialName] = material;
	}
	
	return material;
};

MaterialsManager.prototype.getOrLoadTexture = function(textureName)
{
	if (this.texturesManager === undefined)
	{ this.texturesManager = new TexturesManager(this.magoManager); }
	
	var texture = this.texturesManager.getTextureByName(textureName);
	
	if (texture === undefined)
	{
		// load the texture.
		
	}
};