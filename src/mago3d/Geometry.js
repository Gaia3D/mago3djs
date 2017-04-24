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

	this.texture_type_name = "";
	this.texture_image_fileName = "";
	this.tex_id;
};

/**
 * 어떤 일을 하고 있습니까?
 * @class NeoSimpleBuilding
 */
var NeoSimpleBuilding = function() {
	if(!(this instanceof NeoSimpleBuilding)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.accesors_array = [];
	this.vbo_vicks_container = new VBOVertexIdxCacheKeysContainer();
	this.texturesArray = [];
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns accesor
 */
NeoSimpleBuilding.prototype.newAccesor = function() {
	var accesor = new Accessor();
	this.accesors_array.push(accesor);
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

		var vbo_vi_cacheKey = this.vbo_vicks_container.newVBOVertexIdxCacheKey();

		// 1) Positions.************************************************************************************************
		var vertexCount = readWriter.readUInt32(this.dataArraybuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
		var verticesFloatValues_count = vertexCount * 3;
		var startBuff = bytesReaded;
		var endBuff = bytesReaded + 4*verticesFloatValues_count;
		vbo_vi_cacheKey.pos_vboDataArray = new Float32Array(this.dataArraybuffer.slice(startBuff, endBuff));
		bytesReaded = bytesReaded + 4*verticesFloatValues_count; // updating data.***

		vbo_vi_cacheKey.vertexCount = vertexCount;

		// 2) Normals.*****************************************************************************************************
		var hasNormals = readWriter.readUInt8(this.dataArraybuffer, bytesReaded, bytesReaded+1); bytesReaded += 1;
		if(hasNormals) {
			vertexCount = readWriter.readUInt32(this.dataArraybuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
			var normalsByteValues_count = vertexCount * 3;
			var startBuff = bytesReaded;
			var endBuff = bytesReaded + 1*normalsByteValues_count;
			vbo_vi_cacheKey.nor_vboDataArray = new Int8Array(this.dataArraybuffer.slice(startBuff, endBuff));
			bytesReaded = bytesReaded + 1*normalsByteValues_count; // updating data.***
		}

		// 3) Colors.*******************************************************************************************************
		var hasColors = readWriter.readUInt8(this.dataArraybuffer, bytesReaded, bytesReaded+1); bytesReaded += 1;
		if(hasColors) {
			vertexCount = readWriter.readUInt32(this.dataArraybuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
			var colorsByteValues_count = vertexCount * 4;
			var startBuff = bytesReaded;
			var endBuff = bytesReaded + 1*colorsByteValues_count;
			vbo_vi_cacheKey.col_vboDataArray = new Uint8Array(this.dataArraybuffer.slice(startBuff, endBuff));
			bytesReaded = bytesReaded + 1*colorsByteValues_count; // updating data.***
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

	// create the default blocks_lists.*****************************
	//this._blocksList_Container = new BlocksListsContainer();
	//this._blocksList_Container.newBlocksList("Blocks1");
	//this._blocksList_Container.newBlocksList("Blocks2");
	//this._blocksList_Container.newBlocksList("Blocks3");
	//this._blocksList_Container.newBlocksList("BlocksBone");
	//this._blocksList_Container.newBlocksList("Blocks4");

	// create the references lists.*********************************
	//this._neoRefLists_Container = new NeoReferencesListsContainer(); // Exterior and bone objects.***
	this.currentRenderablesNeoRefLists = []; // test. no used. waiting for background process.***
	this.preExtractedLowestOctreesArray = []; // test. no used. waiting for background process.***
	this.motherNeoReferencesArray = []; // asimetric mode.***
	this.motherBlocksArray = []; // asimetric mode.***

	// Textures loaded.***************************************************
	this.textures_loaded = [];

	// The octree.********************************************************
	this.octree; // f4d_octree. ***
	this.octreeLoadedAllFiles = false;

	this.allFilesLoaded = false; // no used yet...
	this.isReadyToRender = false; // no used yet...

	this.moveVector; // no used.***

	// aditional data.****************************************************


	// The simple building.***********************************************
	this.neoSimpleBuilding; // this is a simpleBuilding for Buildings with texture.***

	// The lodBuildings.***
	this.lod2Building;
	this.lod3Building;

	// SCRATCH.*********************************
	this.point3d_scratch = new Point3D();
	this.point3d_scratch_2 = new Point3D();
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns neoRef
 */
NeoBuilding.prototype.setRenderedFalseToAllReferences = function() {
	var neoRefs_count = this.motherNeoReferencesArray.length;
	for(var i=0; i<neoRefs_count; i++)
	{
		var neoRef = this.motherNeoReferencesArray[i];
		neoRef.bRendered = false;
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param texture 변수
 * @returns tex_id
 */
NeoBuilding.prototype.getTextureId = function(texture) {
	/*
	this.texture_type_name = "";
	this.texture_image_fileName = "";
	this.tex_id = undefined;
	*/
	var tex_id;
	var textures_loaded_count = this.textures_loaded.length;
	var find = false;
	var i=0;
	while(!find && i<textures_loaded_count) {
		if(this.textures_loaded[i].texture_image_fileName == texture.texture_image_fileName) {
			find = true;
			tex_id = this.textures_loaded[i].tex_id;
		}
		i++;
	}

	return tex_id;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param eye_x 변수
 * @param eye_y 변수
 * @param eye_z 변수
 */
NeoBuilding.prototype.updateCurrentVisibleIndicesExterior = function(eye_x, eye_y, eye_z) {
	this._neoRefLists_Container.updateCurrentVisibleIndicesOfLists(eye_x, eye_y, eye_z);
};

/**
 * 어떤 일을 하고 있습니까?
 */
NeoBuilding.prototype.updateCurrentAllIndicesExterior = function() {
	this._neoRefLists_Container.updateCurrentAllIndicesOfLists();
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns metaData.bbox.isPoint3dInside(eye_x, eye_y, eye_z);
 */
NeoBuilding.prototype.isCameraInsideOfBuilding = function(eye_x, eye_y, eye_z) {
	return this.metaData.bbox.isPoint3dInside(eye_x, eye_y, eye_z);
};

/**
 * 어떤 일을 하고 있습니까?
 * @param absolute_eye_x 변수
 * @param absolute_eye_y 변수
 * @param absolute_eye_z 변수
 * @returns point3d_scrath_2
 */
NeoBuilding.prototype.getTransformedRelativeEyePositionToBuilding = function(absolute_eye_x, absolute_eye_y, absolute_eye_z) {
	// 1rst, calculate the relative eye position.***
	var buildingPosition = this.buildingPosition;
	var relative_eye_pos_x = absolute_eye_x - buildingPosition.x;
	var relative_eye_pos_y = absolute_eye_y - buildingPosition.y;
	var relative_eye_pos_z = absolute_eye_z - buildingPosition.z;

	if(this.buildingPosMat_inv == undefined) {
		this.buildingPosMat_inv = new Matrix4();
		this.buildingPosMat_inv.setByFloat32Array(this.move_matrix_inv);
	}

	this.point3d_scratch.set(relative_eye_pos_x, relative_eye_pos_y, relative_eye_pos_z);
	this.point3d_scratch_2 = this.buildingPosMat_inv.transformPoint3D(this.point3d_scratch, this.point3d_scratch_2);

	return this.point3d_scratch_2;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param absolute_eye_x 변수
 * @param absolute_eye_y 변수
 * @param absolute_eye_z 변수
 * @returns point3d_scrath_2
 */
NeoBuilding.prototype.getTransformedRelativeCameraToBuilding = function(absoluteCamera, resultCamera) {
	// Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.***
	// Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.***
	// Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.***
	// 1rst, calculate the relative eye position.***
	var buildingPosition = this.buildingPosition;

	if(this.buildingPosMat_inv == undefined) {
		this.buildingPosMat_inv = new Matrix4();
		this.buildingPosMat_inv.setByFloat32Array(this.move_matrix_inv); // this is rotationMatrixInverse.***
	}

	this.point3d_scratch.set(absoluteCamera.position.x - buildingPosition.x, absoluteCamera.position.y - buildingPosition.y, absoluteCamera.position.z - buildingPosition.z);
	resultCamera.position = this.buildingPosMat_inv.transformPoint3D(this.point3d_scratch, resultCamera.position);

	this.point3d_scratch.set(absoluteCamera.direction.x, absoluteCamera.direction.y, absoluteCamera.direction.z);
	resultCamera.direction = this.buildingPosMat_inv.transformPoint3D(this.point3d_scratch, resultCamera.direction);

	this.point3d_scratch.set(absoluteCamera.up.x, absoluteCamera.up.y, absoluteCamera.up.z);
	resultCamera.up = this.buildingPosMat_inv.transformPoint3D(this.point3d_scratch, resultCamera.up);

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

	this.neoBuildings_Array = [];
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns neoBuilding
 */
NeoBuildingsList.prototype.newNeoBuilding = function() {
	var neoBuilding = new NeoBuilding();
	this.neoBuildings_Array.push(neoBuilding);
	return neoBuilding;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns neoBuilding
 */
NeoBuildingsList.prototype.getNeoBuildingByTypeId = function(buildingType, buildingId) {
	var resultBuilding;
	var buildingsCount = this.neoBuildings_Array.length;
	var found = false;
	var i=0;
	while(!found && i<buildingsCount)
	{
		if(this.neoBuildings_Array[i].buildingType == buildingType && this.neoBuildings_Array[i].buildingId == buildingId)
		{
			found = true;
			resultBuilding = this.neoBuildings_Array[i];
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
	var buildingsCount = this.neoBuildings_Array.length;

	for(var i=0; i<buildingsCount; i++)
	{
		this.neoBuildings_Array[i].frustumCulled = bFrustumCulled;
	}

};
