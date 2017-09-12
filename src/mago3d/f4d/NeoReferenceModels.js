'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class NeoReference
 */
var NeoReference = function() 
{
	if (!(this instanceof NeoReference)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	// 1) Object IDX.***
	this._id = 0;

	this.objectId = "";

	// 2) Block Idx.***
	this._block_idx = -1;

	// 3) Transformation Matrix.***
	this._matrix4 = new Matrix4(); // initial and necessary matrix.***
	this._originalMatrix4 = new Matrix4(); // original matrix, for use with block-reference (do not modify).***
	this.tMatrixAuxArray; // use for deploying mode, cronological transformations for example.***
	this.refMatrixType = 2; // 0 = identity matrix, 1 = translate matrix, 2 = transformation matrix.
	this.refTranslationVec; // use this if "refMatrixType" === 1.
	// 4) VBO datas container.***
	this.vBOVertexIdxCacheKeysContainer; // initially undefined.***

	// 5) The texture image.***
	this.materialId;
	this.hasTexture = false;
	this.texture; // Texture

	// 6) 1 color.***
	this.color4; //new Color();
	this.aditionalColor; // used when object color was changed.***

	// 7) selection color.***
	//this.selColor4; //new Color(); // delete this..***

	this.vertexCount = 0;// provisional. for checking vertexCount of the block.*** delete this.****

	// 8) movement of the object.***
	this.moveVector; // Point3D.***

	// 9) check for render.***
	this.bRendered = false;
};

/**
 * 어떤 일을 하고 있습니까?
 */
NeoReference.prototype.multiplyTransformMatrix = function(matrix) 
{
	this._matrix4 = this._originalMatrix4.getMultipliedByMatrix(matrix); // Original.***
};

/**
 * 어떤 일을 하고 있습니까?
 */
NeoReference.prototype.multiplyKeyTransformMatrix = function(idxKey, matrix) 
{
	// this function multiplies the originalMatrix by "matrix" and stores it in the "idxKey" position.***
	if (this.tMatrixAuxArray === undefined)
	{ this.tMatrixAuxArray = []; }

	this.tMatrixAuxArray[idxKey] = this._originalMatrix4.getMultipliedByMatrix(matrix, this.tMatrixAuxArray[idxKey]);
};

/**
 * 어떤 일을 하고 있습니까?
 */
NeoReference.prototype.hasKeyMatrix = function(idxKey) 
{
	if (this.tMatrixAuxArray === undefined)
	{ return false; }

	if (this.tMatrixAuxArray[idxKey] === undefined)
	{ return false; }
	else
	{ return true; }
};

/**
 * 어떤 일을 하고 있습니까?
 */
NeoReference.prototype.deleteGlObjects = function(gl, vboMemManager) 
{
	// 1) Object ID.***
	this._id = undefined;

	// 2) Block Idx.***
	this._block_idx = undefined;

	// 3) Transformation Matrix.***
	this._matrix4._floatArrays = undefined;
	this._matrix4 = undefined;
	this._originalMatrix4._floatArrays = undefined;
	this._originalMatrix4 = undefined; //

	// 5) The texture image.***
	this.hasTexture = undefined;
	// no delete the texture, only break the referencing.
	this.texture = undefined; // Texture

	// 6) 1 color.***
	if (this.color4)
	{ this.color4.deleteObjects(); }
	this.color4 = undefined; //new Color();

	// 7) selection color.***
	if (this.selColor4)
	{ this.selColor4.deleteObjects(); }
	this.selColor4 = undefined; //new Color(); // use for selection only.***

	this.vertexCount = undefined;// provisional. for checking vertexCount of the block.*** delete this.****

	// 8) movement of the object.***
	if (this.moveVector)
	{ this.moveVector.deleteObjects(); }
	this.moveVector = undefined; // Point3D.***

	this.bRendered = undefined;
};

//*************************************************************************************************************************************************************
//*************************************************************************************************************************************************************
//*************************************************************************************************************************************************************
/**
 * 어떤 일을 하고 있습니까?
 * @class NeoReferencesMotherAndIndices
 */
var NeoReferencesMotherAndIndices = function() 
{
	if (!(this instanceof NeoReferencesMotherAndIndices)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.motherNeoRefsList; // this is a NeoReferencesList pointer.***
	this.neoRefsIndices = []; // All objects(references) of this class.
	this.modelReferencedGroupsList; // (for new format).

	this.fileLoadState = 0;
	this.dataArraybuffer;
	this.succesfullyGpuDataBinded;

	this.exterior_ocCullOctree; // octree that contains the visible indices.
	this.interior_ocCullOctree; // octree that contains the visible indices.
	
	this.currentVisibleIndices = [];
	this.currentVisibleMRG; // MRG = ModelReferencedGroup (for new format).
};

/**
 * 어떤 일을 하고 있습니까?
 * @param matrix 변수
 */
NeoReferencesMotherAndIndices.prototype.multiplyKeyTransformMatrix = function(idxKey, matrix) 
{
	var refIndicesCount = this.neoRefsIndices.length;
	for (var i=0; i<refIndicesCount; i++)
	{
		this.motherNeoRefsList[this.neoRefsIndices[i]].multiplyKeyTransformMatrix(idxKey, matrix);
	}
};

NeoReferencesMotherAndIndices.prototype.updateCurrentVisibleIndices = function(isExterior, eye_x, eye_y, eye_z, applyOcclusionCulling) 
{
	if (applyOcclusionCulling == undefined)
	{ applyOcclusionCulling = true; }
	
	if (isExterior)
	{
		if (this.exterior_ocCullOctree !== undefined)
		{
			var thisHasOcCullData = false;
			if (this.exterior_ocCullOctree._subBoxesArray && this.exterior_ocCullOctree._subBoxesArray.length > 0)
			{ thisHasOcCullData = true; }
		
			if (thisHasOcCullData && applyOcclusionCulling)
			{
				if (this.currentVisibleMRG === undefined)
				{ this.currentVisibleMRG = new ModelReferencedGroupsList(); }
				
				this.currentVisibleIndices = this.exterior_ocCullOctree.getIndicesVisiblesForEye(eye_x, eye_y, eye_z, this.currentVisibleIndices, this.currentVisibleMRG);
			}
			else 
			{
				// In this case there are no occlusionCulling data.
				this.currentVisibleIndices = this.neoRefsIndices;
				this.currentVisibleMRG = this.modelReferencedGroupsList;
			}
		}
	}
	else
	{
		if (this.interior_ocCullOctree !== undefined)
		{
			var thisHasOcCullData = false;
			if (this.interior_ocCullOctree._subBoxesArray && this.interior_ocCullOctree._subBoxesArray.length > 0)
			{ thisHasOcCullData = true; }
		
			if (thisHasOcCullData && applyOcclusionCulling)
			{
				if (this.currentVisibleMRG === undefined)
				{ this.currentVisibleMRG = new ModelReferencedGroupsList(); }
				
				this.currentVisibleIndices = this.interior_ocCullOctree.getIndicesVisiblesForEye(eye_x, eye_y, eye_z, this.currentVisibleIndices, this.currentVisibleMRG);
			}
			else
			{
				// In this case there are no occlusionCulling data.
				this.currentVisibleIndices = this.neoRefsIndices;
				this.currentVisibleMRG = this.modelReferencedGroupsList;
			}
		}
	}
};

/**
 * Returns the neoReference
 * @param matrix 변수
 */
NeoReferencesMotherAndIndices.prototype.getNeoReference = function(idx) 
{
	return this.motherNeoRefsList[this.neoRefsIndices[idx]];
};

/**
 * 어떤 일을 하고 있습니까?
 * @param treeDepth 변수
 */
NeoReferencesMotherAndIndices.prototype.deleteObjects = function(gl, vboMemManager) 
{
	this.motherNeoRefsList = undefined; // this is a NeoReferencesList pointer.***
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
NeoReferencesMotherAndIndices.prototype.setRenderedFalseToAllReferences = function() 
{
	var refIndicesCount = this.neoRefsIndices.length;
	for (var i=0; i<refIndicesCount; i++)
	{
		this.motherNeoRefsList[this.neoRefsIndices[i]].bRendered = false;
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param treeDepth 변수
 */
NeoReferencesMotherAndIndices.prototype.createModelReferencedGroups = function() 
{
	// Group all the references that has the same model.
	if (this.neoRefsIndices === undefined)
	{ return; }
	
	if (this.modelReferencedGroupsList === undefined)
	{ this.modelReferencedGroupsList = new ModelReferencedGroupsList(); }

	this.modelReferencedGroupsList.createModelReferencedGroups(this.neoRefsIndices, this.motherNeoRefsList);
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param arrayBuffer 변수
 * @param neoBuilding 변수
 * @param readWriter 변수
 */
NeoReferencesMotherAndIndices.prototype.parseArrayBufferReferencesVersioned = function(gl, arrayBuffer, readWriter, motherNeoReferencesArray, tMatrix4, magoManager) 
{
	this.fileLoadState = CODE.fileLoadState.PARSE_STARTED;

	var startBuff;
	var endBuff;
	var bytes_readed = 0;
	var testIdentityMatsCount = 0;
	var stadistic_refMat_Identities_count = 0;
	var stadistic_refMat_Translates_count = 0;
	var stadistic_refMat_Transforms_count = 0;
	var vboMemManager = magoManager.vboMemoryManager;
	var classifiedTCoordByteSize = 0, classifiedColByteSize = 0;
	var colByteSize, tCoordByteSize;
	this.succesfullyGpuDataBinded = true;
	var translationX, translationY, translationZ;
	
	// read the version.
	var versionLength = 5;
	var version = String.fromCharCode.apply(null, new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+versionLength)));
	bytes_readed += versionLength;

	var neoRefsCount = readWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
	for (var i = 0; i < neoRefsCount; i++) 
	{
		var neoRef = new NeoReference();

		// 1) Id.***
		var ref_ID =  readWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._id = ref_ID;

		this.motherNeoRefsList = motherNeoReferencesArray;
		if (motherNeoReferencesArray[neoRef._id] !== undefined)
		{
			// pass this neoReference because exist in the motherNeoReferencesArray.***
			neoRef = motherNeoReferencesArray[neoRef._id];
			if (this.neoRefsIndices === undefined)
			{ this.neoRefsIndices = []; }
			
			this.neoRefsIndices.push(neoRef._id);

			var objectIdLength = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed +=1;
			var objectId = String.fromCharCode.apply(null, new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+objectIdLength)));
			if (objectId == "noObjectId")
			{ objectId = neoRef._id; }
			
			neoRef.objectId = objectId;
			bytes_readed += objectIdLength;

			// 2) Block's Idx.***
			var blockIdx =   readWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			neoRef._block_idx = blockIdx;

			// 3) Transform Matrix4.***
			// in versioned mode read the matrixType first.
			var matrixType = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;
			if (matrixType == 0)
			{ 
				// do nothing.
			}
			else if (matrixType == 1)
			{
				// read the translation vector.
				readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
				readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
				readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			}
			else if (matrixType == 2)
			{
				// read the transformation matrix.
				readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
				readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
				readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
				readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;

				readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
				readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
				readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
				readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;

				readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
				readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
				readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
				readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;

				readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
				readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
				readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
				readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			}

			// Float mode.**************************************************************
			// New modifications for xxxx 20161013.*****************************
			var has_1_color = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;
			if (has_1_color) 
			{
				// "type" : one of following
				// 5120 : signed byte, 5121 : unsigned byte, 5122 : signed short, 5123 : unsigned short, 5126 : float
				var data_type = readWriter.readUInt16(arrayBuffer, bytes_readed, bytes_readed+2); bytes_readed += 2;
				var dim = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;

				var daya_bytes;
				if (data_type === 5121) { daya_bytes = 1; }

				var r = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+daya_bytes); bytes_readed += daya_bytes;
				var g = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+daya_bytes); bytes_readed += daya_bytes;
				var b = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+daya_bytes); bytes_readed += daya_bytes;
				var alfa = 255;

				if (dim === 4) 
				{
					alfa = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+daya_bytes); bytes_readed += daya_bytes;
				}
			}
			
			var has_colors = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;
			var has_texCoords = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;
			
			if (has_colors || has_texCoords)
			{
				var vboDatasCount = readWriter.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
				
				for (var j=0; j<vboDatasCount; j++)
				{
					if (has_colors)
					{
						var data_type = readWriter.readUInt16(arrayBuffer, bytes_readed, bytes_readed+2); bytes_readed += 2;
						var dim = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;

						var daya_bytes; // (5120 signed byte), (5121 unsigned byte), (5122 signed short), (5123 unsigned short), (5126 float)
						if (data_type === 5120 || data_type === 5121) { daya_bytes = 1; }
						else if (data_type === 5122 || data_type === 5123) { daya_bytes = 2; }
						else if (data_type === 5126) { daya_bytes = 4; }
						
						var vertexCount = readWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
						var verticesFloatValuesCount = vertexCount * dim;
						startBuff = bytes_readed;
						endBuff = bytes_readed + daya_bytes * verticesFloatValuesCount; 
						bytes_readed += daya_bytes * verticesFloatValuesCount; // updating data.***
					}
					
					if (has_texCoords)
					{
						var data_type = readWriter.readUInt16(arrayBuffer, bytes_readed, bytes_readed+2); bytes_readed += 2;
						
						var daya_bytes; // (5120 signed byte), (5121 unsigned byte), (5122 signed short), (5123 unsigned short), (5126 float)
						if (data_type === 5120 || data_type === 5121) { daya_bytes = 1; }
						else if (data_type === 5122 || data_type === 5123) { daya_bytes = 2; }
						else if (data_type === 5126) { daya_bytes = 4; }
						
						var vertexCount = readWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
						var verticesFloatValuesCount = vertexCount * 2; // 2 = dimension of texCoord.***
						startBuff = bytes_readed;
						endBuff = bytes_readed + daya_bytes * verticesFloatValuesCount; 
						bytes_readed += daya_bytes * verticesFloatValuesCount;
					}
				}
			}
			
			// 4) short texcoords. OLD. Change this for Materials.***
			var materialIdAux = readWriter.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			
			// do the stadistic recount.
			if (neoRef.refMatrixType == 0){ stadistic_refMat_Identities_count +=1; }
			if (neoRef.refMatrixType == 1){ stadistic_refMat_Translates_count +=1; }
			if (neoRef.refMatrixType == 2){ stadistic_refMat_Transforms_count +=1; }
		}
		else
		{

			motherNeoReferencesArray[neoRef._id] = neoRef;
			if (this.neoRefsIndices === undefined)
			{ this.neoRefsIndices = []; }
			
			this.neoRefsIndices.push(neoRef._id);

			var objectIdLength = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed +=1;
			var objectId = String.fromCharCode.apply(null, new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+objectIdLength)));
			neoRef.objectId = objectId;
			bytes_readed += objectIdLength;

			// 2) Block's Idx.***
			var blockIdx =   readWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			neoRef._block_idx = blockIdx;

			// 3) Transform Matrix4.***
			neoRef.refMatrixType = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;
			if (neoRef.refMatrixType == 0)
			{ 
				// do nothing.
				stadistic_refMat_Identities_count +=1;
			}
			else if (neoRef.refMatrixType == 1)
			{
				// read the translation vector.
				translationX = readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
				translationY = readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
				translationZ = readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
				neoRef.refTranslationVec = new Float32Array([translationX, translationY, translationZ]);
				
				stadistic_refMat_Translates_count +=1;
			}
			else if (neoRef.refMatrixType == 2)
			{
				// read the transformation matrix.
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
				
				stadistic_refMat_Transforms_count +=1;
			}

			// Float mode.**************************************************************
			var has_1_color = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;
			if (has_1_color) 
			{
				// "type" : one of following
				// 5120 : signed byte, 5121 : unsigned byte, 5122 : signed short, 5123 : unsigned short, 5126 : float
				var data_type = readWriter.readUInt16(arrayBuffer, bytes_readed, bytes_readed+2); bytes_readed += 2;
				var dim = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;

				var daya_bytes;
				if (data_type === 5121) { daya_bytes = 1; }

				var r = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+daya_bytes); bytes_readed += daya_bytes;
				var g = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+daya_bytes); bytes_readed += daya_bytes;
				var b = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+daya_bytes); bytes_readed += daya_bytes;
				var alfa = 255;

				if (dim === 4) 
				{
					alfa = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+daya_bytes); bytes_readed += daya_bytes;
				}

				neoRef.color4 = new Color();
				neoRef.color4.set(r, g, b, alfa);
			}
			
			var has_colors = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;
			var has_texCoords = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;
			
			if (has_colors || has_texCoords)
			{
				var vboDatasCount = readWriter.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
				
				if (vboDatasCount > 0)
				{
					if (neoRef.vBOVertexIdxCacheKeysContainer === undefined)
					{ neoRef.vBOVertexIdxCacheKeysContainer = new VBOVertexIdxCacheKeysContainer(); }
				}
				
				for (var j=0; j<vboDatasCount; j++)
				{
					var vboViCacheKey = neoRef.vBOVertexIdxCacheKeysContainer.newVBOVertexIdxCacheKey();
					
					if (has_colors)
					{
						var data_type = readWriter.readUInt16(arrayBuffer, bytes_readed, bytes_readed+2); bytes_readed += 2;
						var dim = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;

						var daya_bytes; // (5120 signed byte), (5121 unsigned byte), (5122 signed short), (5123 unsigned short), (5126 float)
						if (data_type === 5120 || data_type === 5121) { daya_bytes = 1; }
						else if (data_type === 5122 || data_type === 5123) { daya_bytes = 2; }
						else if (data_type === 5126) { daya_bytes = 4; }
						
						var vertexCount = readWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
						var verticesFloatValuesCount = vertexCount * dim;
						colByteSize = daya_bytes * verticesFloatValuesCount;
						classifiedColByteSize = vboMemManager.getClassifiedBufferSize(colByteSize);
						
						neoRef.vertexCount = vertexCount; // no necessary.***
						startBuff = bytes_readed;
						endBuff = bytes_readed + daya_bytes * verticesFloatValuesCount; 
						//vboViCacheKey.colVboDataArray = new Float32Array(arrayBuffer.slice(startBuff, endBuff)); // original.***
						// TODO: Float32Array or UintArray depending of dataType.***
						vboViCacheKey.colVboDataArray = new Float32Array(classifiedColByteSize);
						vboViCacheKey.colVboDataArray.set(new Float32Array(arrayBuffer.slice(startBuff, endBuff)));
						vboViCacheKey.colArrayByteSize = classifiedColByteSize;
						bytes_readed += daya_bytes * verticesFloatValuesCount; // updating data.***
						
						// send data to gpu.
						if (!vboViCacheKey.isReadyColors(gl, magoManager.vboMemoryManager))
						{
							this.succesfullyGpuDataBinded = false;
						}
					}
					
					if (has_texCoords)
					{
						var data_type = readWriter.readUInt16(arrayBuffer, bytes_readed, bytes_readed+2); bytes_readed += 2;
						
						var daya_bytes; // (5120 signed byte), (5121 unsigned byte), (5122 signed short), (5123 unsigned short), (5126 float)
						if (data_type === 5120 || data_type === 5121) { daya_bytes = 1; }
						else if (data_type === 5122 || data_type === 5123) { daya_bytes = 2; }
						else if (data_type === 5126) { daya_bytes = 4; }
						
						var vertexCount = readWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
						var verticesFloatValuesCount = vertexCount * 2; // 2 = dimension of texCoord.***
						// example: posByteSize = 4 * verticesFloatValuesCount;
						tCoordByteSize = daya_bytes * verticesFloatValuesCount;
						classifiedTCoordByteSize = vboMemManager.getClassifiedBufferSize(tCoordByteSize);
						
						neoRef.vertexCount = vertexCount; // no necessary.***
						startBuff = bytes_readed;
						endBuff = bytes_readed + daya_bytes * verticesFloatValuesCount; 
						//vboViCacheKey.tcoordVboDataArray = new Float32Array(arrayBuffer.slice(startBuff, endBuff)); // original.***
						vboViCacheKey.tcoordVboDataArray = new Float32Array(classifiedTCoordByteSize);
						vboViCacheKey.tcoordVboDataArray.set(new Float32Array(arrayBuffer.slice(startBuff, endBuff)));
						vboViCacheKey.tcoordArrayByteSize = classifiedTCoordByteSize;
						bytes_readed += daya_bytes * verticesFloatValuesCount;
						
						// send data to gpu.
						if (!vboViCacheKey.isReadyTexCoords(gl, magoManager.vboMemoryManager))
						{
							this.succesfullyGpuDataBinded = false;
						}
					}
				}
			}

			// 4) read the reference material id.
			neoRef.materialId = readWriter.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			if (neoRef.materialId == -1)
			{ neoRef.hasTexture = false; }
			else { neoRef.hasTexture = true; }

			if (tMatrix4)
			{
				// multiply the building transformation matrix with the reference matrix, then we save aditional multiplications inside the shader.
				neoRef.multiplyTransformMatrix(tMatrix4);
			}
		}

	}
	
	// finally read the triangles count.
	var trianglesCount = readWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
	
	//this.createModelReferencedGroups(); // test for stadistics.
	

	// Now occlusion cullings.***
	// Occlusion culling octree data.*****
	if (this.exterior_ocCullOctree === undefined)
	{ this.exterior_ocCullOctree = new OcclusionCullingOctreeCell(); }

	var infiniteOcCullBox = this.exterior_ocCullOctree;
	//bytes_readed = this.readOcclusionCullingOctreeCell(arrayBuffer, bytes_readed, infiniteOcCullBox); // old.***
	bytes_readed = this.exterior_ocCullOctree.parseArrayBuffer(arrayBuffer, bytes_readed, readWriter);
	infiniteOcCullBox.expandBox(1000); // Only for the infinite box.***
	infiniteOcCullBox.setSizesSubBoxes();
	infiniteOcCullBox.createModelReferencedGroups(this.motherNeoRefsList);

	if (this.interior_ocCullOctree === undefined)
	{ this.interior_ocCullOctree = new OcclusionCullingOctreeCell(); }

	var ocCullBox = this.interior_ocCullOctree;
	//bytes_readed = this.readOcclusionCullingOctreeCell(arrayBuffer, bytes_readed, ocCullBox); // old.***
	bytes_readed = this.interior_ocCullOctree.parseArrayBuffer(arrayBuffer, bytes_readed, readWriter);
	ocCullBox.setSizesSubBoxes();
	ocCullBox.createModelReferencedGroups(this.motherNeoRefsList);

	this.fileLoadState = CODE.fileLoadState.PARSE_FINISHED;
	return this.succesfullyGpuDataBinded;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param arrayBuffer 변수
 * @param neoBuilding 변수
 * @param readWriter 변수
 */
