'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class NeoBuilding
 */
var NeoBuilding = function() 
{
	if (!(this instanceof NeoBuilding)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.name = "";
	this.metaData;
	this.buildingId;
	this.buildingType; // use this for classify a building.***
	this.buildingFileName = "";
	this.bbox;
	this.bboxAbsoluteCenterPos;
	
	// References and Models.*********************************************
	this.motherNeoReferencesArray = []; 
	this.motherBlocksArray = []; 
	
	// Current visible objects.*******************************************
	this.currentVisibleOctreesControler; //  class VisibleObjectsControler;
	
	// Aditional Color.***************************************************
	this.aditionalColor; // use for colorChanged.***

	// Textures loaded.***************************************************
	this.texturesLoaded; // material textures.***

	// The octree.********************************************************
	this.octree; // f4d_octree. ***

	// auxiliar vars.
	this.distToCam;

	// The simple building.***********************************************
	this.simpleBuilding3x3Texture;
	
	// Render settings.***************************************************
	// provisionally put this here.
	this.applyOcclusionCulling;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns {boolean} applyOcclusionCulling
 */
NeoBuilding.prototype.getReferenceObject = function(refObjectIndex) 
{
	if(this.motherNeoReferencesArray === undefined)
		return undefined;
	return this.motherNeoReferencesArray[refObjectIndex];
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns {boolean} applyOcclusionCulling
 */
NeoBuilding.prototype.getRenderSettingApplyOcclusionCulling = function() 
{
	return this.applyOcclusionCulling;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns {boolean} applyOcclusionCulling
 */
NeoBuilding.prototype.setRenderSettingApplyOcclusionCulling = function(applyOcclusionCulling) 
{
	this.applyOcclusionCulling = applyOcclusionCulling;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param texture 변수
 * @returns texId
 */
NeoBuilding.prototype.deleteObjectsModelReferences = function(gl, vboMemoryManager) 
{
	var blocksCount = this.motherBlocksArray.length;
	for (var i=0; i<blocksCount; i++)
	{
		if (this.motherBlocksArray[i])
		{ this.motherBlocksArray[i].deleteObjects(gl, vboMemoryManager); }
		this.motherBlocksArray[i] = undefined;
	}
	this.motherBlocksArray = [];

	var referencesCount = this.motherNeoReferencesArray.length;
	for (var i=0; i<referencesCount; i++)
	{
		if (this.motherNeoReferencesArray[i])
		{ this.motherNeoReferencesArray[i].deleteObjects(gl, vboMemoryManager); }
		this.motherNeoReferencesArray[i] = undefined;
	}
	this.motherNeoReferencesArray = [];
};

/**
 * 어떤 일을 하고 있습니까?
 * @param texture 변수
 * @returns texId
 */
NeoBuilding.prototype.deleteObjects = function(gl, vboMemoryManager) 
{
	this.metaData.deleteObjects();
	this.metaData.fileLoadState = CODE.fileLoadState.READY;

	this.deleteObjectsModelReferences(gl, vboMemoryManager);
	
	//if(this.nodeOwner)
	//	this.nodeOwner = undefined;

	// The octree.
	if (this.octree !== undefined)
	{ this.octree.deleteObjects(gl, vboMemoryManager); }
	this.octree = undefined; // f4d_octree. Interior objects.***
	
	//this.buildingFileName = "";

	this.allFilesLoaded = false;
	this.isReadyToRender = false;

	// delete textures.
	if (this.texturesLoaded)
	{
		var texturesCount = this.texturesLoaded.length;
		for (var i=0; i<texturesCount; i++)
		{
			if (this.texturesLoaded[i])
			{
				gl.deleteTexture(this.texturesLoaded[i].texId);
				this.texturesLoaded[i].deleteObjects();
			}
			this.texturesLoaded[i] = undefined;
		}
	}
	this.texturesLoaded = undefined;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param texture 변수
 * @returns texId
 */
NeoBuilding.prototype.getBBoxCenterPositionWorldCoord = function(geoLoc) 
{
	if (this.bboxAbsoluteCenterPos === undefined)
	{
		this.calculateBBoxCenterPositionWorldCoord(geoLoc);
	}
	
	return this.bboxAbsoluteCenterPos;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param texture 변수
 * @returns texId
 */
NeoBuilding.prototype.calculateBBoxCenterPositionWorldCoord = function(geoLoc) 
{
	var bboxCenterPoint;
	
	bboxCenterPoint = this.bbox.getCenterPoint(bboxCenterPoint); // local bbox.
	this.bboxAbsoluteCenterPos = geoLoc.tMatrix.transformPoint3D(bboxCenterPoint, this.bboxAbsoluteCenterPos);
	
	// Now, must applicate the aditional translation vector. Aditional translation is made when we translate the pivot point.
	if (geoLoc.pivotPointTraslation)
	{
		var traslationVector;
		traslationVector = geoLoc.tMatrix.rotatePoint3D(geoLoc.pivotPointTraslation, traslationVector );
		this.bboxAbsoluteCenterPos.add(traslationVector.x, traslationVector.y, traslationVector.z);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param texture 변수
 * @returns texId
 */
NeoBuilding.prototype.getTextureId = function(texture) 
{
	var texId;
	var texturesLoadedCount = this.texturesLoaded.length;
	var find = false;
	var i=0;
	while (!find && i < texturesLoadedCount ) 
	{
		if (this.texturesLoaded[i].textureImageFileName === texture.textureImageFileName) 
		{
			find = true;
			texId = this.texturesLoaded[i].texId;
		}
		i++;
	}

	return texId;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param texture 변수
 * @returns texId
 */
NeoBuilding.prototype.getSameTexture = function(texture) 
{
	var sameTexture;
	var texturesLoadedCount = this.texturesLoaded.length;
	var find = false;
	var i=0;
	while (!find && i < texturesLoadedCount ) 
	{
		if (this.texturesLoaded[i].textureImageFileName === texture.textureImageFileName) 
		{
			find = true;
			sameTexture = this.texturesLoaded[i];
		}
		i++;
	}

	return sameTexture;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param eyeX 변수
 * @param eyeY 변수
 * @param eyeZ 변수
 */
NeoBuilding.prototype.updateCurrentVisibleIndicesExterior = function(eyeX, eyeY, eyeZ) 
{
	this._neoRefLists_Container.updateCurrentVisibleIndicesOfLists(eyeX, eyeY, eyeZ);
};

/**
 * 어떤 일을 하고 있습니까?
 */
NeoBuilding.prototype.updateCurrentAllIndicesExterior = function() 
{
	this._neoRefLists_Container.updateCurrentAllIndicesOfLists();
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns metaData.bbox.isPoint3dInside(eyeX, eyeY, eyeZ);
 */
NeoBuilding.prototype.isCameraInsideOfBuilding = function(eyeX, eyeY, eyeZ) 
{
	return this.metaData.bbox.isPoint3dInside(eyeX, eyeY, eyeZ);
};

/**
 * 어떤 일을 하고 있습니까?
 * @param absoluteEyeX 변수
 * @param absoluteEyeY 변수
 * @param absoluteEyeZ 변수
 * @returns point3dScrath2
 */
NeoBuilding.prototype.getTransformedRelativeEyePositionToBuilding = function(absoluteEyeX, absoluteEyeY, absoluteEyeZ, resultRelEyePosToBuilding) 
{
	// 1rst, calculate the relative eye position.***
	var buildingPosition = this.buildingPosition;
	var relativeEyePosX = absoluteEyeX - buildingPosition.x;
	var relativeEyePosY = absoluteEyeY - buildingPosition.y;
	var relativeEyePosZ = absoluteEyeZ - buildingPosition.z;

	if (this.buildingPosMatInv === undefined) 
	{
		this.buildingPosMatInv = new Matrix4();
		this.buildingPosMatInv.setByFloat32Array(this.moveMatrixInv);
	}

	var point3dScratch = new Point3D();
	
	if (resultRelEyePosToBuilding === undefined)
	{ resultRelEyePosToBuilding = new Point3D(); }
	
	point3dScratch.set(relativeEyePosX, relativeEyePosY, relativeEyePosZ);
	resultRelEyePosToBuilding = this.buildingPosMatInv.transformPoint3D(point3dScratch, resultRelEyePosToBuilding);

	return resultRelEyePosToBuilding;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param neoReference 변수
 */
NeoBuilding.prototype.getHeaderVersion = function() 
{
	return this.metaData.version;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param neoReference 변수
 */
NeoBuilding.prototype.manageNeoReferenceTexture = function(neoReference, magoManager) 
{
	if (this.metaData.version[0] === "v")
	{
		// this is the version beta.
		if (neoReference.texture === undefined)
		{ return undefined; }
		
		if (neoReference.texture.texId === undefined && neoReference.texture.textureImageFileName !== "") 
		{
			// 1rst, check if the texture is loaded.
			if (this.texturesLoaded === undefined)
			{ this.texturesLoaded = []; }
			
			var sameTexture = this.getSameTexture(neoReference.texture);
			if (sameTexture === undefined)
			{
				if (magoManager.backGround_fileReadings_count > 10) 
				{ return; }
			
				if (neoReference.texture.fileLoadState === CODE.fileLoadState.READY) 
				{
					var gl = magoManager.sceneState.gl;
					neoReference.texture.texId = gl.createTexture();
					// Load the texture.***
					var projectFolderName = this.projectFolderName;
					var geometryDataPath = magoManager.readerWriter.geometryDataPath;
					var filePath_inServer = geometryDataPath + "/" + projectFolderName + "/" + this.buildingFileName + "/Images_Resized/" + neoReference.texture.textureImageFileName;

					this.texturesLoaded.push(neoReference.texture);
					magoManager.readerWriter.readNeoReferenceTexture(gl, filePath_inServer, neoReference.texture, this, magoManager);
					magoManager.backGround_fileReadings_count ++;
				}
			}
			else 
			{
				if (sameTexture.fileLoadState === CODE.fileLoadState.LOADING_FINISHED)
				{
					neoReference.texture = sameTexture;
				}
			}
		}
	}
	else if (this.metaData.version[0] === 0 && this.metaData.version[2] === 0 && this.metaData.version[4] === 1 )
	{
		if (magoManager.backGround_fileReadings_count > 10) 
		{ return; }
			
		// provisionally use materialId as textureId.
		var textureId = neoReference.materialId;
		var texture = this.texturesLoaded[textureId];
		
		if (texture === undefined)
		{
			//texture = new Texture();
			//texture.fileLoadState = CODE.fileLoadState.READY
			//this.texturesLoaded[textureId] = texture;
		}
		
		if (texture.fileLoadState === CODE.fileLoadState.READY) 
		{
			var gl = magoManager.sceneState.gl;
			neoReference.texture.texId = gl.createTexture();
			// Load the texture.***
			var geometryDataPath = magoManager.readerWriter.getCurrentDataPath();
			var filePath_inServer = geometryDataPath + "/" + this.buildingFileName + "/Images_Resized/" + neoReference.texture.textureImageFileName;

			this.texturesLoaded.push(neoReference.texture);
			magoManager.readerWriter.readNeoReferenceTexture(gl, filePath_inServer, neoReference.texture, this, magoManager);
			magoManager.backGround_fileReadings_count ++;
		}
		else 
		{
			if (texture.fileLoadState === CODE.fileLoadState.LOADING_FINISHED)
			{
				neoReference.texture = texture;
			}
		}
	}
	
	return neoReference.texture.fileLoadState;
};

