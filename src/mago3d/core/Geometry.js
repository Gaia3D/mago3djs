'use strict';


// F4D ReferenceObject.************************************************************************************************************************* //

/**
 * 어떤 일을 하고 있습니까?
 * @class NeoSimpleBuilding
 */
var NeoSimpleBuilding = function() 
{
	if (!(this instanceof NeoSimpleBuilding)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.accesorsArray = [];
	this.vbo_vicks_container = new VBOVertexIdxCacheKeysContainer();
	this.texturesArray = [];
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns accesor
 */
NeoSimpleBuilding.prototype.newAccesor = function() 
{
	var accesor = new Accessor();
	this.accesorsArray.push(accesor);
	return accesor;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns texture
 */
NeoSimpleBuilding.prototype.newTexture = function() 
{
	var texture = new NeoTexture();
	this.texturesArray.push(texture);
	return texture;
};

/**
 * 어떤 일을 하고 있습니까?
 * @class LodBuilding
 */
var LodBuilding = function() 
{
	if (!(this instanceof LodBuilding)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	// this class is for use for LOD2 and LOD3 buildings.***
	// provisionally use this class, but in the future use "NeoSimpleBuilding".***
	this.dataArraybuffer; // binary data.***
	this.vbo_vicks_container = new VBOVertexIdxCacheKeysContainer();
	this.fileLoadState = CODE.fileLoadState.READY;
};

LodBuilding.prototype.parseArrayBuffer = function(gl, readWriter) 
{
	if (this.fileLoadState === CODE.fileLoadState.LOADING_FINISHED)// file loaded.***
	{
		this.fileLoadState = CODE.fileLoadState.PARSE_STARTED;
		var bytesReaded = 0;

		// 1rst, read bbox.***
		var bbox = new BoundingBox();
		bbox.minX = new Float32Array(this.dataArraybuffer.slice(bytesReaded, bytesReaded+4)); bytesReaded += 4;
		bbox.minY = new Float32Array(this.dataArraybuffer.slice(bytesReaded, bytesReaded+4)); bytesReaded += 4;
		bbox.minZ = new Float32Array(this.dataArraybuffer.slice(bytesReaded, bytesReaded+4)); bytesReaded += 4;

		bbox.maxX = new Float32Array(this.dataArraybuffer.slice(bytesReaded, bytesReaded+4)); bytesReaded += 4;
		bbox.maxY = new Float32Array(this.dataArraybuffer.slice(bytesReaded, bytesReaded+4)); bytesReaded += 4;
		bbox.maxZ = new Float32Array(this.dataArraybuffer.slice(bytesReaded, bytesReaded+4)); bytesReaded += 4;

		var vboViCacheKey = this.vbo_vicks_container.newVBOVertexIdxCacheKey();

		// 1) Positions.************************************************************************************************
		var vertexCount = readWriter.readUInt32(this.dataArraybuffer, bytesReaded, bytesReaded + 4); bytesReaded += 4;
		var verticesFloatValuesCount = vertexCount * 3;
		var startBuff = bytesReaded;
		var endBuff = bytesReaded + 4 * verticesFloatValuesCount;
		vboViCacheKey.posVboDataArray = new Float32Array(this.dataArraybuffer.slice(startBuff, endBuff));
		bytesReaded = bytesReaded + 4 * verticesFloatValuesCount; // updating data.***

		vboViCacheKey.vertexCount = vertexCount;

		// 2) Normals.*****************************************************************************************************
		var hasNormals = readWriter.readUInt8(this.dataArraybuffer, bytesReaded, bytesReaded + 1); bytesReaded += 1;
		if (hasNormals) 
		{
			vertexCount = readWriter.readUInt32(this.dataArraybuffer, bytesReaded, bytesReaded + 4); bytesReaded += 4;
			var normalsByteValuesCount = vertexCount * 3;
			var startBuff = bytesReaded;
			var endBuff = bytesReaded + 1 * normalsByteValuesCount;
			vboViCacheKey.norVboDataArray = new Int8Array(this.dataArraybuffer.slice(startBuff, endBuff));
			bytesReaded = bytesReaded + 1 * normalsByteValuesCount; // updating data.***
		}

		// 3) Colors.*******************************************************************************************************
		var hasColors = readWriter.readUInt8(this.dataArraybuffer, bytesReaded, bytesReaded+1); bytesReaded += 1;
		if (hasColors) 
		{
			vertexCount = readWriter.readUInt32(this.dataArraybuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
			var colorsByteValuesCount = vertexCount * 4;
			var startBuff = bytesReaded;
			var endBuff = bytesReaded + 1 * colorsByteValuesCount;
			vboViCacheKey.colVboDataArray = new Uint8Array(this.dataArraybuffer.slice(startBuff, endBuff));
			bytesReaded = bytesReaded + 1 * colorsByteValuesCount; // updating data.***
		}

		// 4) TexCoord.****************************************************************************************************
		var hasTexCoord = readWriter.readUInt8(this.dataArraybuffer, bytesReaded, bytesReaded+1); bytesReaded += 1;
		if (hasTexCoord) 
		{
			;// TODO:
		}

		this.fileLoadState = CODE.fileLoadState.PARSE_FINISHED;
	}	
};

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
	this.frustumCulled = false;

	// a building can have 1 or more geoLocations (and rotations), throght the time for example.***
	this.geoLocDataManager = new GeoLocationDataManager();
	
	// References and Models.*********************************************
	this.motherNeoReferencesArray = []; // asimetric mode.***
	this.motherBlocksArray = []; // asimetric mode.***
	
	// Current visible objects.*******************************************
	this.currentVisibleOctreesControler; //  class VisibleObjectsControler;
	
	// Aditional Color.***************************************************
	this.aditionalColor; // use for colorChanged.***

	// Textures loaded.***************************************************
	this.texturesLoaded = []; // material textures.***
	this.texturesLoadedCache = {}; // no udes yet...

	// The octree.********************************************************
	this.octree; // f4d_octree. ***
	this.octreeLoadedAllFiles = false;

	this.allFilesLoaded = false; // no used yet...
	this.isReadyToRender = false; // no used yet...

	this.moveVector; 
	this.squaredDistToCam;

	// The simple building.***********************************************
	this.simpleBuilding3x3Texture;

	// SCRATCH.*********************************
	this.point3dScratch = new Point3D(); // delete this.
	this.point3dScratch2 = new Point3D(); // delete this.
};

/**
 * 어떤 일을 하고 있습니까?
 * @param texture 변수
 * @returns texId
 */
NeoBuilding.prototype.getBBoxCenterPositionWorldCoord = function() 
{
	if (this.bboxAbsoluteCenterPos === undefined)
	{
		this.calculateBBoxCenterPositionWorldCoord();
	}
	
	return this.bboxAbsoluteCenterPos;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param texture 변수
 * @returns texId
 */
NeoBuilding.prototype.calculateBBoxCenterPositionWorldCoord = function() 
{
	var bboxCenterPoint;
	var geoLoc = this.geoLocDataManager.geoLocationDataArray[0]; // take the 1rst.
	bboxCenterPoint = this.bbox.getCenterPoint(bboxCenterPoint); // local bbox.
	this.bboxAbsoluteCenterPos = geoLoc.tMatrix.transformPoint3D(bboxCenterPoint, this.bboxAbsoluteCenterPos);
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
NeoBuilding.prototype.getTransformedRelativeEyePositionToBuilding = function(absoluteEyeX, absoluteEyeY, absoluteEyeZ) 
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

	this.point3dScratch.set(relativeEyePosX, relativeEyePosY, relativeEyePosZ);
	this.point3dScratch2 = this.buildingPosMatInv.transformPoint3D(this.point3dScratch, this.point3dScratch2);

	return this.point3dScratch2;
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
	if (this.metaData.version[0] == "v")
	{
		// this is the version beta.
		if (neoReference.texture == undefined)
		{ return undefined; }
		
		if (neoReference.texture.texId === undefined && neoReference.texture.textureImageFileName !== "") 
		{
			// 1rst, check if the texture is loaded.
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
					var geometryDataPath = magoManager.readerWriter.geometryDataPath;
					var filePath_inServer = geometryDataPath + "/" + this.buildingFileName + "/Images_Resized/" + neoReference.texture.textureImageFileName;

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
	else if (this.metaData.version[0] == 0 && this.metaData.version[2] == 0 && this.metaData.version[4] == 1 )
	{
		if (magoManager.backGround_fileReadings_count > 10) 
		{ return; }
			
		// provisionally use materialId as textureId.
		var textureId = neoReference.materialId;
		var texture = this.texturesLoaded[textureId];
		
		if (texture == undefined)
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
			var geometryDataPath = magoManager.readerWriter.geometryDataPath;
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

/**
 * 어떤 일을 하고 있습니까?
 * @class NeoBuildingsList
 */
var NeoBuildingsList = function() 
{
	if (!(this instanceof NeoBuildingsList)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	//Array.apply(this, arguments);

	this.neoBuildingsArray = [];
};
//NeoBuildingsList.prototype = Object.create(Array.prototype);

/**
 * 어떤 일을 하고 있습니까?
 * @returns neoBuilding
 */
NeoBuildingsList.prototype.newNeoBuilding = function() 
{
	var neoBuilding = new NeoBuilding();
	this.neoBuildingsArray.push(neoBuilding);
	return neoBuilding;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns neoBuilding
 */
NeoBuildingsList.prototype.getNeoBuildingByTypeId = function(buildingType, buildingId) 
{
	var resultBuilding;
	var buildingsCount = this.neoBuildingsArray.length;
	var found = false;
	var i=0;
	while (!found && i < buildingsCount)
	{
		if (this.neoBuildingsArray[i].buildingType === buildingType && this.neoBuildingsArray[i].buildingId === buildingId)
		{
			found = true;
			resultBuilding = this.neoBuildingsArray[i];
		}
		i++;
	}

	return resultBuilding;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns neoBuilding
 */
NeoBuildingsList.prototype.setNeoBuildingsFrustumCulled = function(bFrustumCulled) 
{
	var buildingsCount = this.neoBuildingsArray.length;

	for (var i = 0; i < buildingsCount; i++)
	{
		this.neoBuildingsArray[i].frustumCulled = bFrustumCulled;
	}

};

NeoBuildingsList.prototype.get = function (index)
{
	return this.neoBuildingsArray[index];
};

NeoBuildingsList.prototype.add = function (item)
{
	if (item !== undefined)	{ this.neoBuildingsArray.push(item); }
};