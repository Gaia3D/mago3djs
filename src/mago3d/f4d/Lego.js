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
	this.hasTexCoords;
	this.texture;
	this.textureName;
	this.legoKey;
	
	// extra vars.***
	this.renderableType; // triangles, lines, points, etc.***
	this.hasColors;
	
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
Lego.prototype.parsePointsCloudData = function(buffer, gl, magoManager)
{
	if (this.fileLoadState !== CODE.fileLoadState.LOADING_FINISHED)	{ return; }
	var stream = new DataStream(buffer, 0, DataStream.LITTLE_ENDIAN);
	
	var verticesCount = stream.readInt32();
	
	if (verticesCount > 70000000)
	{ var hola = 0; }
	
	var vboMemManager = magoManager.vboMemoryManager;
	this.fileLoadState = CODE.fileLoadState.PARSE_STARTED;

	this.bbox = new BoundingBox();
	var bbox = this.bbox;
	var vboCacheKey = this.vbo_vicks_container.newVBOVertexIdxCacheKey();

	// BoundingBox in float values.***
	bbox.minX = stream.readFloat32();
	bbox.minY = stream.readFloat32();
	bbox.minZ = stream.readFloat32();
	bbox.maxX = stream.readFloat32();
	bbox.maxY = stream.readFloat32();
	bbox.maxZ = stream.readFloat32();
	
	// positionsBuffer.***
	// read bPositionsCompressed. If this var is true -> positions is in uShort).***
	this.bPositionsCompressed = stream.readInt8();
	var posByteSize = verticesCount * 3;
	var classifiedPosByteSize = vboMemManager.getClassifiedBufferSize(posByteSize);
	var positionBuffer;
	
	if (this.bPositionsCompressed)
	{
		positionBuffer = new Uint16Array(classifiedPosByteSize);
		positionBuffer.set(stream.readUint16Array(verticesCount * 3));
	}
	else 
	{
		positionBuffer = new Float32Array(classifiedPosByteSize);
		positionBuffer.set(stream.readFloat32Array(verticesCount * 3));
	}
	
	vboCacheKey.vertexCount = verticesCount;
	vboCacheKey.posVboDataArray = positionBuffer;
	vboCacheKey.posArrayByteSize = classifiedPosByteSize; 
	// (5120 : signed byte), (5121 : unsigned byte), (5122 : signed short), (5123 : unsigned short), (5126 : float).***
	vboCacheKey.posArrayByteType = 5123; // unsigned short.***
	
	// normals.***
	this.hasNormals = stream.readInt8();
	
	// colors.***
	this.hasColors = stream.readInt8();
	if (this.hasColors)
	{
		var numColors = verticesCount;
		var colByteSize = numColors * 4;
		var classifiedColByteSize = vboMemManager.getClassifiedBufferSize(colByteSize);
		var colorBuffer = new Uint8Array(classifiedColByteSize);
		colorBuffer.set(stream.readUint8Array(numColors * 4));

		vboCacheKey.colVboDataArray = colorBuffer;
		vboCacheKey.colArrayByteSize = classifiedColByteSize;
		vboCacheKey.colArrayByteType = 5121; // unsigned byte.***
	}
	
	// texCoords.***
	this.hasTexCoords = stream.readInt8();
	
	// indices.***
	this.hasIndices = stream.readInt8();
	
	this.fileLoadState = CODE.fileLoadState.PARSE_FINISHED;
	
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
	this.hasTexCoords = stream.readUint8();
	if (this.hasTexCoords)
	{
		var dataType = stream.readUint16();
		var numCoords = stream.readUint32();
		var tCoordByteSize = 2 * numCoords;
		var classifiedTCoordByteSize = vboMemManager.getClassifiedBufferSize(tCoordByteSize);
		var coordBuffer = new Float32Array(classifiedTCoordByteSize);
		coordBuffer.set(stream.readFloat32Array(numCoords * 2));

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
	if (this.hasTexCoords)
	{
		if (!vboCacheKey.isReadyTexCoords(gl, magoManager.vboMemoryManager))
		{ succesfullyGpuDataBinded = false; }
	}	
	return succesfullyGpuDataBinded;
};



















