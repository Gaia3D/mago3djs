'use strict';

/**
 * F4D Lego 클래스
 * 
 * @alias Lego
 * @class Lego
 */
var Lego = function() 
{
	if (!(this instanceof Lego)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.vbo_vicks_container = new VBOVertexIdxCacheKeysContainer();
	this.fileLoadState = CODE.fileLoadState.READY;
	this.bbox;
	this.dataArrayBuffer;
	this.selColor4;
	this.texture;
	this.textureName;
	this.legoKey;
};

/**
 * F4D Lego 자료를 읽는다
 * 
 * @param {any} gl 
 * @param {any} readWriter 
 * @param {any} dataArraybuffer 
 * @param {any} bytesReaded 
 */
Lego.prototype.parseArrayBuffer = function(gl, dataArraybuffer, magoManager)
{
	this.parseLegoData(dataArraybuffer, gl, magoManager);
};

/**
 * F4D Lego 자료를 읽는다
 * 
 */
Lego.prototype.isReadyToRender = function()
{
	if (this.fileLoadState !== CODE.fileLoadState.PARSE_FINISHED)
	{ return false; }
	
	if (this.texture === undefined || this.texture.texId === undefined)
	{ return false; }
	
	return true;
};

/**
 * F4D Lego 자료를 읽는다
 * 
 * @param {any} gl 
 * @param {any} readWriter 
 * @param {any} dataArraybuffer 
 * @param {any} bytesReaded 
 */
Lego.prototype.deleteObjects = function(gl, vboMemManager)
{
	if (this.vbo_vicks_container !== undefined)
	{
		this.vbo_vicks_container.deleteGlObjects(gl, vboMemManager);
		this.vbo_vicks_container = undefined;
	}
	this.fileLoadState = undefined;
	this.dataArrayBuffer = undefined;
	if (this.selColor4 !== undefined)
	{
		this.selColor4.deleteObjects();
		this.selColor4 = undefined;
	}
	
	this.textureName = undefined;
	if (this.texture)
	{
		this.texture.deleteObjects(gl);
	}
	this.texture = undefined;
	if (this.bbox)
	{
		this.bbox.deleteObjects();
	}
	this.bbox = undefined;
};

/**
 * F4D Lego 자료를 읽는다
 * 
 * @param {ArrayBuffer} buffer 
 */
Lego.prototype.parseLegoData = function(buffer, gl, magoManager)
{
	if (this.fileLoadState !== CODE.fileLoadState.LOADING_FINISHED)	{ return; }
	
	var vboMemManager = magoManager.vboMemoryManager;

	var stream = new DataStream(buffer, 0, DataStream.LITTLE_ENDIAN);
	this.fileLoadState = CODE.fileLoadState.PARSE_STARTED;

	this.bbox = new BoundingBox();
	var bbox = this.bbox;
	var vboCacheKey = this.vbo_vicks_container.newVBOVertexIdxCacheKey();

	// BoundingBox
	bbox.minX = stream.readFloat32();
	bbox.minY = stream.readFloat32();
	bbox.minZ = stream.readFloat32();
	bbox.maxX = stream.readFloat32();
	bbox.maxY = stream.readFloat32();
	bbox.maxZ = stream.readFloat32();

	// VBO(Position Buffer) - x,y,z
	var numPositions = stream.readUint32();
	var posByteSize = numPositions * 3;
	var classifiedPosByteSize = vboMemManager.getClassifiedBufferSize(posByteSize);
	var positionBuffer = new Float32Array(classifiedPosByteSize);
	positionBuffer.set(stream.readFloat32Array(numPositions * 3));
	
	// Test: change float(4byte) data to short(2byte) data.*************************************************************
	/*
	var posShortBuffer = new Uint16Array(numPositions * 3);
	var fx, fy, fz; // float values.
	var bboxXDim = bbox.getXLength();
	var bboxYDim = bbox.getYLength();
	var bboxZDim = bbox.getZLength();
	
	for(var i=0; i<numPositions; i++)
	{
		fx = positionBuffer[i*3];
		fy = positionBuffer[i*3+1];
		fz = positionBuffer[i*3+2];
		
		posShortBuffer[i*3] = new Uint16Array([(fx - bbox.minX)/bboxXDim * 65535]);
		posShortBuffer[i*3+1] = new Uint16Array([(fy - bbox.minY)/bboxYDim * 65535]);
		posShortBuffer[i*3+2] = new Uint16Array([(fz - bbox.minZ)/bboxZDim * 65535]);
	}
	*/
	// End test.---------------------------------------------------------------------------------------------------------

	vboCacheKey.vertexCount = numPositions;
	vboCacheKey.posVboDataArray = positionBuffer;
	vboCacheKey.posArrayByteSize = classifiedPosByteSize; 
	// (5120 : signed byte), (5121 : unsigned byte), (5122 : signed short), (5123 : unsigned short), (5126 : float).***
	//vboCacheKey.posArrayByteType = 5123; // unsigned short.***

	// VBO(Normal Buffer) - i,j,k
	var hasNormals = stream.readUint8();
	if (hasNormals) 
	{
		var numNormals = stream.readUint32();
		var norByteSize = numNormals * 3;
		var classifiedNorByteSize = vboMemManager.getClassifiedBufferSize(norByteSize);
		var normalBuffer = new Int8Array(classifiedNorByteSize);
		normalBuffer.set(stream.readInt8Array(numNormals * 3));

		vboCacheKey.norVboDataArray = normalBuffer;
		vboCacheKey.norArrayByteSize = classifiedNorByteSize;
	}

	// VBO(Color Buffer) - r,g,b,a
	var hasColors = stream.readUint8();
	if (hasColors)
	{
		var numColors = stream.readUint32();
		var colByteSize = numColors * 4;
		var classifiedColByteSize = vboMemManager.getClassifiedBufferSize(colByteSize);
		var colorBuffer = new Uint8Array(classifiedColByteSize);
		colorBuffer.set(stream.readUint8Array(numColors * 4));

		vboCacheKey.colVboDataArray = colorBuffer;
		vboCacheKey.colArrayByteSize = classifiedColByteSize;
	}

	// VBO(TextureCoord Buffer) - u,v
	var hasTexCoords = stream.readUint8();
	if (hasTexCoords)
	{
		var dataType = stream.readUint16();
		var numCoords = stream.readUint32();
		var tCoordByteSize = 2 * numCoords;
		var classifiedTCoordByteSize = vboMemManager.getClassifiedBufferSize(tCoordByteSize);
		var coordBuffer = new Float32Array(classifiedTCoordByteSize);
		coordBuffer.set(stream.readFloat32Array(numCoords * 2));
		
		// Test: change float(4byte) data to short(2byte) data.*************************************************************
		/*
		var coordShortBuffer = new Uint16Array(2 * numCoords);
		for(var i=0; i<numCoords; i++)
		{
			coordShortBuffer[i*2] = new Uint16Array([coordBuffer[i*2] * 65535]);
			coordShortBuffer[i*2+1] = new Uint16Array([coordBuffer[i*2+1] * 65535]);
		}
		*/
		// End test.---------------------------------------------------------------------------------------------------------

		vboCacheKey.tcoordVboDataArray = coordBuffer; // original.***
		vboCacheKey.tcoordArrayByteSize = classifiedTCoordByteSize;
		//vboCacheKey.tcoordArrayByteType = 5123; // unsigned short.***
	}

	this.fileLoadState = CODE.fileLoadState.PARSE_FINISHED;
	
	var succesfullyGpuDataBinded = true;
	if (!vboCacheKey.isReadyPositions(gl, magoManager.vboMemoryManager))
	{ succesfullyGpuDataBinded = false; }
	if (!vboCacheKey.isReadyNormals(gl, magoManager.vboMemoryManager))
	{ succesfullyGpuDataBinded = false; }
	if (!vboCacheKey.isReadyColors(gl, magoManager.vboMemoryManager))
	{ succesfullyGpuDataBinded = false; }

	// 4) Texcoord.*********************************************
	if (hasTexCoords)
	{
		if (!vboCacheKey.isReadyTexCoords(gl, magoManager.vboMemoryManager))
		{ succesfullyGpuDataBinded = false; }
	}	
	return succesfullyGpuDataBinded;
};



















