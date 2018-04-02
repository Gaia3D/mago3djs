
'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class VertexList
 */
var VertexList = function() 
{
	if (!(this instanceof VertexList)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.vertexArray = [];
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertex
 */
VertexList.prototype.deleteObjects = function() 
{
	for (var i = 0, vertexCount = this.vertexArray.length; i < vertexCount; i++) 
	{
		this.vertexArray[i].deleteObjects();
		this.vertexArray[i] = undefined;
	}
	this.vertexArray = undefined;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertex
 */
VertexList.prototype.copyFrom = function(vertexList) 
{
	// first reset vertexArray.
	this.deleteObjects();
	this.vertexArray = [];
	
	var vertex;
	var myVertex;
	var vertexCount = vertexList.getVertexCount();
	for (var i=0; i<vertexCount; i++)
	{
		vertex = vertexList.getVertex(i);
		myVertex = this.newVertex();
		myVertex.copyFrom(vertex);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertex
 */
VertexList.prototype.setNormal = function(nx, ny, nz) 
{
	var vertex;
	var vertexCount = this.getVertexCount();
	for (var i=0; i<vertexCount; i++)
	{
		vertex = this.getVertex(i);
		vertex.setNormal(nx, ny, nz);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertex
 */
VertexList.prototype.newVertex = function() 
{
	var vertex = new Vertex();
	this.vertexArray.push(vertex);
	return vertex;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param idx 변수
 * @returns vertexArray[idx]
 */
VertexList.prototype.getVertex = function(idx) 
{
	return this.vertexArray[idx];
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexArray.length
 */
VertexList.prototype.getVertexCount = function() 
{
	return this.vertexArray.length;
};

VertexList.prototype.getPrevIdx = function(idx)
{
	var verticesCount = this.vertexArray.length;
	var prevIdx;
	
	if(idx === 0)
		prevIdx = verticesCount - 1;
	else
		prevIdx = idx - 1;

	return prevIdx;
};

VertexList.prototype.getNextIdx = function(idx)
{
	var verticesCount = this.vertexArray.length;
	var nextIdx;
	
	if(idx === verticesCount - 1)
		nextIdx = 0;
	else
		nextIdx = idx + 1;

	return nextIdx;
};

VertexList.prototype.getIdxOfVertex = function(vertex)
{
	var verticesCount = this.vertexArray.length;
	var i=0;
	var idx = -1;
	var found = false;
	while(!found && i<verticesCount)
	{
		if(this.vertexArray[i] === vertex)
		{
			found = true;
			idx = i;
		}
		i++;
	}
	
	return idx;
};

VertexList.prototype.getVtxSegment = function(idx, resultVtxSegment)
{
	var currVertex = this.getVertex(idx);
	var nextIdx = this.getNextIdx(idx);
	var nextVertex = this.getVertex(nextIdx);
	
	if(resultVtxSegment === undefined)
		resultVtxSegment = new VtxSegment(currVertex, nextVertex);
	else{
		resultVtxSegment.setVertices(currVertex, nextVertex);
	}

	return resultVtxSegment;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param dirX 변수
 * @param dirY 변수
 * @param dirZ 변수
 * @param distance 변수
 */
VertexList.prototype.translateVertices = function(dirX, dirY, dirZ, distance) 
{
	for (var i = 0, vertexCount = this.vertexArray.length; i < vertexCount; i++) 
	{
		this.vertexArray[i].translate(dirX, dirY, dirZ, distance);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param resultBox 변수
 * @returns resultBox
 */
VertexList.prototype.getBoundingBox = function(resultBox) 
{
	if (resultBox === undefined) { resultBox = new BoundingBox(); }

	for (var i = 0, vertexCount = this.vertexArray.length; i < vertexCount; i++) 
	{
		if (i === 0) { resultBox.init(this.vertexArray[i].point3d); }
		else { resultBox.addPoint(this.vertexArray[i].point3d); }
	}
	return resultBox;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param transformMatrix 변수
 */
VertexList.prototype.transformPointsByMatrix4 = function(transformMatrix) 
{
	for (var i = 0, vertexCount = this.vertexArray.length; i < vertexCount; i++) 
	{
		var vertex = this.vertexArray[i];
		transformMatrix.transformPoint3D(vertex.point3d, vertex.point3d);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param transformMatrix 변수
 */
VertexList.prototype.getVboDataArrays = function(resultVbo) 
{
	// returns positions, and if exist, normals, colors, texCoords.***
	var verticesCount = this.vertexArray.length;
	if(verticesCount === 0)
		return resultVbo;
	
	if(resultVbo === undefined)
		resultVbo = new VBOVertexIdxCacheKey();
	
	var posArray = [];
	var norArray;
	var colArray;
	var texCoordArray;
	
	var vertex, position, normal, color, texCoord;
	
	for (var i = 0; i < verticesCount; i++) 
	{
		vertex = this.vertexArray[i];
		if(vertex.point3d === undefined)
			continue;
		
		position = vertex.point3d;
		posArray.push(position.x);
		posArray.push(position.y);
		posArray.push(position.z);
		
		normal = vertex.normal;
		if(normal)
		{
			if(norArray === undefined)
				norArray = [];
			
			norArray.push(normal.x*255);
			norArray.push(normal.y*255);
			norArray.push(normal.z*255);
		}
		
		color = vertex.color4;
		if(color)
		{
			if(colArray === undefined)
				colArray = [];
			
			colArray.push(color.r);
			colArray.push(color.g);
			colArray.push(color.b);
			colArray.push(color.a);
		}
		
		texCoord = vertex.texCoord;
		if(texCoord)
		{
			if(texCoordArray === undefined)
				texCoordArray = [];
			
			texCoordArray.push(texCoord.x);
			texCoordArray.push(texCoord.y);
		}
	}
	
	resultVbo.posVboDataArray = Float32Array.from(posArray);
	if(normal)
		resultVbo.norVboDataArray = Int8Array.from(norArray);
	
	if(color)
		resultVbo.colVboDataArray = Int8Array.from(colArray);
	
	if(texCoord)
		resultVbo.tcoordVboDataArray = Float32Array.from(texCoordArray);
	
	return resultVbo;
};






































