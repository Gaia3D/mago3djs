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
	this.vbo_vicks_container.deleteGlObjects(gl, vboMemManager);
	this.vbo_vicks_container = undefined;
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

	var bbox = new BoundingBox();
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
	var posByteSize = 4 * numPositions * 3;
	var classifiedPosByteSize = vboMemManager.getClassifiedBufferSize(posByteSize);
	//var positionBuffer = stream.readFloat32Array(numPositions * 3); // original.***
	var positionBuffer = new Float32Array(classifiedPosByteSize);
	positionBuffer.set(stream.readFloat32Array(numPositions * 3));
	// console.log(numPositions + " Positions = " + positionBuffer[0]);

	vboCacheKey.vertexCount = numPositions;
	vboCacheKey.posVboDataArray = positionBuffer;
	vboCacheKey.posArrayByteSize = classifiedPosByteSize;

	// VBO(Normal Buffer) - i,j,k
	var hasNormals = stream.readUint8();
	if (hasNormals) 
	{
		var numNormals = stream.readUint32();
		var norByteSize = 1 * numNormals * 3;
		var classifiedNorByteSize = vboMemManager.getClassifiedBufferSize(norByteSize);
		//var normalBuffer = stream.readInt8Array(numNormals * 3); // original.***
		var normalBuffer = new Int8Array(classifiedNorByteSize);
		normalBuffer.set(stream.readInt8Array(numNormals * 3));
		// console.log(numNormals + " Normals = " + normalBuffer[0]);

		vboCacheKey.norVboDataArray = normalBuffer;
		vboCacheKey.norArrayByteSize = classifiedNorByteSize;
	}

	// VBO(Color Buffer) - r,g,b,a
	var hasColors = stream.readUint8();
	if (hasColors)
	{
		var numColors = stream.readUint32();
		var colByteSize = 1 * numColors * 4;
		var classifiedColByteSize = vboMemManager.getClassifiedBufferSize(colByteSize);
						
		//var colorBuffer = stream.readUint8Array(numColors * 4); // original.***
		var colorBuffer = new Uint8Array(classifiedColByteSize);
		colorBuffer.set(stream.readUint8Array(numColors * 4));
		// console.log(numColors + " Colors = " + colorBuffer[0]);

		vboCacheKey.colVboDataArray = colorBuffer;
		vboCacheKey.colArrayByteSize = classifiedColByteSize;
	}

	// VBO(TextureCoord Buffer) - u,v
	var hasTexCoords = stream.readUint8();
	if (hasTexCoords)
	{
		var dataType = stream.readUint16();
		var numCoords = stream.readUint32();
		var tCoordByteSize = 2 * numCoords * 4;
		var classifiedTCoordByteSize = vboMemManager.getClassifiedBufferSize(tCoordByteSize);
		//var coordBuffer = stream.readFloat32Array(numCoords * 2); // original.***
		var coordBuffer = new Float32Array(classifiedTCoordByteSize);
		coordBuffer.set(stream.readFloat32Array(numCoords * 2));
		// console.log(numCoords + " Coords = " + coordBuffer[0]);

		vboCacheKey.tcoordVboDataArray = coordBuffer;
		vboCacheKey.tcoordArrayByteSize = classifiedTCoordByteSize;
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



















