'use strict';


// F4D ReferenceObject.************************************************************************************************************************* //
/**
 * 맵 이미지. 머티리얼에는 텍스처에 대한 참조가 포함될 수 있으므로 머티리얼의 셰이더는 객체의 표면색을 계산하는 동안 텍스처를 사용할 수 있습니다.
 * 오브제의 표면의 기본 색상 (알베도) 외에도 텍스쳐는 반사율이나 거칠기와 같은 재질 표면의 많은 다른면을 나타낼 수 있습니다.
 * @class Texture
 */
var Texture = function() {
	if(!(this instanceof Texture)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.textureTypeName = "";
	this.textureImageFileName = "";
	this.texId;
};

/**
 * 어떤 일을 하고 있습니까?
 * @class NeoSimpleBuilding
 */
var NeoSimpleBuilding = function() {
	if(!(this instanceof NeoSimpleBuilding)) {
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
NeoSimpleBuilding.prototype.newAccesor = function() {
	var accesor = new Accessor();
	this.accesorsArray.push(accesor);
	return accesor;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns texture
 */
NeoSimpleBuilding.prototype.newTexture = function() {
	var texture = new NeoTexture();
	this.texturesArray.push(texture);
	return texture;
};

/*
NeoSimpleBuilding.prototype {
	neoRefsLists_Array: [],
	new_accesor: function() {},
	updateCurrentAllIndicesOfLists:  function() {
			var neoRefLists_count = this.neoRefsLists_Array.length;
			for(var i=0; i<neoRefLists_count; i++)
			{
				this.neoRefsLists_Array[i].updateCurrentAllIndicesInterior();
			}
		},
}
*/

/**
 * 어떤 일을 하고 있습니까?
 * @class LodBuilding
 */
var LodBuilding = function() {
	if(!(this instanceof LodBuilding)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	// this class is for use for LOD2 and LOD3 buildings.***
	// provisionally use this class, but in the future use "NeoSimpleBuilding".***
	this.dataArraybuffer; // binary data.***
	this.vbo_vicks_container = new VBOVertexIdxCacheKeysContainer();
	this.fileLoadState = CODE.fileLoadState.READY;
};

LodBuilding.prototype.parseArrayBuffer = function(gl, readWriter) {
	if(this.fileLoadState == CODE.fileLoadState.LOADING_FINISHED)// file loaded.***
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
		if(hasNormals) {
			vertexCount = readWriter.readUInt32(this.dataArraybuffer, bytesReaded, bytesReaded + 4); bytesReaded += 4;
			var normalsByteValuesCount = vertexCount * 3;
			var startBuff = bytesReaded;
			var endBuff = bytesReaded + 1 * normalsByteValuesCount;
			vboViCacheKey.norVboDataArray = new Int8Array(this.dataArraybuffer.slice(startBuff, endBuff));
			bytesReaded = bytesReaded + 1 * normalsByteValuesCount; // updating data.***
		}

		// 3) Colors.*******************************************************************************************************
		var hasColors = readWriter.readUInt8(this.dataArraybuffer, bytesReaded, bytesReaded+1); bytesReaded += 1;
		if(hasColors) {
			vertexCount = readWriter.readUInt32(this.dataArraybuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
			var colorsByteValuesCount = vertexCount * 4;
			var startBuff = bytesReaded;
			var endBuff = bytesReaded + 1 * colorsByteValuesCount;
			vboViCacheKey.colVboDataArray = new Uint8Array(this.dataArraybuffer.slice(startBuff, endBuff));
			bytesReaded = bytesReaded + 1 * colorsByteValuesCount; // updating data.***
		}

		// 4) TexCoord.****************************************************************************************************
		var hasTexCoord = readWriter.readUInt8(this.dataArraybuffer, bytesReaded, bytesReaded+1); bytesReaded += 1;
//		if(hasTexCoord) {
//			// TODO:
//		}

		this.fileLoadState = CODE.fileLoadState.PARSE_FINISHED;
	}	
};

/**
 * 어떤 일을 하고 있습니까?
 * @class NeoBuilding
 */
var NeoBuilding = function() {
	if(!(this instanceof NeoBuilding)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.metaData;
	this.buildingId;
	this.buildingType; // use this for classify a building.***
	this.buildingFileName = "";
	this.bbox;
	this.bboxAbsoluteCenterPos;
	this.frustumCulled = false;

	// a building can have 1 or more geoLocations (and rotations), throght the time for example.***
	this.geoLocDataManager = new GeoLocationDataManager();
	this.geoLocationDataAux; // old. created for HeavyIndustries.***
	this.isDemoBlock = false; // test.***
	//this.isHighLighted;

	// create the references lists.*********************************
	//this._neoRefLists_Container = new NeoReferencesListsContainer(); // Exterior and bone objects.***
	this.currentRenderablesNeoRefLists = []; // test. no used. waiting for background process.***
	this.preExtractedLowestOctreesArray = []; // test. no used. waiting for background process.***
	this.motherNeoReferencesArray = []; // asimetric mode.***
	this.motherBlocksArray = []; // asimetric mode.***

	// Textures loaded.***************************************************
	this.texturesLoaded = []; 

	// The octree.********************************************************
	this.octree; // f4d_octree. ***
	this.octreeLoadedAllFiles = false;

	this.allFilesLoaded = false; // no used yet...
	this.isReadyToRender = false; // no used yet...

	this.moveVector; 

	// aditional data.****************************************************


	// The simple building.***********************************************
	this.neoSimpleBuilding; // this is a simpleBuilding for Buildings with texture.***

	// The lodBuildings.***
	this.lod2Building;
	this.lod3Building;

	// SCRATCH.*********************************
	this.point3dScratch = new Point3D();
	this.point3dScratch2 = new Point3D();
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns neoRef
 */
NeoBuilding.prototype.setRenderedFalseToAllReferences = function() {
	var neoRefsCount = this.motherNeoReferencesArray.length;
	for(var i = 0; i < neoRefsCount; i++)
	{
		var neoRef = this.motherNeoReferencesArray[i];
		neoRef.bRendered = false;
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param texture 변수
 * @returns texId
 */
NeoBuilding.prototype.getTextureId = function(texture) {
	var texId;
	var texturesLoadedCount = this.texturesLoaded.length;
	var find = false;
	var i=0;
	while(!find && i < texturesLoadedCount ) {
		if(this.texturesLoaded[i].textureImageFileName == texture.textureImageFileName) {
			find = true;
			texId = this.texturesLoaded[i].texId;
		}
		i++;
	}

	return texId;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param eyeX 변수
 * @param eyeY 변수
 * @param eyeZ 변수
 */
NeoBuilding.prototype.updateCurrentVisibleIndicesExterior = function(eyeX, eyeY, eyeZ) {
	this._neoRefLists_Container.updateCurrentVisibleIndicesOfLists(eyeX, eyeY, eyeZ);
};

/**
 * 어떤 일을 하고 있습니까?
 */
NeoBuilding.prototype.updateCurrentAllIndicesExterior = function() {
	this._neoRefLists_Container.updateCurrentAllIndicesOfLists();
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns metaData.bbox.isPoint3dInside(eyeX, eyeY, eyeZ);
 */
NeoBuilding.prototype.isCameraInsideOfBuilding = function(eyeX, eyeY, eyeZ) {
	return this.metaData.bbox.isPoint3dInside(eyeX, eyeY, eyeZ);
};

/**
 * 어떤 일을 하고 있습니까?
 * @param absoluteEyeX 변수
 * @param absoluteEyeY 변수
 * @param absoluteEyeZ 변수
 * @returns point3dScrath2
 */
NeoBuilding.prototype.getTransformedRelativeEyePositionToBuilding = function(absoluteEyeX, absoluteEyeY, absoluteEyeZ) {
	// 1rst, calculate the relative eye position.***
	var buildingPosition = this.buildingPosition;
	var relativeEyePosX = absoluteEyeX - buildingPosition.x;
	var relativeEyePosY = absoluteEyeY - buildingPosition.y;
	var relativeEyePosZ = absoluteEyeZ - buildingPosition.z;

	if(this.buildingPosMatInv == undefined) {
		this.buildingPosMatInv = new Matrix4();
		this.buildingPosMatInv.setByFloat32Array(this.moveMatrixInv);
	}

	this.point3dScratch.set(relativeEyePosX, relativeEyePosY, relativeEyePosZ);
	this.point3dScratch2 = this.buildingPosMatInv.transformPoint3D(this.point3dScratch, this.point3dScratch2);

	return this.point3dScratch2;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param absoluteCamera 변수
 * @param resultCamera 변수
 * @returns resultCamera
 */
NeoBuilding.prototype.getTransformedRelativeCameraToBuilding = function(absoluteCamera, resultCamera) {
	// Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.***
	// Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.***
	// Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.***
	// 1rst, calculate the relative eye position.***
	var buildingPosition = this.buildingPosition;

	if(this.buildingPosMatInv == undefined) {
		this.buildingPosMatInv = new Matrix4();
		this.buildingPosMatInv.setByFloat32Array(this.moveMatrixInv); // this is rotationMatrixInverse.***
	}

	this.point3dScratch.set(absoluteCamera.position.x - buildingPosition.x, absoluteCamera.position.y - buildingPosition.y, absoluteCamera.position.z - buildingPosition.z);
	resultCamera.position = this.buildingPosMatInv.transformPoint3D(this.point3dScratch, resultCamera.position);

	this.point3dScratch.set(absoluteCamera.direction.x, absoluteCamera.direction.y, absoluteCamera.direction.z);
	resultCamera.direction = this.buildingPosMatInv.transformPoint3D(this.point3dScratch, resultCamera.direction);

	this.point3dScratch.set(absoluteCamera.up.x, absoluteCamera.up.y, absoluteCamera.up.z);
	resultCamera.up = this.buildingPosMatInv.transformPoint3D(this.point3dScratch, resultCamera.up);

	return resultCamera;
};

/**
 * 어떤 일을 하고 있습니까?
 * @class NeoBuildingsList
 */
var NeoBuildingsList = function() {
	if(!(this instanceof NeoBuildingsList)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.neoBuildingsArray = [];
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns neoBuilding
 */
NeoBuildingsList.prototype.newNeoBuilding = function() {
	var neoBuilding = new NeoBuilding();
	this.neoBuildingsArray.push(neoBuilding);
	return neoBuilding;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns neoBuilding
 */
NeoBuildingsList.prototype.getNeoBuildingByTypeId = function(buildingType, buildingId) {
	var resultBuilding;
	var buildingsCount = this.neoBuildingsArray.length;
	var found = false;
	var i=0;
	while(!found && i < buildingsCount)
	{
		if(this.neoBuildingsArray[i].buildingType == buildingType && this.neoBuildingsArray[i].buildingId == buildingId)
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
NeoBuildingsList.prototype.setNeoBuildingsFrustumCulled = function(bFrustumCulled) {
	var buildingsCount = this.neoBuildingsArray.length;

	for(var i = 0; i < buildingsCount; i++)
	{
		this.neoBuildingsArray[i].frustumCulled = bFrustumCulled;
	}

};
