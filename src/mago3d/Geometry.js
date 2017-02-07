'use strict';

/**
 * 어떤 일을 하고 있습니까?
 */
var MetaData = function() {
	if(!(this instanceof MetaData)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.guid = "";
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
	intAux_scratch = f4dReadWriter.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
	for(var j=0; j<intAux_scratch; j++){
		this.guid += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1;
	}
	
	// 4) Location.*************************
	this.longitude = (new Float64Array(arrayBuffer.slice(bytes_readed, bytes_readed+8)))[0]; bytes_readed += 8;
	this.latitude = (new Float64Array(arrayBuffer.slice(bytes_readed, bytes_readed+8)))[0]; bytes_readed += 8;
	this.elevation = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;
	
	
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

// F4D ReferenceObject.************************************************************************************************************************* // 
/**
 * 어떤 일을 하고 있습니까?
 */
var NeoReference = function() {
	if(!(this instanceof NeoReference)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	// 1) Object ID.***
	this._id = 0;
	
	// 2) Block Idx.***
	this._block_idx = -1;
	
	// 3) Transformation Matrix.***
	this._matrix4 = new Matrix4();
	this._originalMatrix4 = new Matrix4(); // 
	
	// 4) Tex coords cache_key.***
	this.MESH_TEXCOORD_cacheKey;
	
	// 5) The texture image.***
	this.hasTexture = false;
	this.texture; // Texture
	
	// 6) 1 color.***
	this.color4; //new Color();
	
	// 7) selection color.***
	this.selColor4; //new Color(); // use for selection only.***
	
	this.vertex_count = 0;// provisional. for checking vertexCount of the block.*** delete this.****
	
	// 8) movement of the object.***
	this.moveVector; // Point3D.***
};

/**
 * 어떤 일을 하고 있습니까?
 */
NeoReference.prototype.multiplyTransformMatrix = function(matrix) {
	var multipliedMat = this._originalMatrix4.getMultipliedByMatrix(matrix); // Original.***
	this._matrix4 = multipliedMat;
};

// F4D References list.************************************************************************************************************************* // 
/**
 * 어떤 일을 하고 있습니까?
 */
var NeoReferencesList = function() {
	if(!(this instanceof NeoReferencesList)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.name = "";
	this.neoRefs_Array = [];
	this.blocksList;
	this.lod_level = -1;
	
	this.exterior_ocCullOctree = new OcclusionCullingOctreeCell(); 
	this.interior_ocCullOctree = new OcclusionCullingOctreeCell(); 
	
	this._currentVisibleIndices = []; // Determined by occlusion culling.***
	this._currentVisibleIndicesSC = []; // Determined by occlusion culling.***
	this._currentVisibleIndicesSC_2 = []; // Determined by occlusion culling.***
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns neoRef
 */
NeoReferencesList.prototype.newNeoReference = function() {
	var neoRef = new NeoReference();
	this.neoRefs_Array.push(neoRef);
	return neoRef;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param matrix 변수
 */
NeoReferencesList.prototype.multiplyReferencesMatrices = function(matrix) {
	var neoRefs_count = this.neoRefs_Array.length;
	for(var i=0; i<neoRefs_count; i++)
	{
		var neoRef = this.neoRefs_Array[i];
		neoRef.multiplyTransformMatrix(matrix);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param eye_x 변수
 * @param eye_y 변수
 * @param eye_z 변수
 */
NeoReferencesList.prototype.updateCurrentVisibleIndicesInterior = function(eye_x, eye_y, eye_z) {
	this._currentVisibleIndices = this.interior_ocCullOctree.getIndicesVisiblesForEye(eye_x, eye_y, eye_z, this._currentVisibleIndicesSC_2);
};

/**
 * 어떤 일을 하고 있습니까?
 */
NeoReferencesList.prototype.updateCurrentAllIndicesInterior = function() {
	this._currentVisibleIndices.length = 0;
	var neoRefs_count = this.neoRefs_Array.length;
	for(var i=0; i<neoRefs_count; i++)
	{
		this._currentVisibleIndices.push(i);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param eye_x 변수
 * @param eye_y 변수
 * @param eye_z 변수
 */
NeoReferencesList.prototype.updateCurrentVisibleIndicesExterior = function(eye_x, eye_y, eye_z) {
	this._currentVisibleIndices = this.exterior_ocCullOctree.getIndicesVisiblesForEye(eye_x, eye_y, eye_z, this._currentVisibleIndicesSC_2);
};

/**
 * 어떤 일을 하고 있습니까?
 * @param eye_x 변수
 * @param eye_y 변수
 * @param eye_z 변수
 */
NeoReferencesList.prototype.updateCurrentVisibleIndices = function(eye_x, eye_y, eye_z) {
	this._currentVisibleIndicesSC = this.exterior_ocCullOctree.getIndicesVisiblesForEye(eye_x, eye_y, eye_z, this._currentVisibleIndicesSC);
	this._currentVisibleIndicesSC_2 = this.interior_ocCullOctree.getIndicesVisiblesForEye(eye_x, eye_y, eye_z, this._currentVisibleIndicesSC_2);
	this._currentVisibleIndices = this._currentVisibleIndicesSC.concat(this._currentVisibleIndicesSC_2);
};

/**
 * 어떤 일을 하고 있습니까?
 * @param GL 변수
 * @param arrayBuffer 변수
 * @param neoBuilding 변수
 * @param f4dReadWriter 변수
 */
NeoReferencesList.prototype.parseArrayBuffer = function(GL, arrayBuffer, neoBuilding, f4dReadWriter) {
	var startBuff;
	var endBuff;
	var bytes_readed = 0;
	var neoRefs_count = f4dReadWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
	
	for(var i=0; i<neoRefs_count; i++)
	{
		var neoRef = this.newNeoReference();

		// 1) Id.***
		var ref_ID =  f4dReadWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._id = ref_ID;
		
		// 2) Block's Idx.***
		var blockIdx =   f4dReadWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._block_idx = blockIdx;
		
		// 3) Transform Matrix4.***
		neoRef._matrix4._floatArrays[0] =  f4dReadWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._matrix4._floatArrays[1] =  f4dReadWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._matrix4._floatArrays[2] =  f4dReadWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._matrix4._floatArrays[3] =  f4dReadWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		
		neoRef._matrix4._floatArrays[4] =  f4dReadWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._matrix4._floatArrays[5] =  f4dReadWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._matrix4._floatArrays[6] =  f4dReadWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._matrix4._floatArrays[7] =  f4dReadWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		
		neoRef._matrix4._floatArrays[8] =  f4dReadWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._matrix4._floatArrays[9] =  f4dReadWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._matrix4._floatArrays[10] =  f4dReadWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._matrix4._floatArrays[11] =  f4dReadWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		
		neoRef._matrix4._floatArrays[12] =  f4dReadWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4; 
		neoRef._matrix4._floatArrays[13] =  f4dReadWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4; 
		neoRef._matrix4._floatArrays[14] =  f4dReadWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4; 
		neoRef._matrix4._floatArrays[15] =  f4dReadWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		
		// 4) short texcoords.*****
		var textures_count = f4dReadWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4; // this is only indicative that there are a texcoords.***
		if(textures_count > 0)
		{
			neoRef.texture = new Texture();
			var vertex_count = f4dReadWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			var texcoordShortValues_count = vertex_count * 2;
			startBuff = bytes_readed;
			endBuff = bytes_readed + 2*texcoordShortValues_count;
			
			neoRef.MESH_TEXCOORD_cacheKey = GL.createBuffer ();
			GL.bindBuffer(GL.ARRAY_BUFFER, neoRef.MESH_TEXCOORD_cacheKey);
			GL.bufferData(GL.ARRAY_BUFFER, new Int16Array(arrayBuffer.slice(startBuff, endBuff)), GL.STATIC_DRAW);
			  
			bytes_readed = bytes_readed + 2*texcoordShortValues_count; // updating data.***
			
			// Now, read the texture_type and texture_file_name.***
			var texture_type_nameLegth = f4dReadWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			for(var j=0; j<texture_type_nameLegth; j++){
				neoRef.texture.texture_type_name += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1;
			}
			
			var texture_fileName_Legth = f4dReadWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			for(var j=0; j<texture_fileName_Legth; j++){
				neoRef.texture.texture_image_fileName += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1;
			}
		}
	}
	
	// Now occlusion cullings.***
	bytes_readed = this.exterior_ocCullOctree.parseArrayBuffer(arrayBuffer, bytes_readed, f4dReadWriter);
	bytes_readed = this.interior_ocCullOctree.parseArrayBuffer(arrayBuffer, bytes_readed, f4dReadWriter);
	
	/*
	// Occlusion culling octree data.*****
	var ocCullBox = compoundRefsList._ocCulling._ocCulling_box; 
	bytes_readed = this.readOcclusionCullingOctreeCell(arrayBuffer, bytes_readed, ocCullBox);
	ocCullBox.setSizesSubBoxes();
	
	var infiniteOcCullBox = compoundRefsList._ocCulling._infinite_ocCulling_box;
	bytes_readed = this.readOcclusionCullingOctreeCell(arrayBuffer, bytes_readed, infiniteOcCullBox);
	infiniteOcCullBox.expandBox(1000); // Only for the infinite box.***
	infiniteOcCullBox.setSizesSubBoxes();
	*/
};

// F4D References list container ********************************************************************************************************** // 
/**
 * 어떤 일을 하고 있습니까?
 */
var NeoReferencesListsContainer = function() {
	if(!(this instanceof NeoReferencesListsContainer)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.neoRefsLists_Array = [];
};

/**
 * 어떤 일을 하고 있습니까?
 * @param blocksList 변수 
 */
NeoReferencesListsContainer.prototype.newNeoRefsList = function(blocksList) {
	var neoRefList = new NeoReferencesList();
	neoRefList.blocksList = blocksList;
	this.neoRefsLists_Array.push(neoRefList);
	return neoRefList;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param eye_x 변수
 * @param eye_y 변수
 * @param eye_z 변수
 */
NeoReferencesListsContainer.prototype.updateCurrentVisibleIndicesOfLists = function(eye_x, eye_y, eye_z) {
	var neoRefLists_count = this.neoRefsLists_Array.length;
	for(var i=0; i<neoRefLists_count; i++)
	{
		this.neoRefsLists_Array[i].updateCurrentVisibleIndices(eye_x, eye_y, eye_z);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 */
NeoReferencesListsContainer.prototype.updateCurrentAllIndicesOfLists = function() {
	var neoRefLists_count = this.neoRefsLists_Array.length;
	for(var i=0; i<neoRefLists_count; i++)
	{
		this.neoRefsLists_Array[i].updateCurrentAllIndicesInterior();
	}
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
var NeoBuilding = function() {
	if(!(this instanceof NeoBuilding)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.metaData = new MetaData();
	
	this._buildingPosition;
	this._buildingPositionHIGH;
	this._buildingPositionLOW;
	
	this.move_matrix = new Float32Array(16); // PositionMatrix.***
	this.move_matrix_inv = new Float32Array(16); // Inverse of PositionMatrix.***
	this.buildingPosMat_inv; // f4d matrix4.***
	this.transfMat_inv; // cesium matrix4.***
	
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
	
	// Textures loaded.***************************************************
	this.textures_loaded = [];
	
	// The octree.********************************************************
	this.octree; // f4d_octree. Interior objects.***
	
	this.buildingFileName = "";
	
	// The simple building.***********************************************
	this.neoSimpleBuilding;
	
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
