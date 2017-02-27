'use strict';

/**
 * 어떤 일을 하고 있습니까?
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
	this.fileLoadState = 0; // 0 = no started to load. 1 = started loading. 2 = finished loading.***
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
	
	if(f4dReadWriter == undefined)
		f4dReadWriter = new ReaderWriter();
	
	// 1) Version(5 chars).***********
	for(var j=0; j<version_string_length; j++){
		this.version += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1;
	}
	
	// 3) Global unique ID.*********************
	if(this.guid == undefined)
		this.guid ="";
	
	intAux_scratch = f4dReadWriter.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
	for(var j=0; j<intAux_scratch; j++){
		this.guid += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1;
	}
	
	// 4) Location.*************************
	if(this.longitude == undefined)
	{
		this.longitude = (new Float64Array(arrayBuffer.slice(bytes_readed, bytes_readed+8)))[0]; bytes_readed += 8;
	}
	else
		bytes_readed += 8;
		
	if(this.latitude == undefined)
	{
		this.latitude = (new Float64Array(arrayBuffer.slice(bytes_readed, bytes_readed+8)))[0]; bytes_readed += 8;
	}
	else
		bytes_readed += 8;
	
	if(this.altitude == undefined)
	{
		this.altitude = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;
	}
	else
		bytes_readed += 4;
	
	//this.altitude += 20.0; // TEST.***
	
	
	//header._elevation += 70.0; // delete this. TEST.!!!
	if(this.bbox == undefined)
		this.bbox = new BoundingBox();
	
	// 6) BoundingBox.************************
	this.bbox._minX = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
	this.bbox._minY = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
	this.bbox._minZ = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
	this.bbox._maxX = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
	this.bbox._maxY = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;
	this.bbox._maxZ = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;
	
	// TEST. PROVISIONAL. DELETE.***
	//this.bbox.expand(20.0);
	//-------------------------------
	
	var imageLODs_count = f4dReadWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;
	
	// 7) Buildings octree mother size.***
	this.oct_min_x = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
	this.oct_min_y = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
	this.oct_min_z = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
	this.oct_max_x = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
	this.oct_max_y = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
	this.oct_max_z = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
	
	var isLarge = false;
	if(this.bbox._maxX - this.bbox._minX > 40.0 || this.bbox._maxY - this.bbox._minY > 40.0)
	{
		isLarge = true;
	}
	
	if(!isLarge && this.bbox._maxZ - this.bbox._minZ < 30.0)
	{
		this.isSmall = true;
	}
	
	/*
	// Now, must calculate some params of the project.**********************************************
	// 0) PositionMatrix.************************************************************************
	// Determine the elevation of the position.***********************************************************
	var position = Cesium.Cartesian3.fromDegrees(header._longitude, header._latitude, header._elevation);
	var cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(position);
    var height = cartographic.height;
	// End Determine the elevation of the position.-------------------------------------------------------
	
	//var position = Cesium.Cartesian3.fromDegrees(header._longitude, header._latitude, header._elevation);  // Original.***
	position = Cesium.Cartesian3.fromDegrees(header._longitude, header._latitude, height); 
	
	BR_Project._buildingPosition = position; 
	
	// High and Low values of the position.****************************************************
	var splitValue = Cesium.EncodedCartesian3.encode(position);
	var splitVelue_X  = Cesium.EncodedCartesian3.encode(position.x);
	var splitVelue_Y  = Cesium.EncodedCartesian3.encode(position.y);
	var splitVelue_Z  = Cesium.EncodedCartesian3.encode(position.z);
	
	BR_Project._buildingPositionHIGH = new Float32Array(3);
	BR_Project._buildingPositionHIGH[0] = splitVelue_X.high;
	BR_Project._buildingPositionHIGH[1] = splitVelue_Y.high;
	BR_Project._buildingPositionHIGH[2] = splitVelue_Z.high;
	
	BR_Project._buildingPositionLOW = new Float32Array(3);
	BR_Project._buildingPositionLOW[0] = splitVelue_X.low;
	BR_Project._buildingPositionLOW[1] = splitVelue_Y.low;
	BR_Project._buildingPositionLOW[2] = splitVelue_Z.low;
	
	this.fileBytesReaded = bytes_readed;
	*/
};

