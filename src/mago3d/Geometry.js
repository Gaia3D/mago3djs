'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class MetaData
 */
var MetaData = function() {
	if(!(this instanceof MetaData)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.guid; // must be undefined initially.***
	this.version = "";
	
	this.latitude;
	this.longitude;
	this.altitude;
	
	this.bbox; // BoundingBox.***
	this.imageLodCount;
	
	// Buildings octree mother size.***
	this.oct_min_x = 0.0;
	this.oct_max_x = 0.0;
	this.oct_min_y = 0.0;
	this.oct_max_y = 0.0;
	this.oct_min_z = 0.0;
	this.oct_max_z = 0.0;
	
	this.isSmall = false;
	this.fileLoadState = CODE.fileLoadState.READY;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param arrayBuffer 변수
 * @param f4dReadWriter 변수
 */
MetaData.prototype.parseFileHeader = function(arrayBuffer, f4dReadWriter) {
	var version_string_length = 5;
	var intAux_scratch = 0;
	var auxScratch;
	//var header = BR_Project._header;
	//var arrayBuffer = this.fileArrayBuffer;
	//var bytes_readed = this.fileBytesReaded;
	var bytes_readed = 0;
	
	if(f4dReadWriter == undefined) f4dReadWriter = new ReaderWriter();
	
	// 1) Version(5 chars).***********
	for(var j=0; j<version_string_length; j++){
		this.version += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1;
	}
	
	// 3) Global unique ID.*********************
	if(this.guid == undefined) this.guid ="";
	
	intAux_scratch = f4dReadWriter.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
	for(var j=0; j<intAux_scratch; j++){
		this.guid += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1;
	}
	
	// 4) Location.*************************
	if(this.longitude == undefined) {
		this.longitude = (new Float64Array(arrayBuffer.slice(bytes_readed, bytes_readed+8)))[0]; bytes_readed += 8;
	} else bytes_readed += 8;
		
	if(this.latitude == undefined) {
		this.latitude = (new Float64Array(arrayBuffer.slice(bytes_readed, bytes_readed+8)))[0]; bytes_readed += 8;
	} else bytes_readed += 8;
	
	if(this.altitude == undefined) {
		this.altitude = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;
	} else bytes_readed += 4;
	
	//this.altitude += 20.0; // TEST.***
	
	//header._elevation += 70.0; // delete this. TEST.!!!
	if(this.bbox == undefined) this.bbox = new BoundingBox();
	
	// 6) BoundingBox.************************
	this.bbox.minX = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
	this.bbox.minY = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
	this.bbox.minZ = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
	this.bbox.maxX = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
	this.bbox.maxY = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;
	this.bbox.maxZ = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;
	
	// TEST. PROVISIONAL. DELETE.***
	//this.bbox.expand(20.0);
	var imageLODs_count = f4dReadWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;
	
	// 7) Buildings octree mother size.***
	this.oct_min_x = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
	this.oct_min_y = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
	this.oct_min_z = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
	this.oct_max_x = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
	this.oct_max_y = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
	this.oct_max_z = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
	
	var isLarge = false;
	if(this.bbox.maxX - this.bbox.minX > 40.0 || this.bbox.maxY - this.bbox.minY > 40.0) {
		isLarge = true;
	}
	
	if(!isLarge && this.bbox.maxZ - this.bbox.minZ < 30.0) {
		this.isSmall = true;
	}
	
	return bytes_readed;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param arrayBuffer 변수
 * @param f4dReadWriter 변수
 */
MetaData.prototype.parseFileHeaderAsimetricVersion = function(arrayBuffer, f4dReadWriter) {
	var version_string_length = 5;
	var intAux_scratch = 0;
	var auxScratch;
	//var header = BR_Project._header;
	//var arrayBuffer = this.fileArrayBuffer;
	//var bytes_readed = this.fileBytesReaded;
	var bytes_readed = 0;
	
	if(f4dReadWriter == undefined) f4dReadWriter = new ReaderWriter();
	
	// 1) Version(5 chars).***********
	for(var j=0; j<version_string_length; j++){
		this.version += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1;
	}
	
	// 3) Global unique ID.*********************
	if(this.guid == undefined) this.guid ="";
	
	intAux_scratch = f4dReadWriter.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
	for(var j=0; j<intAux_scratch; j++){
		this.guid += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1;
	}
	
	// 4) Location.*************************
	if(this.longitude == undefined) {
		this.longitude = (new Float64Array(arrayBuffer.slice(bytes_readed, bytes_readed+8)))[0]; bytes_readed += 8;
	} else bytes_readed += 8;
		
	if(this.latitude == undefined) {
		this.latitude = (new Float64Array(arrayBuffer.slice(bytes_readed, bytes_readed+8)))[0]; bytes_readed += 8;
	} else bytes_readed += 8;
	
	if(this.altitude == undefined) {
		this.altitude = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;
	} else bytes_readed += 4;
	
	//this.altitude += 20.0; // TEST.***
	
	//header._elevation += 70.0; // delete this. TEST.!!!
	if(this.bbox == undefined) this.bbox = new BoundingBox();
	
	// 6) BoundingBox.************************
	this.bbox.minX = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
	this.bbox.minY = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
	this.bbox.minZ = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
	this.bbox.maxX = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
	this.bbox.maxY = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;
	this.bbox.maxZ = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;
	
	// TEST. PROVISIONAL. DELETE.***
	//this.bbox.expand(20.0);
	
	//var imageLODs_count = f4dReadWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;
	
	//// 7) Buildings octree mother size.***
	//this.oct_min_x = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
	//this.oct_min_y = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
	//this.oct_min_z = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
	//this.oct_max_x = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
	//this.oct_max_y = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
	//this.oct_max_z = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
	
	var isLarge = false;
	if(this.bbox.maxX - this.bbox.minX > 40.0 || this.bbox.maxY - this.bbox.minY > 40.0) {
		isLarge = true;
	}
	
	if(!isLarge && this.bbox.maxZ - this.bbox.minZ < 30.0) {
		this.isSmall = true;
	}
	
	return bytes_readed;
};

// F4D ReferenceObject.************************************************************************************************************************* // 
/**
 * 어떤 일을 하고 있습니까?
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
 
LodBuilding.prototype.parseArrayBuffer = function(gl, f4dReadWriter) {
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
		var vertexCount = f4dReadWriter.readUInt32(this.dataArraybuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
		var verticesFloatValues_count = vertexCount * 3;
		var startBuff = bytesReaded;
		var endBuff = bytesReaded + 4*verticesFloatValues_count;
		vbo_vi_cacheKey.pos_vboDataArray = new Float32Array(this.dataArraybuffer.slice(startBuff, endBuff));
		bytesReaded = bytesReaded + 4*verticesFloatValues_count; // updating data.***
		
		vbo_vi_cacheKey.vertexCount = vertexCount;
		
		// 2) Normals.*****************************************************************************************************
		var hasNormals = f4dReadWriter.readUInt8(this.dataArraybuffer, bytesReaded, bytesReaded+1); bytesReaded += 1;
		if(hasNormals) {
			vertexCount = f4dReadWriter.readUInt32(this.dataArraybuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
			var normalsByteValues_count = vertexCount * 3;
			var startBuff = bytesReaded;
			var endBuff = bytesReaded + 1*normalsByteValues_count;
			vbo_vi_cacheKey.nor_vboDataArray = new Int8Array(this.dataArraybuffer.slice(startBuff, endBuff));
			bytesReaded = bytesReaded + 1*normalsByteValues_count; // updating data.***
		}
		
		// 3) Colors.*******************************************************************************************************
		var hasColors = f4dReadWriter.readUInt8(this.dataArraybuffer, bytesReaded, bytesReaded+1); bytesReaded += 1;
		if(hasColors) {
			vertexCount = f4dReadWriter.readUInt32(this.dataArraybuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
			var colorsByteValues_count = vertexCount * 4;
			var startBuff = bytesReaded;
			var endBuff = bytesReaded + 1*colorsByteValues_count;
			vbo_vi_cacheKey.col_vboDataArray = new Uint8Array(this.dataArraybuffer.slice(startBuff, endBuff));
			bytesReaded = bytesReaded + 1*colorsByteValues_count; // updating data.***
		}
		
		// 4) TexCoord.****************************************************************************************************
		var hasTexCoord = f4dReadWriter.readUInt8(this.dataArraybuffer, bytesReaded, bytesReaded+1); bytesReaded += 1;
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
	this._buildingPosition; // TODO: put this inside of a geoLocationData.***
	this._buildingPositionHIGH; // TODO: put this inside of a geoLocationData.***
	this._buildingPositionLOW;  // TODO: put this inside of a geoLocationData.***
	this.bbox;
	
	this.move_matrix; // PositionMatrix (only rotations).*** // TODO: put this inside of a geoLocationData.***
	this.move_matrix_inv; // Inverse of PositionMatrix.***   // TODO: put this inside of a geoLocationData.***
	this.buildingPosMat_inv; // f4d matrix4.***              // TODO: put this inside of a geoLocationData.***
	this.transfMat_inv; // cesium matrix4.***                // TODO: put this inside of a geoLocationData.***
	this.f4dTransfMat; // f4d matrix4.***                    // TODO: put this inside of a geoLocationData.***
	this.f4dTransfMatInv; // f4d matrix4.***                 // TODO: put this inside of a geoLocationData.***
	
	this.geoLocationDataAux; // there are positions and matrices.***
	
	// create the default blocks_lists.*****************************
	this._blocksList_Container = new BlocksListsContainer();
	this._blocksList_Container.newBlocksList("Blocks1");
	//this._blocksList_Container.newBlocksList("Blocks2");
	//this._blocksList_Container.newBlocksList("Blocks3");
	//this._blocksList_Container.newBlocksList("BlocksBone");
	//this._blocksList_Container.newBlocksList("Blocks4");
	
	// create the references lists.*********************************
	this._neoRefLists_Container = new NeoReferencesListsContainer(); // Exterior and bone objects.***
	this.currentRenderablesNeoRefLists = [];
	this.preExtractedLowestOctreesArray = [];
	
	// Textures loaded.***************************************************
	this.textures_loaded = [];
	
	// The octree.********************************************************
	this.octree; // f4d_octree. Interior objects.***
	this.octreeLoadedAllFiles = false;
	
	this.buildingFileName = "";
	
	this.allFilesLoaded = false;
	this.isReadyToRender = false;
	
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
	var buildingPosition = this._buildingPosition;
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
	// 1rst, calculate the relative eye position.***
	var buildingPosition = this._buildingPosition;
	
	if(this.buildingPosMat_inv == undefined)
	{
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
