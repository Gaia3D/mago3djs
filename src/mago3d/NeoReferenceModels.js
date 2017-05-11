'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class NeoReference
 */
var NeoReference = function() {
	if(!(this instanceof NeoReference)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	// 1) Object ID.***
	this._id = 0;

	this.objectId = "";

	// 2) Block Idx.***
	this._block_idx = -1;

	// 3) Transformation Matrix.***
	this._matrix4 = new Matrix4(); // initial and necessary matrix.***
	this._originalMatrix4 = new Matrix4(); // original matrix, for use with block-reference (do not modify).***
	this.tMatrixAuxArray; // use for deploying mode, cronological transformations for example.***

	// 4) VBO datas container.***
	this.vBOVertexIdxCacheKeysContainer; // initially undefined.***
	
	// 4) Tex coords cache_key.*** // old.***
	this.MESH_TEXCOORD_cacheKey; // old.***

	// 5) The texture image.***
	this.hasTexture = false;
	this.texture; // Texture

	// 6) 1 color.***
	this.color4; //new Color();
	this.aditionalColor; // used when object color was changed.***

	// 7) selection color.***
	this.selColor4; //new Color(); // use for selection only.***

	this.vertexCount = 0;// provisional. for checking vertexCount of the block.*** delete this.****

	// 8) movement of the object.***
	this.moveVector; // Point3D.***

	// 9) check for render.***
	this.bRendered = false;
};

/**
 * 어떤 일을 하고 있습니까?
 */
NeoReference.prototype.multiplyTransformMatrix = function(matrix) {
	this._matrix4 = this._originalMatrix4.getMultipliedByMatrix(matrix); // Original.***
};

/**
 * 어떤 일을 하고 있습니까?
 */
NeoReference.prototype.multiplyKeyTransformMatrix = function(idxKey, matrix) {
	// this function multiplies the originalMatrix by "matrix" and stores it in the "idxKey" position.***
	if(this.tMatrixAuxArray == undefined)
		this.tMatrixAuxArray = [];

	this.tMatrixAuxArray[idxKey] = this._originalMatrix4.getMultipliedByMatrix(matrix, this.tMatrixAuxArray[idxKey]);
};

/**
 * 어떤 일을 하고 있습니까?
 */
NeoReference.prototype.hasKeyMatrix = function(idxKey) {
	if(this.tMatrixAuxArray == undefined)
		return false;

	if(this.tMatrixAuxArray[idxKey] == undefined)
		return false;
	else
		return true;
};

/**
 * 어떤 일을 하고 있습니까?
 */
NeoReference.prototype.deleteGlObjects = function(gl) {
	// 1) Object ID.***
	this._id = undefined;

	// 2) Block Idx.***
	this._block_idx = undefined;

	// 3) Transformation Matrix.***
	this._matrix4._floatArrays = undefined;
	this._matrix4 = undefined;
	this._originalMatrix4._floatArrays = undefined;
	this._originalMatrix4 = undefined; //
	
	// 4) Tex coords cache_key.*** // old.***
	if(this.MESH_TEXCOORD_cacheKey) { // old.***
		gl.deleteBuffer(this.MESH_TEXCOORD_cacheKey); // old.***
		this.MESH_TEXCOORD_cacheKey = undefined; // old.***
	} // old.***

	// 5) The texture image.***
	this.hasTexture = undefined;
	this.texture = undefined; // Texture

	// 6) 1 color.***
	this.color4 = undefined; //new Color();

	// 7) selection color.***
	this.selColor4 = undefined; //new Color(); // use for selection only.***

	this.vertexCount = undefined;// provisional. for checking vertexCount of the block.*** delete this.****

	// 8) movement of the object.***
	this.moveVector = undefined; // Point3D.***

	this.bRendered = undefined;
};

// F4D References list.************************************************************************************************************************* //
/**
 * 어떤 일을 하고 있습니까?
 * @class NeoReferencesList
 */
var NeoReferencesList = function() {
	if(!(this instanceof NeoReferencesList)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.name = "";
	this.neoRefs_Array = [];
	this.blocksList;
	this.lod_level = -1;
	this.fileLoadState = CODE.fileLoadState.READY;
	this.dataArraybuffer; // file loaded data, that is no parsed yet.***

	this.neoBuildingOwner;

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
 * @returns neoRef
 */
NeoReferencesList.prototype.setRenderedFalseToAllReferences = function() {
	for(var i = 0, neoRefsCount = this.neoRefs_Array.length; i < neoRefsCount; i++) {
		var neoRef = this.neoRefs_Array[i];
		neoRef.bRendered = false;
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns neoRef
 */
NeoReferencesList.prototype.setRenderedTrueToReferencesWithId = function(id) {
	for(var i = 0, neoRefsCount = this.neoRefs_Array.length; i < neoRefsCount; i++) {
		var neoRef = this.neoRefs_Array[i];
		if(neoRef._id == id) {
			neoRef.bRendered = true;
			return;
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param matrix 변수
 */
NeoReferencesList.prototype.multiplyReferencesMatrices = function(matrix) {
	for(var i = 0, neoRefsCount = this.neoRefs_Array.length; i < neoRefsCount; i++) {
		var neoRef = this.neoRefs_Array[i];
		neoRef.multiplyTransformMatrix(matrix);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param matrix 변수
 */
NeoReferencesList.prototype.deleteGlObjects = function(gl) {
	for(var i = 0, neoRefsCount = this.neoRefs_Array.length; i < neoRefsCount; i++) {
		this.neoRefs_Array[i].deleteGlObjects(gl);
		this.neoRefs_Array[i] = undefined;
	}
	this.neoRefs_Array.length = 0;

	//this.name = undefined;
	//this.neoRefs_Array = undefined;
	this.blocksList = undefined;
	this.lod_level = undefined;
	this.fileLoadState = CODE.fileLoadState.READY;
	this.dataArraybuffer = undefined; // file loaded data, that is no parsed yet.***

	this.neoBuildingOwner = undefined;

	this.exterior_ocCullOctree = undefined;
	this.interior_ocCullOctree = undefined;

	this._currentVisibleIndices = undefined; // Determined by occlusion culling.***
	this._currentVisibleIndicesSC = undefined; // Determined by occlusion culling.***
	this._currentVisibleIndicesSC_2 = undefined; // Determined by occlusion culling.***
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
	for(var i = 0, neoRefsCount = this.neoRefs_Array.length; i < neoRefsCount; i++) {
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
 * @param gl 변수
 * @param arrayBuffer 변수
 * @param neoBuilding 변수
 * @param readWriter 변수
 */
NeoReferencesList.prototype.parseArrayBuffer = function(gl, arrayBuffer, readWriter) {
	this.fileLoadState = CODE.fileLoadState.PARSE_STARTED;

	var startBuff;
	var endBuff;
	var bytes_readed = 0;
	var neoRefsCount = readWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;

	for(var i = 0; i < neoRefsCount; i++) {
		var neoRef = this.newNeoReference();

		// 1) Id.***
		var ref_ID =  readWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._id = ref_ID;

		// 2) Block's Idx.***
		var blockIdx =   readWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._block_idx = blockIdx;

		// 3) Transform Matrix4.***
		neoRef._originalMatrix4._floatArrays[0] =  readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._originalMatrix4._floatArrays[1] =  readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._originalMatrix4._floatArrays[2] =  readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._originalMatrix4._floatArrays[3] =  readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;

		neoRef._originalMatrix4._floatArrays[4] =  readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._originalMatrix4._floatArrays[5] =  readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._originalMatrix4._floatArrays[6] =  readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._originalMatrix4._floatArrays[7] =  readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;

		neoRef._originalMatrix4._floatArrays[8] =  readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._originalMatrix4._floatArrays[9] =  readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._originalMatrix4._floatArrays[10] =  readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._originalMatrix4._floatArrays[11] =  readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;

		neoRef._originalMatrix4._floatArrays[12] =  readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._originalMatrix4._floatArrays[13] =  readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._originalMatrix4._floatArrays[14] =  readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._originalMatrix4._floatArrays[15] =  readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;

		//var vertexCount = readWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		/*
		// Short mode. NO, can not use gl_repeat.***
		var texcoordShortValues_count = vertexCount * 2;
		startBuff = bytes_readed;
		endBuff = bytes_readed + 2*texcoordShortValues_count;

		neoRef.MESH_TEXCOORD_cacheKey = gl.createBuffer ();
		gl.bindBuffer(gl.ARRAY_BUFFER, neoRef.MESH_TEXCOORD_cacheKey);
		gl.bufferData(gl.ARRAY_BUFFER, new Int16Array(arrayBuffer.slice(startBuff, endBuff)), gl.STATIC_DRAW);

		bytes_readed = bytes_readed + 2*texcoordShortValues_count; // updating data.***
		*/
		// Float mode.**************************************************************
		// New modifications for xxxx 20161013.*****************************
		var has_1_color = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;
		if(has_1_color) {
			// "type" : one of following
			// 5120 : signed byte, 5121 : unsigned byte, 5122 : signed short, 5123 : unsigned short, 5126 : float
			var data_type = readWriter.readUInt16(arrayBuffer, bytes_readed, bytes_readed+2); bytes_readed += 2;
			var dim = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;

			var daya_bytes;
			if(data_type == 5121) daya_bytes = 1;

			var r = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+daya_bytes); bytes_readed += daya_bytes;
			var g = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+daya_bytes); bytes_readed += daya_bytes;
			var b = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+daya_bytes); bytes_readed += daya_bytes;
			var alfa = 255;

			if(dim == 4) {
				alfa = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+daya_bytes); bytes_readed += daya_bytes;
			}

			neoRef.color4 = new Color();
			neoRef.color4.set(r, g, b, alfa);
		}

		var has_colors = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;
		var has_texCoords = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;
		
		if(has_colors || has_texCoords)
		{
			var vboDatasCount = readWriter.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			
			if(vboDatasCount > 0)
			{
				if(neoRef.vBOVertexIdxCacheKeysContainer == undefined)
					neoRef.vBOVertexIdxCacheKeysContainer = new VBOVertexIdxCacheKeysContainer();
			}
			
			for(var j=0; j<vboDatasCount; j++)
			{
				var vboViCacheKey = neoRef.vBOVertexIdxCacheKeysContainer.newVBOVertexIdxCacheKey();
				
				if(has_colors)
				{
					var data_type = readWriter.readUInt16(arrayBuffer, bytes_readed, bytes_readed+2); bytes_readed += 2;
					var dim = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;

					var daya_bytes; // (5120 signed byte), (5121 unsigned byte), (5122 signed short), (5123 unsigned short), (5126 float)
					if(data_type == 5120 || data_type == 5121) daya_bytes = 1;
					else if(data_type == 5122 || data_type == 5123) daya_bytes = 2;
					else if(data_type == 5126) daya_bytes = 4;
					
					var vertexCount = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
					var verticesFloatValuesCount = vertexCount * dim;
					neoRef.vertexCount = vertexCount; // no necessary.***
					startBuff = bytesReaded;
					endBuff = bytesReaded + daya_bytes * verticesFloatValuesCount; 
					vboViCacheKey.colVboDataArray = new Float32Array(arrayBuffer.slice(startBuff, endBuff));
					
					bytesReaded += daya_bytes * verticesFloatValuesCount; // updating data.***
				}
				
				if(has_texCoords)
				{
					var data_type = readWriter.readInt32(arrayBuffer, bytes_readed, bytes_readed+2); bytes_readed += 2;
					
					var daya_bytes; // (5120 signed byte), (5121 unsigned byte), (5122 signed short), (5123 unsigned short), (5126 float)
					if(data_type == 5120 || data_type == 5121) daya_bytes = 1;
					else if(data_type == 5122 || data_type == 5123) daya_bytes = 2;
					else if(data_type == 5126) daya_bytes = 4;
					
					var vertexCount = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
					var verticesFloatValuesCount = vertexCount * 2; // 2 = dimension of texCoord.***
					neoRef.vertexCount = vertexCount; // no necessary.***
					startBuff = bytesReaded;
					endBuff = bytesReaded + daya_bytes * verticesFloatValuesCount; 
					vboViCacheKey.tcoordVboDataArray = new Float32Array(arrayBuffer.slice(startBuff, endBuff));
					
					bytesReaded += daya_bytes * verticesFloatValuesCount;
				}
			}
		}
		/*
		if(has_colors) {
			if(neoRef.vBOVertexIdxCacheKeysContainer == undefined)
				neoRef.vBOVertexIdxCacheKeysContainer = new VBOVertexIdxCacheKeysContainer();
			
			var data_type = readWriter.readUInt16(arrayBuffer, bytes_readed, bytes_readed+2); bytes_readed += 2;
			var dim = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;

			var daya_bytes;
			if(data_type == 5121) daya_bytes = 1;
			
			var vboDatasCount = readWriter.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			for(var j=0; j<vboDatasCount; j++)
			{
				var vertexCount = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
				var verticesFloatValuesCount = vertexCount * dim;
				//neoRef.vertexCount = vertexCount; // no necessary.***
				startBuff = bytesReaded;
				endBuff = bytesReaded + 4 * verticesFloatValuesCount;
			
				var vboViCacheKey = neoRef.vBOVertexIdxCacheKeysContainer.newVBOVertexIdxCacheKey();
				vboViCacheKey.colVboDataArray = new Float32Array(arrayBuffer.slice(startBuff, endBuff));
				
				bytesReaded += 4 * verticesFloatValuesCount; // updating data.***
			}
		}

		var has_texCoords = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;

		// End New modifications for xxxx 20161013.-------------------------
		if(has_texCoords) {
			if(neoRef.vBOVertexIdxCacheKeysContainer == undefined)
				neoRef.vBOVertexIdxCacheKeysContainer = new VBOVertexIdxCacheKeysContainer();
			
			var data_type = readWriter.readInt32(arrayBuffer, bytes_readed, bytes_readed+2); bytes_readed += 2;

			var vboDatasCount = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			for(var j=0; j<vboDatasCount; j++)
			{
				var vertexCount = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
				var verticesFloatValuesCount = vertexCount * 2;
				//neoRef.vertexCount = vertexCount; // no necessary.***
				startBuff = bytesReaded;
				endBuff = bytesReaded + 4 * verticesFloatValuesCount;
			
				var vboViCacheKey = neoRef.vBOVertexIdxCacheKeysContainer.newVBOVertexIdxCacheKey();
				vboViCacheKey.colVboDataArray = new Float32Array(arrayBuffer.slice(startBuff, endBuff));
				
				bytesReaded += 4 * verticesFloatValuesCount;
			}
		}
		// End texcoords float mode.-------------------------------------------------
		*/

		// 4) short texcoords.*****
		var textures_count = readWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4; // this is only indicative that there are a texcoords.***
		if(textures_count > 0) {

			neoRef.texture = new Texture();
			neoRef.hasTexture = true;

			// Now, read the texture_type and texture_file_name.***
			var texture_type_nameLegth = readWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			for(var j = 0; j< texture_type_nameLegth; j++){
				neoRef.texture.textureTypeName += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1; // for example "diffuse".***
			}

			var texture_fileName_Legth = readWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			for(var j=0; j<texture_fileName_Legth; j++){
				neoRef.texture.textureImageFileName += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1;
			}

			/*
			// 1pixel texture, wait for texture to load.********************************************
			if(neoRef.texture.texId == undefined)
				neoRef.texture.texId = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, neoRef.texture.texId);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([90, 80, 85, 255])); // red
			gl.bindTexture(gl.TEXTURE_2D, null);
			*/
		} else {
			neoRef.hasTexture = false;
		}
	}

	// Now occlusion cullings.***

	// Occlusion culling octree data.*****
	var infiniteOcCullBox = this.exterior_ocCullOctree;
	//bytes_readed = this.readOcclusionCullingOctreeCell(arrayBuffer, bytes_readed, infiniteOcCullBox); // old.***
	bytes_readed = this.exterior_ocCullOctree.parseArrayBuffer(arrayBuffer, bytes_readed, readWriter);
	infiniteOcCullBox.expandBox(1000); // Only for the infinite box.***
	infiniteOcCullBox.setSizesSubBoxes();

	var ocCullBox = this.interior_ocCullOctree;
	//bytes_readed = this.readOcclusionCullingOctreeCell(arrayBuffer, bytes_readed, ocCullBox); // old.***
	bytes_readed = this.interior_ocCullOctree.parseArrayBuffer(arrayBuffer, bytes_readed, readWriter);
	ocCullBox.setSizesSubBoxes();

	this.fileLoadState = CODE.fileLoadState.PARSE_FINISHED;
};

//*************************************************************************************************************************************************************
//*************************************************************************************************************************************************************
//*************************************************************************************************************************************************************
/**
 * 어떤 일을 하고 있습니까?
 * @class NeoReferencesMotherAndIndices
 */
var NeoReferencesMotherAndIndices = function() {
	if(!(this instanceof NeoReferencesMotherAndIndices)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	// for asimetric mode.***// for asimetric mode.***// for asimetric mode.***// for asimetric mode.***
	this.motherNeoRefsList; // this is a NeoReferencesList pointer.***
	this.blocksList; // local blocks list. used only for parse data.***
	this.neoRefsIndices = [];

	this.fileLoadState = 0;
	this.dataArraybuffer;

	this.exterior_ocCullOctree;
	this.interior_ocCullOctree;
	
	this.currentVisibleIndices = [];
};

/**
 * 어떤 일을 하고 있습니까?
 * @param matrix 변수
 */
NeoReferencesMotherAndIndices.prototype.multiplyKeyTransformMatrix = function(idxKey, matrix) {
	var refIndicesCount = this.neoRefsIndices.length;
	for(var i=0; i<refIndicesCount; i++)
	{
		this.motherNeoRefsList[this.neoRefsIndices[i]].multiplyKeyTransformMatrix(idxKey, matrix);
	}
};

NeoReferencesMotherAndIndices.prototype.updateCurrentVisibleIndices = function(isExterior, eye_x, eye_y, eye_z) {
	if(isExterior)
	{
		if(this.exterior_ocCullOctree != undefined)
		{
			if(this.exterior_ocCullOctree._subBoxesArray && this.exterior_ocCullOctree._subBoxesArray.length > 0)
			{
				this.currentVisibleIndices = this.exterior_ocCullOctree.getIndicesVisiblesForEye(eye_x, eye_y, eye_z, this.currentVisibleIndices);
				
			}
			else{
				this.currentVisibleIndices = this.neoRefsIndices;
			}
			
		}
	}
	else{
		if(this.interior_ocCullOctree != undefined)
		{
			if(this.interior_ocCullOctree._subBoxesArray && this.interior_ocCullOctree._subBoxesArray.length > 0)
			{
				this.currentVisibleIndices = this.interior_ocCullOctree.getIndicesVisiblesForEye(eye_x, eye_y, eye_z, this.currentVisibleIndices);
				
			}
			else{
				this.currentVisibleIndices = this.neoRefsIndices;
			}
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param matrix 변수
 */
NeoReferencesMotherAndIndices.prototype.getNeoReference = function(idx) {
	return this.motherNeoRefsList[this.neoRefsIndices[idx]];
};

/**
 * 어떤 일을 하고 있습니까?
 * @param treeDepth 변수
 */
NeoReferencesMotherAndIndices.prototype.deleteObjects = function(gl) {

	this.motherNeoRefsList = undefined; // this is a NeoReferencesList pointer.***
	if(this.blocksList)
		this.blocksList.deleteGlObjects(gl);

	this.blocksList = undefined;
	this.neoRefsIndices = undefined;

	this.fileLoadState = 0;
	this.dataArraybuffer = undefined;

	this.exterior_ocCullOctree = undefined;
	this.interior_ocCullOctree = undefined;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param treeDepth 변수
 */
NeoReferencesMotherAndIndices.prototype.setRenderedFalseToAllReferences = function() {

	var refIndicesCount = this.neoRefsIndices.length;
	for(var i=0; i<refIndicesCount; i++)
	{
		this.motherNeoRefsList[this.neoRefsIndices[i]].bRendered = false;
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param arrayBuffer 변수
 * @param neoBuilding 변수
 * @param readWriter 변수
 */
NeoReferencesMotherAndIndices.prototype.parseArrayBufferReferences = function(gl, arrayBuffer, readWriter, motherNeoReferencesArray, tMatrix4) {
	this.fileLoadState = CODE.fileLoadState.PARSE_STARTED;

	var startBuff;
	var endBuff;
	var bytes_readed = 0;
	var neoRefsCount = readWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;

	for(var i = 0; i < neoRefsCount; i++) {
		var neoRef = new NeoReference();

		// 1) Id.***
		var ref_ID =  readWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._id = ref_ID;

		this.motherNeoRefsList = motherNeoReferencesArray;
		if(motherNeoReferencesArray[neoRef._id] != undefined)
		{
			var hola = 0;
		}

		motherNeoReferencesArray[neoRef._id] = neoRef;
		this.neoRefsIndices.push(neoRef._id);

		var objectIdLength = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed +=1;
		var objectId = String.fromCharCode.apply(null, new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+objectIdLength)));
		neoRef.objectId = objectId;
		bytes_readed += objectIdLength;

		// 2) Block's Idx.***
		var blockIdx =   readWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._block_idx = blockIdx;

		// 3) Transform Matrix4.***
		neoRef._originalMatrix4._floatArrays[0] =  readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._originalMatrix4._floatArrays[1] =  readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._originalMatrix4._floatArrays[2] =  readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._originalMatrix4._floatArrays[3] =  readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;

		neoRef._originalMatrix4._floatArrays[4] =  readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._originalMatrix4._floatArrays[5] =  readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._originalMatrix4._floatArrays[6] =  readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._originalMatrix4._floatArrays[7] =  readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;

		neoRef._originalMatrix4._floatArrays[8] =  readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._originalMatrix4._floatArrays[9] =  readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._originalMatrix4._floatArrays[10] =  readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._originalMatrix4._floatArrays[11] =  readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;

		neoRef._originalMatrix4._floatArrays[12] =  readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._originalMatrix4._floatArrays[13] =  readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._originalMatrix4._floatArrays[14] =  readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._originalMatrix4._floatArrays[15] =  readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;

		//var vertexCount = readWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		/*
		// Short mode. NO, can not use gl_repeat.***
		var texcoordShortValues_count = vertexCount * 2;
		startBuff = bytes_readed;
		endBuff = bytes_readed + 2*texcoordShortValues_count;

		neoRef.MESH_TEXCOORD_cacheKey = gl.createBuffer ();
		gl.bindBuffer(gl.ARRAY_BUFFER, neoRef.MESH_TEXCOORD_cacheKey);
		gl.bufferData(gl.ARRAY_BUFFER, new Int16Array(arrayBuffer.slice(startBuff, endBuff)), gl.STATIC_DRAW);

		bytes_readed = bytes_readed + 2*texcoordShortValues_count; // updating data.***
		*/
		// Float mode.**************************************************************
		// New modifications for xxxx 20161013.*****************************
		
		
		var has_1_color = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;
		if(has_1_color) {
			// "type" : one of following
			// 5120 : signed byte, 5121 : unsigned byte, 5122 : signed short, 5123 : unsigned short, 5126 : float
			var data_type = readWriter.readUInt16(arrayBuffer, bytes_readed, bytes_readed+2); bytes_readed += 2;
			var dim = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;

			var daya_bytes;
			if(data_type == 5121) daya_bytes = 1;

			var r = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+daya_bytes); bytes_readed += daya_bytes;
			var g = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+daya_bytes); bytes_readed += daya_bytes;
			var b = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+daya_bytes); bytes_readed += daya_bytes;
			var alfa = 255;

			if(dim == 4) {
				alfa = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+daya_bytes); bytes_readed += daya_bytes;
			}

			neoRef.color4 = new Color();
			neoRef.color4.set(r, g, b, alfa);
		}
		
		var has_colors = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;
		var has_texCoords = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;
		
		if(has_colors || has_texCoords)
		{
			var vboDatasCount = readWriter.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			
			if(vboDatasCount > 0)
			{
				if(neoRef.vBOVertexIdxCacheKeysContainer == undefined)
					neoRef.vBOVertexIdxCacheKeysContainer = new VBOVertexIdxCacheKeysContainer();
			}
			
			for(var j=0; j<vboDatasCount; j++)
			{
				var vboViCacheKey = neoRef.vBOVertexIdxCacheKeysContainer.newVBOVertexIdxCacheKey();
				
				if(has_colors)
				{
					var data_type = readWriter.readUInt16(arrayBuffer, bytes_readed, bytes_readed+2); bytes_readed += 2;
					var dim = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;

					var daya_bytes; // (5120 signed byte), (5121 unsigned byte), (5122 signed short), (5123 unsigned short), (5126 float)
					if(data_type == 5120 || data_type == 5121) daya_bytes = 1;
					else if(data_type == 5122 || data_type == 5123) daya_bytes = 2;
					else if(data_type == 5126) daya_bytes = 4;
					
					var vertexCount = readWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
					var verticesFloatValuesCount = vertexCount * dim;
					neoRef.vertexCount = vertexCount; // no necessary.***
					startBuff = bytes_readed;
					endBuff = bytes_readed + daya_bytes * verticesFloatValuesCount; 
					vboViCacheKey.colVboDataArray = new Float32Array(arrayBuffer.slice(startBuff, endBuff));
					
					bytes_readed += daya_bytes * verticesFloatValuesCount; // updating data.***
				}
				
				if(has_texCoords)
				{
					var data_type = readWriter.readUInt16(arrayBuffer, bytes_readed, bytes_readed+2); bytes_readed += 2;
					
					var daya_bytes; // (5120 signed byte), (5121 unsigned byte), (5122 signed short), (5123 unsigned short), (5126 float)
					if(data_type == 5120 || data_type == 5121) daya_bytes = 1;
					else if(data_type == 5122 || data_type == 5123) daya_bytes = 2;
					else if(data_type == 5126) daya_bytes = 4;
					
					var vertexCount = readWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
					var verticesFloatValuesCount = vertexCount * 2; // 2 = dimension of texCoord.***
					neoRef.vertexCount = vertexCount; // no necessary.***
					startBuff = bytes_readed;
					endBuff = bytes_readed + daya_bytes * verticesFloatValuesCount; 
					vboViCacheKey.tcoordVboDataArray = new Float32Array(arrayBuffer.slice(startBuff, endBuff));
					
					bytes_readed += daya_bytes * verticesFloatValuesCount;
				}
			}
		}
		/*
		var has_colors = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;
		if(has_colors) {
			var data_type = readWriter.readUInt16(arrayBuffer, bytes_readed, bytes_readed+2); bytes_readed += 2;
			var dim = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;

			var daya_bytes;
			if(data_type == 5121) daya_bytes = 1;

			var colors_count = readWriter.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			for(var j = 0; j<colors_count; j++) {
				// temporally, waste data.***
				var r = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+daya_bytes); bytes_readed += daya_bytes;
				var g = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+daya_bytes); bytes_readed += daya_bytes;
				var b = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+daya_bytes); bytes_readed += daya_bytes;

				if(dim == 4) {
					var alfa = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+daya_bytes); bytes_readed += daya_bytes;
				}
			}
		}

		var has_texCoords = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;

		// End New modifications for xxxx 20161013.-------------------------
		if(has_texCoords) {
			var data_type = readWriter.readUInt16(arrayBuffer, bytes_readed, bytes_readed+2); bytes_readed += 2;
			var vertexCount = readWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			neoRef.vertexCount = vertexCount;

			var texcoordFloatValues_count = vertexCount * 2;
			startBuff = bytes_readed;
			endBuff = bytes_readed + 4*texcoordFloatValues_count;

			neoRef.MESH_TEXCOORD_cacheKey = gl.createBuffer ();
			gl.bindBuffer(gl.ARRAY_BUFFER, neoRef.MESH_TEXCOORD_cacheKey);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arrayBuffer.slice(startBuff, endBuff)), gl.STATIC_DRAW);

			bytes_readed = bytes_readed + 4*texcoordFloatValues_count; // updating data.***
		}
		// End texcoords float mode.-------------------------------------------------
		*/
		
		// 4) short texcoords. OLD. Change this for Materials.***
		var textures_count = readWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4; // this is only indicative that there are a texcoords.***
		if(textures_count > 0) {

			neoRef.texture = new Texture();
			neoRef.hasTexture = true;

			// Now, read the texture_type and texture_file_name.***
			var texture_type_nameLegth = readWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			for(var j=0; j<texture_type_nameLegth; j++) {
				neoRef.texture.textureTypeName += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1; // for example "diffuse".***
			}

			var texture_fileName_Legth = readWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			for(var j=0; j<texture_fileName_Legth; j++) {
				neoRef.texture.textureImageFileName += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1;
			}

			/*
			// 1pixel texture, wait for texture to load.********************************************
			if(neoRef.texture.texId == undefined)
				neoRef.texture.texId = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, neoRef.texture.texId);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([90, 80, 85, 255])); // red
			gl.bindTexture(gl.TEXTURE_2D, null);
			*/
		} else {
			neoRef.hasTexture = false;
		}

		if(tMatrix4)
		{
			neoRef.multiplyTransformMatrix(tMatrix4);
		}

	}

	// Now occlusion cullings.***

	// Occlusion culling octree data.*****
	if(this.exterior_ocCullOctree == undefined)
		this.exterior_ocCullOctree = new OcclusionCullingOctreeCell();

	var infiniteOcCullBox = this.exterior_ocCullOctree;
	//bytes_readed = this.readOcclusionCullingOctreeCell(arrayBuffer, bytes_readed, infiniteOcCullBox); // old.***
	bytes_readed = this.exterior_ocCullOctree.parseArrayBuffer(arrayBuffer, bytes_readed, readWriter);
	infiniteOcCullBox.expandBox(1000); // Only for the infinite box.***
	infiniteOcCullBox.setSizesSubBoxes();

	if(this.interior_ocCullOctree == undefined)
		this.interior_ocCullOctree = new OcclusionCullingOctreeCell();

	var ocCullBox = this.interior_ocCullOctree;
	//bytes_readed = this.readOcclusionCullingOctreeCell(arrayBuffer, bytes_readed, ocCullBox); // old.***
	bytes_readed = this.interior_ocCullOctree.parseArrayBuffer(arrayBuffer, bytes_readed, readWriter);
	ocCullBox.setSizesSubBoxes();

	this.fileLoadState = CODE.fileLoadState.PARSE_FINISHED;
};

// F4D References list container ********************************************************************************************************** //
/**
 * 어떤 일을 하고 있습니까?
 * @class NeoReferencesListsContainer
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
	for(var i=0, neoRefsListsArrayLength = this.neoRefsLists_Array.length; i<neoRefsListsArrayLength; i++) {
		this.neoRefsLists_Array[i].updateCurrentVisibleIndices(eye_x, eye_y, eye_z);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 */
NeoReferencesListsContainer.prototype.updateCurrentAllIndicesOfLists = function() {
	for(var i=0, neoRefListsCount = this.neoRefsLists_Array.length; i<neoRefListsCount; i++) {
		this.neoRefsLists_Array[i].updateCurrentAllIndicesInterior();
	}
};