// F4D ReferenceObject.************************************************************************************************************************* // 
/**
 * 어떤 일을 하고 있습니까?
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
	updateCurrentAllIndicesOfLists:  function()
		{
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
 */
 var LodBuilding = function()
 {
	// this class is for use for LOD2 and LOD3 buildings.***
	// provisionally use this class, but in the future use "NeoSimpleBuilding".***
	this.dataArraybuffer; // binary data.***
	this.vbo_vicks_container = new VBOVertexIdxCacheKeysContainer();
	this.fileLoadState = 0;
 };
 
 LodBuilding.prototype.parseArrayBuffer = function(gl, f4dReadWriter)
 {
	if(this.fileLoadState == 2)// file loaded.***
	{
		this.fileLoadState = 3;// 3 = parsing started.***
		var bytesReaded = 0;
		
		// 1rst, read bbox.***
		var bbox = new BoundingBox();
		bbox._minX = new Float32Array(this.dataArraybuffer.slice(bytesReaded, bytesReaded+4)); bytesReaded += 4;
		bbox._minY = new Float32Array(this.dataArraybuffer.slice(bytesReaded, bytesReaded+4)); bytesReaded += 4;
		bbox._minZ = new Float32Array(this.dataArraybuffer.slice(bytesReaded, bytesReaded+4)); bytesReaded += 4;
		  
		bbox._maxX = new Float32Array(this.dataArraybuffer.slice(bytesReaded, bytesReaded+4)); bytesReaded += 4;
		bbox._maxY = new Float32Array(this.dataArraybuffer.slice(bytesReaded, bytesReaded+4)); bytesReaded += 4;
		bbox._maxZ = new Float32Array(this.dataArraybuffer.slice(bytesReaded, bytesReaded+4)); bytesReaded += 4;
		
		// 1) Positions.************************************************************************************************
		var vertexCount = f4dReadWriter.readUInt32(this.dataArraybuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
		var verticesFloatValues_count = vertexCount * 3;
		var startBuff = bytesReaded;
		var endBuff = bytesReaded + 4*verticesFloatValues_count;
		var vbo_vi_cacheKey = this.vbo_vicks_container.newVBOVertexIdxCacheKey();
		vbo_vi_cacheKey.pos_vboDataArray = new Float32Array(this.dataArraybuffer.slice(startBuff, endBuff));
		bytesReaded = bytesReaded + 4*verticesFloatValues_count; // updating data.***
		
		vbo_vi_cacheKey.vertexCount = vertexCount;
		
		// 2) Normals.*****************************************************************************************************
		var hasNormals = f4dReadWriter.readUInt8(this.dataArraybuffer, bytesReaded, bytesReaded+1); bytesReaded += 1;
		if(hasNormals)
		{
			vertexCount = f4dReadWriter.readUInt32(this.dataArraybuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
			var normalsByteValues_count = vertexCount * 3;
			var startBuff = bytesReaded;
			var endBuff = bytesReaded + 1*normalsByteValues_count;
			var vbo_vi_cacheKey = this.vbo_vicks_container.newVBOVertexIdxCacheKey();
			vbo_vi_cacheKey.nor_vboDataArray = new Int8Array(this.dataArraybuffer.slice(startBuff, endBuff));
			bytesReaded = bytesReaded + 1*normalsByteValues_count; // updating data.***
		}
		
		// 3) Colors.*******************************************************************************************************
		var hasColors = f4dReadWriter.readUInt8(this.dataArraybuffer, bytesReaded, bytesReaded+1); bytesReaded += 1;
		if(hasColors)
		{
			vertexCount = f4dReadWriter.readUInt32(this.dataArraybuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
			var colorsByteValues_count = vertexCount * 4;
			var startBuff = bytesReaded;
			var endBuff = bytesReaded + 1*colorsByteValues_count;
			var vbo_vi_cacheKey = this.vbo_vicks_container.newVBOVertexIdxCacheKey();
			vbo_vi_cacheKey.nor_vboDataArray = new Int8Array(this.dataArraybuffer.slice(startBuff, endBuff));
			bytesReaded = bytesReaded + 1*colorsByteValues_count; // updating data.***
		}
		
		// 4) TexCoord.****************************************************************************************************
		var hasTexCoord = f4dReadWriter.readUInt8(this.dataArraybuffer, bytesReaded, bytesReaded+1); bytesReaded += 1;
		if(hasTexCoord)
		{
			// TODO:
		}
		
		this.fileLoadState = 4; // 4 = parsing finished.***
	}	
 };

/**
 * 어떤 일을 하고 있습니까?
 */
var NeoBuilding = function() {
	if(!(this instanceof NeoBuilding)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.metaData;
	
	this._buildingPosition;
	this._buildingPositionHIGH;
	this._buildingPositionLOW;
	
	this.move_matrix; // PositionMatrix (only rotations).***
	this.move_matrix_inv; // Inverse of PositionMatrix.***
	this.buildingPosMat_inv; // f4d matrix4.***
	this.transfMat_inv; // cesium matrix4.***
	this.f4dTransfMat; // f4d matrix4.***
	this.f4dTransfMatInv; // f4d matrix4.***
	
	// create the default blocks_lists.*****************************
	this._blocksList_Container = new BlocksListsContainer();
	this._blocksList_Container.newBlocksList("Blocks1");
	this._blocksList_Container.newBlocksList("Blocks2");
	this._blocksList_Container.newBlocksList("Blocks3");
	this._blocksList_Container.newBlocksList("BlocksBone");
	this._blocksList_Container.newBlocksList("Blocks4");
	//--------------------------------------------------------------
	
	// create the references lists.*********************************
	this._neoRefLists_Container = new NeoReferencesListsContainer(); // Exterior and bone objects.***
	this.currentRenderablesNeoRefLists = [];
	
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
	while(!find && i<textures_loaded_count)
	{
		if(this.textures_loaded[i].texture_image_fileName == texture.texture_image_fileName)
		{
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
	
	if(this.buildingPosMat_inv == undefined)
	{
		this.buildingPosMat_inv = new Matrix4();
		this.buildingPosMat_inv.setByFloat32Array(this.move_matrix_inv);
	}

	this.point3d_scratch.set(relative_eye_pos_x, relative_eye_pos_y, relative_eye_pos_z);
	this.point3d_scratch_2 = this.buildingPosMat_inv.transformPoint3D(this.point3d_scratch, this.point3d_scratch_2);
  
	return this.point3d_scratch_2;
};

/**
 * 어떤 일을 하고 있습니까?
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
