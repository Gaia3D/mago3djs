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
	this.buildingType; // use this for classify a building.
	this.buildingFileName = "";
	
	// Bounding box.
	this.bbox;
	this.bboxAbsoluteCenterPos;
	
	// References and Models.
	this.motherNeoReferencesArray = []; 
	this.motherNeoReferencesMap; 
	this.motherBlocksArray = []; 
	
	// Aditional Color.
	this.isHighLighted;
	this.isColorChanged;
	this.aditionalColor; // use for colorChanged.

	// Textures loaded.
	this.texturesLoaded; // material textures.

	// The octree.**
	this.octree; // f4d_octree. 

	// Auxiliar vars. This vars must be updated before to call render.
	this.currentLod; // Must be updated before to call render.
	this.currentVisibleOctreesControler; // Must be updated before to call render.
	this.myCameraRelative; // Must be updated before to call render.

	// The simple building.**
	this.simpleBuilding3x3Texture; // old version.
	
	// In version 001, there are 6 lods.
	this.lodMeshesMap;
	this.lodBuildingDatasMap;
	
	// Render settings.
	// provisionally put this here.
	this.applyOcclusionCulling;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns {Boolean} applyOcclusionCulling
 */
NeoBuilding.prototype.getImageFileNameForLOD = function(lod) 
{
	var lodBuildingData = this.getLodBuildingData(lod);
	
	if (lodBuildingData === undefined)
	{ return undefined; }
	
	return lodBuildingData.textureFileName;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns {Boolean} applyOcclusionCulling
 */
NeoBuilding.prototype.getReferenceObject = function(refObjectIndex) 
{
	if (this.motherNeoReferencesArray === undefined)
	{ return undefined; }
	return this.motherNeoReferencesArray[refObjectIndex];
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns {Boolean} applyOcclusionCulling
 */
NeoBuilding.prototype.getReferenceObjectsArrayByObjectId = function(objectId) 
{
	if (this.motherNeoReferencesMap === undefined)
	{ return undefined; }

	var refObject = this.motherNeoReferencesMap[objectId];
	return refObject;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns {Boolean} applyOcclusionCulling
 */
NeoBuilding.prototype.putReferenceObject = function(refObject, refObjectIdx) 
{
	// function called by "NeoReferencesMotherAndIndices.prototype.parseArrayBufferReferencesVersioned".
	if (this.motherNeoReferencesArray === undefined)
	{ this.motherNeoReferencesArray = []; }

	this.motherNeoReferencesArray[refObjectIdx] = refObject;
	
	// Additionally, make a objects map.
	if (this.motherNeoReferencesMap === undefined)
	{ this.motherNeoReferencesMap = {}; }
	
	var objectsArray = this.motherNeoReferencesMap[refObject.objectId];
	if (objectsArray === undefined)
	{ objectsArray = []; }
	
	objectsArray.push(refObject);
	
	this.motherNeoReferencesMap[refObject.objectId] = objectsArray;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns {Boolean} applyOcclusionCulling
 */
NeoBuilding.prototype.getRenderSettingApplyOcclusionCulling = function() 
{
	return this.applyOcclusionCulling;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns {Boolean} applyOcclusionCulling
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
	// 1rst, clear this.motherNeoReferencesMap.
	if (this.motherNeoReferencesMap)
	{ 
		this.motherNeoReferencesMap = {}; 
		this.motherNeoReferencesMap = undefined;
	}
	
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
	
	// delete textures on the GPU..
	if (this.texturesLoaded)
	{
		var texture;
		var texturesCount = this.texturesLoaded.length;
		for (var i=0; i<texturesCount; i++)
		{
			texture = this.texturesLoaded[i];
			if (texture)
			{
				if (texture.texId)
				{
					gl.deleteTexture(texture.texId);
					texture.texId = undefined;
					texture.fileLoadState = CODE.fileLoadState.READY;
				}
			}
		}
	}

};

/**
 * 어떤 일을 하고 있습니까?
 * @param texture 변수
 * @returns texId
 */
NeoBuilding.prototype.deleteObjectsLodMesh = function(gl, vboMemoryManager, lodMeshKey) 
{
	// TEST delete lod 3.
	if (this.lodMeshesMap !== undefined)
	{
		if (Object.prototype.hasOwnProperty.call(this.lodMeshesMap, lodMeshKey))
		{
			var legoSkin = this.lodMeshesMap[lodMeshKey];
			if (legoSkin === undefined)
			{ return; }
			
			delete this.lodMeshesMap[lodMeshKey];
			legoSkin.deleteObjects(gl, vboMemoryManager);
			legoSkin = undefined;
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param texture 변수
 * @returns texId
 */
NeoBuilding.prototype.deleteObjectsLod2 = function(gl, vboMemoryManager) 
{
	if (this.octree !== undefined)
	{ 
		// deletes the geometry and the texture.
		this.octree.deleteObjectsLego(gl, vboMemoryManager); 
	}
	
};

/**
 * 어떤 일을 하고 있습니까?
 * @param texture 변수
 * @returns texId
 */
NeoBuilding.prototype.deleteObjects = function(gl, vboMemoryManager, deleteMetadata) 
{
	if (deleteMetadata)
	{
		this.metaData.deleteObjects();
		//this.metaData.fileLoadState = CODE.fileLoadState.READY;
	}
	
	// Must set ( fileLoadState = CODE.fileLoadState.READY ) bcos here deletes octree, so, must reload header 
	// and remake the octree if necessary.
	this.metaData.fileLoadState = CODE.fileLoadState.READY;

	this.deleteObjectsModelReferences(gl, vboMemoryManager);

	// The octree.
	if (this.octree !== undefined)
	{ this.octree.deleteObjects(gl, vboMemoryManager); }
	this.octree = undefined; // f4d_octree. Interior objects.
	
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
				this.texturesLoaded[i].deleteObjects(gl);
			}
			this.texturesLoaded[i] = undefined;
		}
		this.texturesLoaded.length = 0;
	}
	this.texturesLoaded = undefined;
	
	// delete lod3, lod4, lod5.
	if (this.lodMeshesMap !== undefined)
	{
		for (var key in this.lodMeshesMap)
		{
			if (Object.prototype.hasOwnProperty.call(this.lodMeshesMap, key))
			{
				var legoSkin = this.lodMeshesMap[key];
				if (legoSkin === undefined)
				{ continue; }
				legoSkin.deleteObjects(gl, vboMemoryManager);
				legoSkin = undefined;
			}
		}
		this.lodMeshesMap = undefined;
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param texture 변수
 * @returns texId
 */
NeoBuilding.prototype.deleteLodMesh = function(gl, lod, vboMemoryManager) 
{
	if (this.lodMeshesMap !== undefined)
	{
		var legoSkin = this.lodMeshesMap[lod];
		if (legoSkin !== undefined)
		{
			legoSkin.deleteObjects(gl, vboMemoryManager);
			legoSkin = undefined;
		}
	}
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
	/*
	var intersectedOctree = this.octree.getIntersectedSubBoxByPoint3D(eyeX, eyeY, eyeZ);
	if(intersectedOctree)
	{
		if(intersectedOctree.triPolyhedronsCount > 0)
			return true;
		else
			return false;
	}
	else
		return false;
	*/
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
	// 1rst, calculate the relative eye position.
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
	if (this.metaData)
	{ return this.metaData.version; }
	else
	{ return undefined; }
};


/**
 * 어떤 일을 하고 있습니까?
 * @param lod 변수
 */
NeoBuilding.prototype.getLodBuildingData = function(lod) 
{
	if (this.lodBuildingDatasMap === undefined)
	{ return undefined; }
	
	return this.lodBuildingDatasMap[lod];
};

/**
 * 어떤 일을 하고 있습니까?
 * @param neoReference 변수
 */
NeoBuilding.prototype.getCurrentLodString = function() 
{
	var currentLodString = undefined;
	var lodBuildingData = this.getLodBuildingData(this.currentLod);
	currentLodString = lodBuildingData.geometryFileName;
	return currentLodString;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param neoReference 변수
 */
NeoBuilding.prototype.getLowerSkinLodToLoad = function(currentLod) 
{
	// When load buildingSkin, must load respecting the LOD-order. Load 1rst lowerLod.
	// This function returns the lowerLod that is no loaded from currentLod.
	var lodToLoad;
	
	for (var lod = 5; lod >= 0; lod--)
	{
		var lodBuildingDataAux = this.getLodBuildingData(lod);
		
		if (lodBuildingDataAux === undefined)
		{ continue; }
	
		if (lodBuildingDataAux.isModelRef)
		{ continue; }
	
		var lodStringAux = lodBuildingDataAux.geometryFileName;
		var lowLodMeshAux = this.lodMeshesMap[lodStringAux];
		
		// Check if lowLodMeshAux if finished loading data.
		if (lowLodMeshAux === undefined || lowLodMeshAux.fileLoadState === CODE.fileLoadState.READY)
		{
			lodToLoad = lod;
			break;
		}
		else if (lowLodMeshAux.vbo_vicks_container.vboCacheKeysArray === undefined)
		{
			lodToLoad = lod;
			break;
		}
		if (lowLodMeshAux.vbo_vicks_container.vboCacheKeysArray[0] && lowLodMeshAux.vbo_vicks_container.vboCacheKeysArray[0].vboBufferTCoord)
		{
			// this is the new version.
			if (lowLodMeshAux.texture === undefined)
			{
				lodToLoad = lod;
				break;
			}
		}
	}

	return lodToLoad;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param neoReference 변수
 */
NeoBuilding.prototype.getCurrentSkin = function() 
{
	if (this.lodMeshesMap === undefined)
	{ return undefined; }
	
	var skinLego;
	var lodBuildingData = this.getLodBuildingData(this.currentLod);
	if (lodBuildingData === undefined)
	{ return; }
		
	//textureFileName = lodBuildingData.textureFileName;
	var lodString = lodBuildingData.geometryFileName;
	skinLego = this.lodMeshesMap[lodString];
		
	if (skinLego !== undefined && skinLego.isReadyToRender())
	{ return skinLego; }
		
	
	if (this.currentLod === 0)
	{
		skinLego = this.lodMeshesMap.lod0;
		
		if (skinLego === undefined || !skinLego.isReadyToRender())
		{
			skinLego = this.lodMeshesMap.lod1;
			if (skinLego === undefined || !skinLego.isReadyToRender())
			{
				skinLego = this.lodMeshesMap.lod2;
				if (skinLego === undefined || !skinLego.isReadyToRender())
				{
					skinLego = this.lodMeshesMap.lod3;
					if (skinLego === undefined || !skinLego.isReadyToRender())
					{
						skinLego = this.lodMeshesMap.lod4;
						if (skinLego === undefined || !skinLego.isReadyToRender())
						{
							skinLego = this.lodMeshesMap.lod5;
						}
					}
				}
			}
		}
		
	}
	else if (this.currentLod === 1)
	{
		skinLego = this.lodMeshesMap.lod1;
		
		if (skinLego === undefined || !skinLego.isReadyToRender())
		{
			skinLego = this.lodMeshesMap.lod2;
			if (skinLego === undefined || !skinLego.isReadyToRender())
			{
				skinLego = this.lodMeshesMap.lod3;
				if (skinLego === undefined || !skinLego.isReadyToRender())
				{
					skinLego = this.lodMeshesMap.lod4;
					if (skinLego === undefined || !skinLego.isReadyToRender())
					{
						skinLego = this.lodMeshesMap.lod5;
					}
				}
			}
		}
		
	}
	else if (this.currentLod === 2)
	{
		skinLego = this.lodMeshesMap.lod2;
		
		if (skinLego === undefined || !skinLego.isReadyToRender())
		{
			skinLego = this.lodMeshesMap.lod3;
			if (skinLego === undefined || !skinLego.isReadyToRender())
			{
				skinLego = this.lodMeshesMap.lod4;
				if (skinLego === undefined || !skinLego.isReadyToRender())
				{
					skinLego = this.lodMeshesMap.lod5;
				}
			}
		}
		
	}
	else if (this.currentLod === 3)
	{
		skinLego = this.lodMeshesMap.lod3;
		
		if (skinLego === undefined || !skinLego.isReadyToRender())
		{
			skinLego = this.lodMeshesMap.lod4;
			if (skinLego === undefined || !skinLego.isReadyToRender())
			{
				skinLego = this.lodMeshesMap.lod5;
			}
		}
		
	}
	else if (this.currentLod === 4)
	{
		skinLego = this.lodMeshesMap.lod4;
		
		if (skinLego === undefined || !skinLego.isReadyToRender())
		{
			skinLego = this.lodMeshesMap.lod5;
			if (skinLego === undefined || !skinLego.isReadyToRender())
			{
				skinLego = this.lodMeshesMap.lod3;
			}
		}
		
	}
	else if (this.currentLod === 5)
	{
		skinLego = this.lodMeshesMap.lod5;
		
		if (skinLego === undefined || !skinLego.isReadyToRender())
		{
			skinLego = this.lodMeshesMap.lod4;
			if (skinLego === undefined || !skinLego.isReadyToRender())
			{
				skinLego = this.lodMeshesMap.lod3;
			}
		}
		
	}

	return skinLego;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param neoReference 변수
 */
NeoBuilding.prototype.manageNeoReferenceTexture = function(neoReference, magoManager) 
{
	var texture = undefined;
	
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
					// Load the texture.
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
		
		return neoReference.texture.fileLoadState;
	}
	else if (this.metaData.version[0] === '0' && this.metaData.version[2] === '0' && this.metaData.version[4] === '1' )
	{
		if (neoReference.texture === undefined || neoReference.texture.fileLoadState === CODE.fileLoadState.READY)
		{
			// provisionally use materialId as textureId.
			var textureId = neoReference.materialId;
			texture = this.texturesLoaded[textureId];
			neoReference.texture = texture;
			
			if (texture.texId === undefined && texture.textureImageFileName !== "")
			{
				if (magoManager.backGround_fileReadings_count > 10) 
				{ return undefined; }
	
				if (texture.fileLoadState === CODE.fileLoadState.READY) 
				{
					var gl = magoManager.sceneState.gl;
					texture.texId = gl.createTexture();
					// Load the texture.
					var projectFolderName = this.projectFolderName;
					var geometryDataPath = magoManager.readerWriter.getCurrentDataPath();
					var filePath_inServer = geometryDataPath + "/" + projectFolderName + "/" + this.buildingFileName + "/Images_Resized/" + texture.textureImageFileName;

					magoManager.readerWriter.readNeoReferenceTexture(gl, filePath_inServer, texture, this, magoManager);
					magoManager.backGround_fileReadings_count ++;
				}
			}
		}
		
		return neoReference.texture.fileLoadState;
	}
	else if (this.metaData.version[0] === '0' && this.metaData.version[2] === '0' && this.metaData.version[4] === '2' )
	{
		// Project_data_type (new in version 002).
		// 1 = 3d model data type (normal 3d with interior & exterior data).
		// 2 = single building skin data type (as vWorld or googleEarth data).
		// 3 = multi building skin data type (as Shibuya & Odaiba data).
		// 4 = pointsCloud data type.
		// 5 = pointsCloud data type pyramidOctree test.	
		if (this.metaData.projectDataType === undefined || this.metaData.projectDataType > 3)
		{ return neoReference.texture.fileLoadState; }
	
		if (neoReference.texture === undefined || neoReference.texture.fileLoadState === CODE.fileLoadState.READY)
		{
			// provisionally use materialId as textureId.
			var textureId = neoReference.materialId;
			texture = this.texturesLoaded[textureId];
			neoReference.texture = texture;
			
			if (texture.texId === undefined && texture.textureImageFileName !== "")
			{
				if (magoManager.backGround_fileReadings_count > 10) 
				{ return undefined; }
	
				if (texture.fileLoadState === CODE.fileLoadState.READY) 
				{
					var gl = magoManager.sceneState.gl;
					texture.texId = gl.createTexture();
					// Load the texture.
					var projectFolderName = this.projectFolderName;
					var geometryDataPath = magoManager.readerWriter.getCurrentDataPath();
					var filePath_inServer = geometryDataPath + "/" + projectFolderName + "/" + this.buildingFileName + "/Images_Resized/" + texture.textureImageFileName;

					magoManager.readerWriter.readNeoReferenceTexture(gl, filePath_inServer, texture, this, magoManager);
					magoManager.backGround_fileReadings_count ++;
				}
			}
		}
		
		return neoReference.texture.fileLoadState;
	}
	
};

/**
 * 어떤 일을 하고 있습니까?
 */
NeoBuilding.prototype.getShaderName = function(lod, projectType, renderType) 
{
	var shaderName;
	
	// renderType = 0 -> depth render.
	// renderType = 1 -> normal render.
	// renderType = 2 -> colorSelection render.
	//--------------------------------------------
	
	if (renderType === 0)
	{
		if (lod <= 1)
		{
			shaderName = "modelRefDepth";
		}
	}
	else if (renderType === 1)
	{
		if (lod <= 2)
		{
			shaderName = "modelRefSsao";
		}
	}
	else if (renderType === 2)
	{
		if (lod <= 1)
		{
			shaderName = "modelRefSsao";
		}
	}

	return shaderName;
};

/**
 * 어떤 일을 하고 있습니까?
 */
NeoBuilding.prototype.prepareSkin = function(magoManager) 
{
	var headerVersion = this.getHeaderVersion();
	if (headerVersion === undefined)
	{ return false; }
	
	if (headerVersion[0] !== "0")
	{
		return false;
	}

	if (this.lodMeshesMap === undefined)
	{ this.lodMeshesMap = {}; } 
	
	var projectFolderName = this.projectFolderName;
	var buildingFolderName = this.buildingFileName;
	var geometryDataPath = magoManager.readerWriter.geometryDataPath;
	
	// Must respect the lodLoading order: must load the lowerLod if is not loaded.
	var lodToLoad;
	lodToLoad = this.getLowerSkinLodToLoad(this.currentLod);
	var lodBuildingData = this.getLodBuildingData(lodToLoad);
	if (lodBuildingData === undefined)
	{ return false; }

	if (lodBuildingData.isModelRef)
	{ return false; }
	
	var textureFileName = lodBuildingData.textureFileName;
	var lodString = lodBuildingData.geometryFileName;
	
	///lowLodMesh = this.lodMeshesMap.get(lodString); // code if "lodMeshesMap" is a map.
	var lowLodMesh = this.lodMeshesMap[lodString];
	if (lowLodMesh === undefined)
	{
		lowLodMesh = new Lego();
		lowLodMesh.fileLoadState = CODE.fileLoadState.READY;
		lowLodMesh.textureName = textureFileName;
		lowLodMesh.legoKey = this.buildingId + "_" + lodString;
		this.lodMeshesMap[lodString] = lowLodMesh;
	}
	
	if (lowLodMesh.fileLoadState === -1)
	{
		// if a lodObject has "fileLoadState" = -1 means that there are no file in server.
		return false;
	}
	
	if (lowLodMesh.fileLoadState === CODE.fileLoadState.READY) 
	{
		// put it into fileLoadQueue.
		var lodMeshFilePath = geometryDataPath + "/" + projectFolderName + "/" + buildingFolderName + "/" + lodString;
		magoManager.readerWriter.getLegoArraybuffer(lodMeshFilePath, lowLodMesh, magoManager);
		if (lowLodMesh.vbo_vicks_container.vboCacheKeysArray === undefined)
		{ lowLodMesh.vbo_vicks_container.vboCacheKeysArray = []; }
		
	}
	
	if (lowLodMesh.vbo_vicks_container.vboCacheKeysArray[0] && lowLodMesh.vbo_vicks_container.vboCacheKeysArray[0].vboBufferTCoord)
	{
		// this is the new version.
		if (lowLodMesh.texture === undefined)
		{
			lowLodMesh.texture = new Texture();
			var filePath_inServer = geometryDataPath + "/" + projectFolderName + "/" + buildingFolderName + "/" + textureFileName;
			var gl = magoManager.sceneState.gl;
			magoManager.readerWriter.readLegoSimpleBuildingTexture(gl, filePath_inServer, lowLodMesh.texture, magoManager); 
		}
	}
	
	return true;
};

/**
 * 어떤 일을 하고 있습니까?
 */
NeoBuilding.prototype.render = function(magoManager, shader, renderType, refMatrixIdxKey, flipYTexCoord, currentLod) 
{
	var gl = magoManager.sceneState.gl;
	//gl.uniform1f(shader.externalAlpha_loc, 1.0);
	
	if (currentLod !== undefined)
	{ this.currentLod = currentLod; }
	
	// Check metaData.projectDataType.
	if (this.metaData.projectDataType === 5)
	{
		// Render pointsCloud pyramidMode.
		return;
	}
	
	if (this.currentLod <= 2)
	{
		// There are buildings that are only skin, so check projectType of the building.
		var lodBuildingData = this.getLodBuildingData(this.currentLod);
		if (lodBuildingData && !lodBuildingData.isModelRef)
		{
			// This building is skinType data.
			this.renderSkin(magoManager, shader, renderType);
		}
		else
		{
			// This building is octree divided type data.
			var octreesRenderedCount = this.renderDetailed(magoManager, shader, renderType, refMatrixIdxKey, flipYTexCoord);
			
			if (this.currentVisibleOctreesControler === undefined)
			{
				this.renderSkin(magoManager, shader, renderType);
			}
			else
			{
				var lowestOctreesCount0 = this.currentVisibleOctreesControler.currentVisibles0.length;
				var lowestOctreesCount1 = this.currentVisibleOctreesControler.currentVisibles1.length;
				var lowestOctreesCount2 = this.currentVisibleOctreesControler.currentVisibles2.length;
				
				// If octreesRenderedsCount is minor than 60% of total of visibleOctrees, then render the buildingSkin.
				if (octreesRenderedCount < (lowestOctreesCount0 + lowestOctreesCount1 + lowestOctreesCount2)*0.4)
				{ this.renderSkin(magoManager, shader, renderType); }
			}
		}
		
		// Now, check how many octrees are rendered. If rendered only a few, then render the buildingSkin.
		
	}
	else if (this.currentLod > 2)
	{
		this.renderSkin(magoManager, shader, renderType);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 */
NeoBuilding.prototype.renderSkin = function(magoManager, shader, renderType) 
{
	var skinLego = this.getCurrentSkin();
		
	if (skinLego === undefined)
	{ return; }

	if (skinLego.fileLoadState !== CODE.fileLoadState.PARSE_FINISHED)
	{ return; }

	var gl = magoManager.sceneState.gl;

	if (renderType === 1 && magoManager.magoPolicy.getObjectMoveMode() === CODE.moveMode.ALL && magoManager.buildingSelected === this)
	{
		// active stencil buffer to draw silhouette.
		magoManager.renderer.enableStencilBuffer(gl);
	}
	
	magoManager.renderer.currentObjectsRendering.curOctree = this;
	
	var currentObjectsRendering = magoManager.renderer.currentObjectsRendering;
	var selCandidates;
	var selectionColor;
	var currentNode;
	var currentOctree;
	
	if (renderType === 2)
	{
		selCandidates = magoManager.selectionManager;
		selectionColor = magoManager.selectionColor;
		renderTexture = false; // reassign value for this var.
		currentNode = currentObjectsRendering.curNode;
		currentOctree = currentObjectsRendering.curOctree;
	}
	
	var renderTexture = true;
	
	// if the building is highlighted, the use highlight oneColor4.
	if (renderType === 1)
	{
		if (this.isHighLighted)
		{
			//gl.uniform1i(shader.bUse1Color_loc, true);
			gl.uniform1i(shader.colorType_loc, 0); // 0= oneColor, 1= attribColor, 2= texture.
			gl.uniform4fv(shader.oneColor4_loc, this.highLightColor4); //.
			renderTexture = false;
		}
		else if (this.isColorChanged)
		{
			//gl.uniform1i(shader.bUse1Color_loc, true);
			gl.uniform1i(shader.colorType_loc, 0); // 0= oneColor, 1= attribColor, 2= texture.
			gl.uniform4fv(shader.oneColor4_loc, [this.aditionalColor.r, this.aditionalColor.g, this.aditionalColor.b, this.aditionalColor.a]); //.
			renderTexture = false;
		}
		else
		{
			//gl.uniform1i(shader.bUse1Color_loc, false);
		}
		//----------------------------------------------------------------------------------
		if (skinLego.texture !== undefined && skinLego.texture.texId && renderTexture)
		{
			
			shader.enableVertexAttribArray(shader.texCoord2_loc);
			gl.uniform1i(shader.colorType_loc, 2); // 0= oneColor, 1= attribColor, 2= texture.
			if (shader.last_tex_id !== skinLego.texture.texId)
			{
				gl.bindTexture(gl.TEXTURE_2D, skinLego.texture.texId);
				shader.last_tex_id = skinLego.texture.texId;
			}
		}
		else 
		{
			//return;
			if (magoManager.textureAux_1x1 !== undefined && renderTexture)
			{
				shader.enableVertexAttribArray(shader.texCoord2_loc);
				gl.uniform1i(shader.colorType_loc, 2); // 0= oneColor, 1= attribColor, 2= texture.
				gl.bindTexture(gl.TEXTURE_2D, magoManager.textureAux_1x1);
			}
			else 
			{
				gl.uniform1i(shader.colorType_loc, 0); // 0= oneColor, 1= attribColor, 2= texture.
			}
		}
	}
	else if (renderType === 2)
	{
		// Color selction mode.
		var colorAux;
		colorAux = magoManager.selectionColor.getAvailableColor(colorAux);
		var idxKey = magoManager.selectionColor.decodeColor3(colorAux.r, colorAux.g, colorAux.b);
		magoManager.selectionManager.setCandidates(idxKey, undefined, undefined, this, currentNode);
		
		gl.uniform1i(shader.colorType_loc, 0); // 0= oneColor, 1= attribColor, 2= texture.
		gl.uniform4fv(shader.oneColor4_loc, [colorAux.r/255.0, colorAux.g/255.0, colorAux.b/255.0, 1.0]);
	}
	
	gl.uniform1i(shader.refMatrixType_loc, 0); // in this case, there are not referencesMatrix.
	skinLego.render(magoManager, renderType, renderTexture, shader);
	
	if (renderType === 1 && magoManager.magoPolicy.getObjectMoveMode() === CODE.moveMode.ALL && magoManager.buildingSelected === this)
	{
		// active stencil buffer to draw silhouette.
		magoManager.renderer.disableStencilBuffer(gl);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 */
NeoBuilding.prototype.renderDetailed = function(magoManager, shader, renderType, refMatrixIdxKey, flipYTexCoord) 
{	
	var octreesRenderedCount = 0;
	if (this.currentVisibleOctreesControler === undefined)
	{ return octreesRenderedCount; }
	
	var renderTexture = false;	
	var gl = magoManager.sceneState.gl;
	
	if (renderType === 0)
	{
		renderTexture = false;
	}
	else if (renderType === 1)
	{
		if (this.texturesLoaded && this.texturesLoaded.length>0)
		{
			renderTexture = true;
		}
		else { renderTexture = false; }
		
		if (magoManager.magoPolicy.getObjectMoveMode() === CODE.moveMode.ALL && magoManager.buildingSelected === this)
		{
			// active stencil buffer to draw silhouette.
			magoManager.renderer.enableStencilBuffer(gl);
		}
	}
	//else if (renderType === 2) // No need to do any function.
	
	// set the currentObjectsRendering.
	magoManager.renderer.currentObjectsRendering.curBuilding = this;
	
	var lowestOctree;
	var refMatrixIdxKey = 0;
	var isInterior = false; // old var.
	
	var applyOcclusionCulling = this.getRenderSettingApplyOcclusionCulling();
	if (applyOcclusionCulling === undefined)
	{ applyOcclusionCulling = true; }
	
	var relCamPosX, relCamPosY, relCamPosZ; 
	if (applyOcclusionCulling)
	{
		relCamPosX = this.myCameraRelative.position.x;
		relCamPosY = this.myCameraRelative.position.y;
		relCamPosZ = this.myCameraRelative.position.z;
	}
	
	// LOD0.
	var minSize = 0.0;
	var lowestOctreesCount = this.currentVisibleOctreesControler.currentVisibles0.length;
	for (var j=0; j<lowestOctreesCount; j++) 
	{
		lowestOctree = this.currentVisibleOctreesControler.currentVisibles0[j];
		if (lowestOctree.neoReferencesMotherAndIndices === undefined) 
		{ continue; }
		
		if (applyOcclusionCulling)
		{ lowestOctree.neoReferencesMotherAndIndices.updateCurrentVisibleIndices(relCamPosX, relCamPosY, relCamPosZ, applyOcclusionCulling); }
		
		lowestOctree.lod = 0; // set current lod to octree.
		if (lowestOctree.renderContent(magoManager, this, renderType, renderTexture, shader, minSize, refMatrixIdxKey, flipYTexCoord))
		{ octreesRenderedCount++; }
	}
	
	// LOD1.
	minSize = 0.45;
	lowestOctreesCount = this.currentVisibleOctreesControler.currentVisibles1.length;
	for (var j=0; j<lowestOctreesCount; j++) 
	{
		lowestOctree = this.currentVisibleOctreesControler.currentVisibles1[j];
		if (lowestOctree.neoReferencesMotherAndIndices === undefined) 
		{ continue; }
	
		if (applyOcclusionCulling)
		{ lowestOctree.neoReferencesMotherAndIndices.updateCurrentVisibleIndices(relCamPosX, relCamPosY, relCamPosZ, applyOcclusionCulling); }
		
		lowestOctree.lod = 1; // set current lod to octree.
		if (lowestOctree.renderContent(magoManager, this, renderType, renderTexture, shader, minSize, refMatrixIdxKey, flipYTexCoord))
		{ octreesRenderedCount++; }
	}
	
	// LOD2.
	shader.disableVertexAttribArray(shader.color4_loc);
	lowestOctreesCount = this.currentVisibleOctreesControler.currentVisibles2.length;
	for (var j=0; j<lowestOctreesCount; j++) 
	{
		// Render the lowestOctree.lego.
		lowestOctree = this.currentVisibleOctreesControler.currentVisibles2[j];
		if (lowestOctree.lego === undefined) 
		{ continue; }
		
		lowestOctree.lod = 2; // set current lod to octree.
		if (lowestOctree.renderContent(magoManager, this, renderType, renderTexture, shader, minSize, refMatrixIdxKey, flipYTexCoord))
		{ octreesRenderedCount++; }
	}
	
	// Finally:
	if (renderType === 1)
	{
		if (magoManager.magoPolicy.getObjectMoveMode() === CODE.moveMode.ALL && magoManager.buildingSelected === this)
		{
			// deactive stencil buffer to draw silhouette.
			magoManager.renderer.disableStencilBuffer(gl);
		}
	}
	
	return octreesRenderedCount;
};





