NeoReferencesMotherAndIndices.prototype.parseArrayBufferReferences = function(gl, arrayBuffer, readWriter, motherNeoReferencesArray, tMatrix4, magoManager) 
{
	this.fileLoadState = CODE.fileLoadState.PARSE_STARTED;

	var startBuff;
	var endBuff;
	var bytes_readed = 0;
	var neoRefsCount = readWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
	var testIdentityMatsCount = 0;
	var stadistic_refMat_Identities_count = 0;
	var stadistic_refMat_Translates_count = 0;
	var stadistic_refMat_Transforms_count = 0;
	var vboMemManager = magoManager.vboMemoryManager;
	var classifiedTCoordByteSize = 0, classifiedColByteSize = 0;
	var colByteSize, tCoordByteSize;
	this.succesfullyGpuDataBinded = true;

	for (var i = 0; i < neoRefsCount; i++) 
	{
		var neoRef = new NeoReference();

		// 1) Id.***
		var ref_ID =  readWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		neoRef._id = ref_ID;

		this.motherNeoRefsList = motherNeoReferencesArray;
		if (motherNeoReferencesArray[neoRef._id] !== undefined)
		{
			// pass this neoReference because exist in the motherNeoReferencesArray.***
			neoRef = motherNeoReferencesArray[neoRef._id];
			if (this.neoRefsIndices === undefined)
			{ this.neoRefsIndices = []; }
			
			this.neoRefsIndices.push(neoRef._id);

			var objectIdLength = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed +=1;
			var objectId = String.fromCharCode.apply(null, new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+objectIdLength)));
			neoRef.objectId = objectId;
			bytes_readed += objectIdLength;

			// 2) Block's Idx.***
			var blockIdx =   readWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			neoRef._block_idx = blockIdx;

			// 3) Transform Matrix4.***
			readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;

			readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;

			readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;

			readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			readWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;

			// Float mode.**************************************************************
			// New modifications for xxxx 20161013.*****************************
			var has_1_color = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;
			if (has_1_color) 
			{
				// "type" : one of following
				// 5120 : signed byte, 5121 : unsigned byte, 5122 : signed short, 5123 : unsigned short, 5126 : float
				var data_type = readWriter.readUInt16(arrayBuffer, bytes_readed, bytes_readed+2); bytes_readed += 2;
				var dim = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;

				var daya_bytes;
				if (data_type === 5121) { daya_bytes = 1; }

				var r = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+daya_bytes); bytes_readed += daya_bytes;
				var g = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+daya_bytes); bytes_readed += daya_bytes;
				var b = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+daya_bytes); bytes_readed += daya_bytes;
				var alfa = 255;

				if (dim === 4) 
				{
					alfa = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+daya_bytes); bytes_readed += daya_bytes;
				}
			}
			
			var has_colors = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;
			var has_texCoords = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;
			
			if (has_colors || has_texCoords)
			{
				var vboDatasCount = readWriter.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
				
				for (var j=0; j<vboDatasCount; j++)
				{
					if (has_colors)
					{
						var data_type = readWriter.readUInt16(arrayBuffer, bytes_readed, bytes_readed+2); bytes_readed += 2;
						var dim = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;

						var daya_bytes; // (5120 signed byte), (5121 unsigned byte), (5122 signed short), (5123 unsigned short), (5126 float)
						if (data_type === 5120 || data_type === 5121) { daya_bytes = 1; }
						else if (data_type === 5122 || data_type === 5123) { daya_bytes = 2; }
						else if (data_type === 5126) { daya_bytes = 4; }
						
						var vertexCount = readWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
						var verticesFloatValuesCount = vertexCount * dim;
						startBuff = bytes_readed;
						endBuff = bytes_readed + daya_bytes * verticesFloatValuesCount; 
						bytes_readed += daya_bytes * verticesFloatValuesCount; // updating data.***
					}
					
					if (has_texCoords)
					{
						var data_type = readWriter.readUInt16(arrayBuffer, bytes_readed, bytes_readed+2); bytes_readed += 2;
						
						var daya_bytes; // (5120 signed byte), (5121 unsigned byte), (5122 signed short), (5123 unsigned short), (5126 float)
						if (data_type === 5120 || data_type === 5121) { daya_bytes = 1; }
						else if (data_type === 5122 || data_type === 5123) { daya_bytes = 2; }
						else if (data_type === 5126) { daya_bytes = 4; }
						
						var vertexCount = readWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
						var verticesFloatValuesCount = vertexCount * 2; // 2 = dimension of texCoord.***
						startBuff = bytes_readed;
						endBuff = bytes_readed + daya_bytes * verticesFloatValuesCount; 
						bytes_readed += daya_bytes * verticesFloatValuesCount;
					}
				}
			}
			
			// 4) short texcoords. OLD. Change this for Materials.***
			var textures_count = readWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4; // this is only indicative that there are a texcoords.***
			if (textures_count > 0) 
			{

				// Now, read the texture_type and texture_file_name.***
				var texture_type_nameLegth = readWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
				for (var j=0; j<texture_type_nameLegth; j++) 
				{
					bytes_readed += 1; // for example "diffuse".***
				}

				var texture_fileName_Legth = readWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
				for (var j=0; j<texture_fileName_Legth; j++) 
				{
					bytes_readed += 1;
				}
			} 
			
			// do the stadistic recount.
			if (neoRef.refMatrixType === 0){ stadistic_refMat_Identities_count +=1; }
			if (neoRef.refMatrixType === 1){ stadistic_refMat_Translates_count +=1; }
			if (neoRef.refMatrixType === 2){ stadistic_refMat_Transforms_count +=1; }
		}
		else
		{

			motherNeoReferencesArray[neoRef._id] = neoRef;
			if (this.neoRefsIndices === undefined)
			{ this.neoRefsIndices = []; }
			
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
			
			// Compute the references matrix type.
			neoRef.refMatrixType = neoRef._originalMatrix4.computeMatrixType();
			if (neoRef.refMatrixType === 0){ stadistic_refMat_Identities_count +=1; }
			if (neoRef.refMatrixType === 1)
			{
				neoRef.refTranslationVec = new Float32Array([neoRef._originalMatrix4._floatArrays[12], neoRef._originalMatrix4._floatArrays[13], neoRef._originalMatrix4._floatArrays[14]]);
				stadistic_refMat_Translates_count +=1;
			}
			if (neoRef.refMatrixType === 2){ stadistic_refMat_Transforms_count +=1; }

			// Float mode.**************************************************************
			// New modifications for xxxx 20161013.*****************************
			var has_1_color = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;
			if (has_1_color) 
			{
				// "type" : one of following
				// 5120 : signed byte, 5121 : unsigned byte, 5122 : signed short, 5123 : unsigned short, 5126 : float
				var data_type = readWriter.readUInt16(arrayBuffer, bytes_readed, bytes_readed+2); bytes_readed += 2;
				var dim = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;

				var daya_bytes;
				if (data_type === 5121) { daya_bytes = 1; }

				var r = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+daya_bytes); bytes_readed += daya_bytes;
				var g = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+daya_bytes); bytes_readed += daya_bytes;
				var b = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+daya_bytes); bytes_readed += daya_bytes;
				var alfa = 255;

				if (dim === 4) 
				{
					alfa = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+daya_bytes); bytes_readed += daya_bytes;
				}

				neoRef.color4 = new Color();
				neoRef.color4.set(r, g, b, alfa);
			}
			
			var has_colors = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;
			var has_texCoords = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;
			
			if (has_colors || has_texCoords)
			{
				var vboDatasCount = readWriter.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
				
				if (vboDatasCount > 0)
				{
					if (neoRef.vBOVertexIdxCacheKeysContainer === undefined)
					{ neoRef.vBOVertexIdxCacheKeysContainer = new VBOVertexIdxCacheKeysContainer(); }
				}
				
				for (var j=0; j<vboDatasCount; j++)
				{
					var vboViCacheKey = neoRef.vBOVertexIdxCacheKeysContainer.newVBOVertexIdxCacheKey();
					
					if (has_colors)
					{
						var data_type = readWriter.readUInt16(arrayBuffer, bytes_readed, bytes_readed+2); bytes_readed += 2;
						var dim = readWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;

						var daya_bytes; // (5120 signed byte), (5121 unsigned byte), (5122 signed short), (5123 unsigned short), (5126 float)
						if (data_type === 5120 || data_type === 5121) { daya_bytes = 1; }
						else if (data_type === 5122 || data_type === 5123) { daya_bytes = 2; }
						else if (data_type === 5126) { daya_bytes = 4; }
						
						var vertexCount = readWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
						var verticesFloatValuesCount = vertexCount * dim;
						colByteSize = daya_bytes * verticesFloatValuesCount;
						classifiedColByteSize = vboMemManager.getClassifiedBufferSize(colByteSize);
						
						neoRef.vertexCount = vertexCount; // no necessary.***
						startBuff = bytes_readed;
						endBuff = bytes_readed + daya_bytes * verticesFloatValuesCount; 
						//vboViCacheKey.colVboDataArray = new Float32Array(arrayBuffer.slice(startBuff, endBuff)); // original.***
						// TODO: Float32Array or UintArray depending of dataType.***
						vboViCacheKey.colVboDataArray = new Float32Array(classifiedColByteSize);
						vboViCacheKey.colVboDataArray.set(new Float32Array(arrayBuffer.slice(startBuff, endBuff)));
						vboViCacheKey.colArrayByteSize = classifiedColByteSize;
						bytes_readed += daya_bytes * verticesFloatValuesCount; // updating data.***
						
						// send data to gpu.
						if (!vboViCacheKey.isReadyColors(gl, magoManager.vboMemoryManager))
						{
							this.succesfullyGpuDataBinded = false;
						}
					}
					
					if (has_texCoords)
					{
						var data_type = readWriter.readUInt16(arrayBuffer, bytes_readed, bytes_readed+2); bytes_readed += 2;
						
						var daya_bytes; // (5120 signed byte), (5121 unsigned byte), (5122 signed short), (5123 unsigned short), (5126 float)
						if (data_type === 5120 || data_type === 5121) { daya_bytes = 1; }
						else if (data_type === 5122 || data_type === 5123) { daya_bytes = 2; }
						else if (data_type === 5126) { daya_bytes = 4; }
						
						var vertexCount = readWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
						var verticesFloatValuesCount = vertexCount * 2; // 2 = dimension of texCoord.***
						// example: posByteSize = 4 * verticesFloatValuesCount;
						tCoordByteSize = daya_bytes * verticesFloatValuesCount;
						classifiedTCoordByteSize = vboMemManager.getClassifiedBufferSize(tCoordByteSize);
						
						neoRef.vertexCount = vertexCount; // no necessary.***
						startBuff = bytes_readed;
						endBuff = bytes_readed + daya_bytes * verticesFloatValuesCount; 
						//vboViCacheKey.tcoordVboDataArray = new Float32Array(arrayBuffer.slice(startBuff, endBuff)); // original.***
						vboViCacheKey.tcoordVboDataArray = new Float32Array(classifiedTCoordByteSize);
						vboViCacheKey.tcoordVboDataArray.set(new Float32Array(arrayBuffer.slice(startBuff, endBuff)));
						vboViCacheKey.tcoordArrayByteSize = classifiedTCoordByteSize;
						bytes_readed += daya_bytes * verticesFloatValuesCount;
						
						// send data to gpu.
						if (!vboViCacheKey.isReadyTexCoords(gl, magoManager.vboMemoryManager))
						{
							this.succesfullyGpuDataBinded = false;
						}
					}
				}
			}

			// 4) short texcoords. OLD. Change this for Materials.***
			var textures_count = readWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4; // this is only indicative that there are a texcoords.***
			if (textures_count > 0) 
			{
				var textureTypeName = "";
				var textureImageFileName = "";

				// Now, read the texture_type and texture_file_name.***
				var texture_type_nameLegth = readWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
				for (var j=0; j<texture_type_nameLegth; j++) 
				{
					textureTypeName += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1; // for example "diffuse".***
				}

				var texture_fileName_Legth = readWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
				for (var j=0; j<texture_fileName_Legth; j++) 
				{
					textureImageFileName += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1;
				}
				
				if (texture_fileName_Legth > 0)
				{
					neoRef.texture = new Texture();
					neoRef.hasTexture = true;
					neoRef.texture.textureTypeName = textureTypeName;
					neoRef.texture.textureImageFileName = textureImageFileName;
				}

				/*
				// 1pixel texture, wait for texture to load.********************************************
				if(neoRef.texture.texId === undefined)
					neoRef.texture.texId = gl.createTexture();
				gl.bindTexture(gl.TEXTURE_2D, neoRef.texture.texId);
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([90, 80, 85, 255])); // red
				gl.bindTexture(gl.TEXTURE_2D, null);
				*/
			}
			else 
			{
				neoRef.hasTexture = false;
			}

			if (tMatrix4)
			{
				neoRef.multiplyTransformMatrix(tMatrix4);
			}
		}

	}
	
	//this.createModelReferencedGroups(); // test for new format.
	

	// Now occlusion cullings.***
	// Occlusion culling octree data.*****
	if (this.exterior_ocCullOctree === undefined)
	{ this.exterior_ocCullOctree = new OcclusionCullingOctreeCell(); }

	var infiniteOcCullBox = this.exterior_ocCullOctree;
	//bytes_readed = this.readOcclusionCullingOctreeCell(arrayBuffer, bytes_readed, infiniteOcCullBox); // old.***
	bytes_readed = this.exterior_ocCullOctree.parseArrayBuffer(arrayBuffer, bytes_readed, readWriter);
	infiniteOcCullBox.expandBox(1000); // Only for the infinite box.***
	infiniteOcCullBox.setSizesSubBoxes();
	infiniteOcCullBox.createModelReferencedGroups(this.motherNeoRefsList);

	if (this.interior_ocCullOctree === undefined)
	{ this.interior_ocCullOctree = new OcclusionCullingOctreeCell(); }

	var ocCullBox = this.interior_ocCullOctree;
	//bytes_readed = this.readOcclusionCullingOctreeCell(arrayBuffer, bytes_readed, ocCullBox); // old.***
	bytes_readed = this.interior_ocCullOctree.parseArrayBuffer(arrayBuffer, bytes_readed, readWriter);
	ocCullBox.setSizesSubBoxes();
	ocCullBox.createModelReferencedGroups(this.motherNeoRefsList);

	this.fileLoadState = CODE.fileLoadState.PARSE_FINISHED;
	return this.succesfullyGpuDataBinded;
};












