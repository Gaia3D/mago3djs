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
 * @param readWriter 변수
 */
MetaData.prototype.parseFileHeader = function(arrayBuffer, readWriter) {
	var version_string_length = 5;
	var intAux_scratch = 0;
	//var header = BR_Project._header;
	//var arrayBuffer = this.fileArrayBuffer;
	//var bytesReaded = this.fileBytesReaded;
	var bytesReaded = 0;
	
	if(readWriter == undefined) readWriter = new ReaderWriter();
	
	// 1) Version(5 chars).***********
	for(var j=0; j<version_string_length; j++){
		this.version += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytesReaded, bytesReaded+ 1)));bytesReaded += 1;
	}
	
	// 3) Global unique ID.*********************
	if(this.guid == undefined)
		this.guid ="";
	
	intAux_scratch = readWriter.readInt32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
	for(var j=0; j<intAux_scratch; j++){
		this.guid += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytesReaded, bytesReaded+ 1)));bytesReaded += 1;
	}
	
	// 4) Location.*************************
	if(this.longitude == undefined)
	{
		this.longitude = (new Float64Array(arrayBuffer.slice(bytesReaded, bytesReaded+8)))[0]; bytesReaded += 8;
	}
	else
		bytesReaded += 8;
		
	if(this.latitude == undefined)
	{
		this.latitude = (new Float64Array(arrayBuffer.slice(bytesReaded, bytesReaded+8)))[0]; bytesReaded += 8;
	}
	else
		bytesReaded += 8;
	
	if(this.altitude == undefined)
	{
		this.altitude = (new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
	}
	else
		bytesReaded += 4;
	
	//this.altitude += 20.0; // TEST.***
	
	
	//header._elevation += 70.0; // delete this. TEST.!!!
	if(this.bbox == undefined)
		this.bbox = new BoundingBox();
	
	// 6) BoundingBox.************************
	this.bbox.minX = (new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4; 
	this.bbox.minY = (new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4; 
	this.bbox.minZ = (new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4; 
	this.bbox.maxX = (new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4; 
	this.bbox.maxY = (new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
	this.bbox.maxZ = (new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
	
	// TEST. PROVISIONAL. DELETE.***
	//this.bbox.expand(20.0);
	//-------------------------------
	
	readWriter.readUInt8(arrayBuffer, bytesReaded, bytesReaded+1); bytesReaded += 1;
	
	// 7) Buildings octree mother size.***
	this.oct_min_x = (new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4; 
	this.oct_min_y = (new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4; 
	this.oct_min_z = (new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4; 
	this.oct_max_x = (new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4; 
	this.oct_max_y = (new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4; 
	this.oct_max_z = (new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4; 
	
	var isLarge = false;
	if(this.bbox.maxX - this.bbox.minX > 40.0 || this.bbox.maxY - this.bbox.minY > 40.0)
	{
		isLarge = true;
	}
	
	if(!isLarge && this.bbox.maxZ - this.bbox.minZ < 30.0)
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
	
	BR_Project.buildingPosition = position; 
	
	// High and Low values of the position.****************************************************
	var splitValue = Cesium.EncodedCartesian3.encode(position);
	var splitVelue_X  = Cesium.EncodedCartesian3.encode(position.x);
	var splitVelue_Y  = Cesium.EncodedCartesian3.encode(position.y);
	var splitVelue_Z  = Cesium.EncodedCartesian3.encode(position.z);
	
	BR_Project.buildingPositionHIGH = new Float32Array([splitVelue_X.high, splitVelue_Y.high, splitVelue_Z.high]);
	BR_Project.buildingPositionLOW = new Float32Array([splitVelue_X.low, splitVelue_Y.low, splitVelue_Z.low]);
	
	this.fileBytesReaded = bytesReaded;
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
	
 };

/**
 * 어떤 일을 하고 있습니까?
 */
var NeoBuilding = function() {
	if(!(this instanceof NeoBuilding)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.metaData;
	
	this.buildingPosition;
	this.buildingPositionHIGH;
	this.buildingPositionLOW;
	
	this.move_matrix; // PositionMatrix (only rotations).***
	this.move_matrix_inv; // Inverse of PositionMatrix.***
	this.buildingPosMat_inv; // f4d matrix4.***
	this.transfMat_inv; // cesium matrix4.***
	this.f4dTransfMat; // f4d matrix4.***
	this.f4dTransfMatInv; // f4d matrix4.***
	
	// create the default blocks_lists.*****************************
	this.blocksListContainer = new BlocksListsContainer();
	this.blocksListContainer.newBlocksList("Blocks1");
	this.blocksListContainer.newBlocksList("Blocks2");
	this.blocksListContainer.newBlocksList("Blocks3");
	this.blocksListContainer.newBlocksList("BlocksBone");
	this.blocksListContainer.newBlocksList("Blocks4");
	//--------------------------------------------------------------
	
	// create the references lists.*********************************
	this.neoRefListsContainer = new NeoReferencesListsContainer(); // Exterior and bone objects.***
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
	this.neoRefListsContainer.updateCurrentVisibleIndicesOfLists(eye_x, eye_y, eye_z);
};

/**
 * 어떤 일을 하고 있습니까?
 */
NeoBuilding.prototype.updateCurrentAllIndicesExterior = function() {
	this.neoRefListsContainer.updateCurrentAllIndicesOfLists();
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
