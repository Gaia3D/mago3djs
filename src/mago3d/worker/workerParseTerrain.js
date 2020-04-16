'use strict';

var worker = self;

worker.onmessage = function(e) 
{
	var dataArrayBuffer = e.data.dataArrayBuffer;
	var bytes_readed = 0;
	
	// 1. header.
	var centerX = new Float64Array(dataArrayBuffer.slice(bytes_readed, bytes_readed+8)); bytes_readed+=8;
	var centerY = new Float64Array(dataArrayBuffer.slice(bytes_readed, bytes_readed+8)); bytes_readed+=8;
	var centerZ = new Float64Array(dataArrayBuffer.slice(bytes_readed, bytes_readed+8)); bytes_readed+=8;
	
	var minHeight = new Float32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed+4)); bytes_readed+=4;
	var maxHeight = new Float32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed+4)); bytes_readed+=4;
	
	var boundingSphereCenterX = new Float64Array(dataArrayBuffer.slice(bytes_readed, bytes_readed+8)); bytes_readed+=8;
	var boundingSphereCenterY = new Float64Array(dataArrayBuffer.slice(bytes_readed, bytes_readed+8)); bytes_readed+=8;
	var boundingSphereCenterZ = new Float64Array(dataArrayBuffer.slice(bytes_readed, bytes_readed+8)); bytes_readed+=8;
	var boundingSphereRadius = new Float64Array(dataArrayBuffer.slice(bytes_readed, bytes_readed+8)); bytes_readed+=8;
	
	var horizonOcclusionPointX = new Float64Array(dataArrayBuffer.slice(bytes_readed, bytes_readed+8)); bytes_readed+=8;
	var horizonOcclusionPointY = new Float64Array(dataArrayBuffer.slice(bytes_readed, bytes_readed+8)); bytes_readed+=8;
	var horizonOcclusionPointZ = new Float64Array(dataArrayBuffer.slice(bytes_readed, bytes_readed+8)); bytes_readed+=8;

	// 2. vertex data.
	var readVertexCount = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed+4)); bytes_readed+=4;
	var vertexCount = readVertexCount[0];
	var uValues = new Uint16Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 2 * vertexCount)); bytes_readed += 2 * vertexCount;
	var vValues = new Uint16Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 2 * vertexCount)); bytes_readed += 2 * vertexCount;
	var hValues = new Uint16Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 2 * vertexCount)); bytes_readed += 2 * vertexCount;

	// decode data.
	var u = 0;
	var v = 0;
	var height = 0;
	for (var i=0; i<vertexCount; i++)
	{
		u += zigZagDecode(uValues[i]);
		v += zigZagDecode(vValues[i]);
		height += zigZagDecode(hValues[i]);
		
		uValues[i] = u;
		vValues[i] = v;
		hValues[i] = height;
	}
	
	// 3. indices.
	var readTrianglesCount = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4)); bytes_readed += 4;
	var trianglesCount = readTrianglesCount[0];
	var indices;
	if (vertexCount > 65536 )
	{
		indices = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4 * trianglesCount * 3)); bytes_readed += 4 * trianglesCount * 3;
	}
	else 
	{
		indices = new Uint16Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 2 * trianglesCount * 3)); bytes_readed += 2 * trianglesCount * 3;
	}
    
	// decode indices.
	var code;
	var highest = 0;
	var indicesCount = indices.length;
	for (var i=0; i<indicesCount; i++)
	{
		code = indices[i];
		indices[i] = highest - code;
		if (code === 0) 
		{
			++highest;
		}
	}
	
	// 4. edges indices.
	var westVertexCount;
	var westIndices;
	var southVertexCount;
	var southIndices;
	var eastVertexCount;
	var eastIndices;
	var northVertexCount;
	var northIndices;
   
	if (vertexCount > 65536 )
	{
		westVertexCount = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4)); bytes_readed += 4;
		westIndices = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4 * westVertexCount)); bytes_readed += 4 * westVertexCount;
		
		southVertexCount = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4)); bytes_readed += 4;
		southIndices = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4 * southVertexCount)); bytes_readed += 4 * southVertexCount;
		
		eastVertexCount = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4)); bytes_readed += 4;
		eastIndices = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4 * eastVertexCount)); bytes_readed += 4 * eastVertexCount;
		
		northVertexCount = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4)); bytes_readed += 4;
		northIndices = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4 * northVertexCount)); bytes_readed += 4 * northVertexCount;
	}
	else
	{
		westVertexCount = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4)); bytes_readed += 4;
		westIndices = new Uint16Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 2 * westVertexCount)); bytes_readed += 2 * westVertexCount;
		
		southVertexCount = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4)); bytes_readed += 4;
		southIndices = new Uint16Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 2 * southVertexCount)); bytes_readed += 2 * southVertexCount;
		
		eastVertexCount = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4)); bytes_readed += 4;
		eastIndices = new Uint16Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 2 * eastVertexCount)); bytes_readed += 2 * eastVertexCount;
		
		northVertexCount = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4)); bytes_readed += 4;
		northIndices = new Uint16Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 2 * northVertexCount)); bytes_readed += 2 * northVertexCount;
	}
	
	// 5. extension header.
	var extensionId = new Uint8Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 1)); bytes_readed += 1;
	var extensionLength = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4)); bytes_readed += 4;

	worker.postMessage({parsedTerrain: {
		centerX                : centerX,   
		centerY                : centerY,
		centerZ                : centerZ,
		minHeight              : minHeight, 
		maxHeight              : maxHeight,
		boundingSphereCenterX  : boundingSphereCenterX,
		boundingSphereCenterY  : boundingSphereCenterY,
		boundingSphereCenterZ  : boundingSphereCenterZ,
		boundingSphereRadius   : boundingSphereRadius,
		horizonOcclusionPointX : horizonOcclusionPointX,
		horizonOcclusionPointY : horizonOcclusionPointY,
		horizonOcclusionPointZ : horizonOcclusionPointZ,
		vertexCount            : readVertexCount,
		uValues                : uValues,
		vValues                : vValues,
		hValues                : hValues,
		trianglesCount         : readTrianglesCount,
		indices                : indices,
		westVertexCount        : westVertexCount,
		westIndices            : westIndices,
		southVertexCount       : southVertexCount,
		southIndices           : southIndices,
		eastVertexCount        : eastVertexCount,
		eastIndices            : eastIndices,
		northVertexCount       : northVertexCount,
		northIndices           : northIndices,
		extensionId            : extensionId,
		extensionLength        : extensionLength
	}, info: e.data.info});
};
function zigZagDecode(value)
{
	return (value >> 1) ^ (-(value & 1));
};