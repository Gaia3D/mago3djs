
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

VertexList.getPrevIdx = function(idx, vertexArray)
{
	var verticesCount = vertexArray.length;
	
	if (idx < 0 || idx > verticesCount-1)
	{ return undefined; }
	
	var prevIdx;
	
	if (idx === 0)
	{ prevIdx = verticesCount - 1; }
	else
	{ prevIdx = idx - 1; }

	return prevIdx;
};

VertexList.getNextIdx = function(idx, vertexArray)
{
	var verticesCount = vertexArray.length;
	
	if (idx < 0 || idx > verticesCount-1)
	{ return undefined; }
	
	var nextIdx;
	
	if (idx === verticesCount - 1)
	{ nextIdx = 0; }
	else
	{ nextIdx = idx + 1; }

	return nextIdx;
};

VertexList.getVtxSegment = function(idx, vertexArray, resultVtxSegment)
{
	var currVertex = vertexArray[idx];
	var nextIdx = VertexList.getNextIdx(idx, vertexArray);
	var nextVertex = vertexArray[nextIdx];
	
	if (resultVtxSegment === undefined)
	{ resultVtxSegment = new VtxSegment(currVertex, nextVertex); }
	else 
	{
		resultVtxSegment.setVertices(currVertex, nextVertex);
	}

	return resultVtxSegment;
};

VertexList.getVector = function(idx, vertexArray, resultVector)
{
	var currVertex = vertexArray[idx];
	var nextIdx = VertexList.getNextIdx(idx, vertexArray);
	var nextVertex = vertexArray[nextIdx];
	
	var currPoint = currVertex.point3d;
	var nextPoint = nextVertex.point3d;
	
	if (resultVector === undefined)
	{ resultVector = new Point3D(nextPoint.x - currPoint.x, nextPoint.y - currPoint.y, nextPoint.z - currPoint.z); }
	else 
	{
		resultVector.setVertices(nextPoint.x - currPoint.x, nextPoint.y - currPoint.y, nextPoint.z - currPoint.z);
	}

	return resultVector;
};

VertexList.getDirection = function(idx, vertexArray, resultDir)
{
	resultDir = VertexList.getVector(idx, vertexArray, resultDir);
	resultDir.unitary();
	return resultDir;
};

VertexList.getCrossProduct = function(idx, vertexArray, resultCrossProduct)
{
	var currVector = VertexList.getVector(idx, vertexArray, undefined);
	var prevIdx = VertexList.getPrevIdx(idx, vertexArray);
	var prevVector = VertexList.getVector(prevIdx, vertexArray, undefined);
	resultCrossProduct = prevVector.crossProduct(currVector, resultCrossProduct);

	return resultCrossProduct;
};

VertexList.getProjectedOntoPlane = function(vertexList, plane, projectionDirection, resultVertexList)
{
	if(vertexList === undefined)
		return resultVertexList;
	
	if(resultVertexList === undefined)
		resultVertexList = new VertexList();
	
	var vertex, projectedVertex;
	var vertexCount = vertexList.getVertexCount();
	for(var i=0; i<vertexCount; i++)
	{
		vertex = vertexList.getVertex(i);
		projectedVertex = resultVertexList.newVertex();
		projectedVertex = Vertex.getProjectedOntoPlane(vertex, plane, projectionDirection, projectedVertex)
	}
	
	return resultVertexList;
};

VertexList.getProjectedPoints2DArray = function(vertexArray, normal, resultPoints2dArray)
{
	// This function projects the vertices on to planes xy, yz or xz.***
	if (vertexArray === undefined)
	{ return resultPoints2dArray; }
	
	if (resultPoints2dArray === undefined)
	{ resultPoints2dArray = []; }
	
	var bestPlaneToProject = Face.getBestFacePlaneToProject(normal);
	
	var point2d;
	var verticesCount = vertexArray.length;
	// Project this face into the bestPlane.***
	if (bestPlaneToProject === 0) // plane-xy.***
	{
		// project this face into a xy plane.***
		for (var i=0; i<verticesCount; i++)
		{
			var vertex = vertexArray[i];
			var point3d = vertex.point3d;
			if (normal.z > 0)
			{ point2d = new Point2D(point3d.x, point3d.y); }
			else
			{ point2d = new Point2D(point3d.x, -point3d.y); }
			point2d.ownerVertex3d = vertex; // with this we can reconvert polygon2D to face3D.***
			resultPoints2dArray.push(point2d);
		}
	}
	else if (bestPlaneToProject === 1) // plane-yz.***
	{
		// project this face into a yz plane.***
		for (var i=0; i<verticesCount; i++)
		{
			var vertex = vertexArray[i];
			var point3d = vertex.point3d;
			if (normal.x > 0)
			{ point2d = new Point2D(point3d.y, point3d.z); }
			else
			{ point2d = new Point2D(-point3d.y, point3d.z); }
			point2d.ownerVertex3d = vertex; // with this we can reconvert polygon2D to face3D.***
			resultPoints2dArray.push(point2d);
		}
	}
	else if (bestPlaneToProject === 2) // plane-xz.***
	{
		// project this face into a xz plane.***
		for (var i=0; i<verticesCount; i++)
		{
			var vertex = vertexArray[i];
			var point3d = vertex.point3d;
			if (normal.y > 0)
			{ point2d = new Point2D(-point3d.x, point3d.z); }
			else
			{ point2d = new Point2D(point3d.x, point3d.z); }
			point2d.ownerVertex3d = vertex; // with this we can reconvert polygon2D to face3D.***
			resultPoints2dArray.push(point2d);
		}
	}
	
	if(resultPoints2dArray.length === 0)
		var hola = 0;
	
	return resultPoints2dArray;
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
VertexList.prototype.copyFromPoint3DArray = function(point3dArray) 
{
	if (point3dArray === undefined)
	{ return; }
	
	// first reset vertexArray.
	this.deleteObjects();
	this.vertexArray = [];
	
	var point3d;
	var vertex;

	var pointsCount = point3dArray.length;
	for (var i=0; i<pointsCount; i++)
	{
		point3d = point3dArray[i];
		vertex = this.newVertex();
		vertex.point3d = new Point3D();
		vertex.point3d.set(point3d.x, point3d.y, point3d.z);
		vertex.point3d.pointType = point3d.pointType;
		vertex.vertexType = point3d.pointType;
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertex
 */
VertexList.prototype.copyFromPoint2DList = function(point2dList, z) 
{
	// first reset vertexArray.
	this.deleteObjects();
	this.vertexArray = [];
	
	var point2d;
	var vertex;
	if (z === undefined)
	{ z = 0; }

	var pointsCount = point2dList.getPointsCount();
	for (var i=0; i<pointsCount; i++)
	{
		point2d = point2dList.getPoint(i);
		vertex = this.newVertex();
		vertex.point3d = new Point3D();
		vertex.point3d.set(point2d.x, point2d.y, z);
		vertex.point3d.pointType = point2d.pointType;
		vertex.vertexType = point2d.pointType;
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
	return VertexList.getPrevIdx(idx, this.vertexArray);
};

VertexList.prototype.getNextIdx = function(idx)
{
	return VertexList.getNextIdx(idx, this.vertexArray);
};

VertexList.prototype.getIdxOfVertex = function(vertex)
{
	var verticesCount = this.vertexArray.length;
	var i=0;
	var idx = -1;
	var found = false;
	while (!found && i<verticesCount)
	{
		if (this.vertexArray[i] === vertex)
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
	return VertexList.getVtxSegment(idx, this.vertexArray, resultVtxSegment);
};

/**
 * 어떤 일을 하고 있습니까?
 * @param dirX 변수
 * @param dirY 변수
 * @param dirZ 변수
 * @param distance 변수
 */
VertexList.prototype.translateVertices = function(dx, dy, dz) 
{
	for (var i = 0, vertexCount = this.vertexArray.length; i < vertexCount; i++) 
	{
		this.vertexArray[i].translate(dx, dy, dz);
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

VertexList.prototype.setIdxInList = function()
{
	VertexList.setIdxInList(this.vertexArray);
	/*
	for (var i = 0, vertexCount = this.vertexArray.length; i < vertexCount; i++) 
	{
		this.vertexArray[i].idxInList = i;
	}
	*/
};

VertexList.setIdxInList = function(vertexArray)
{
	if (vertexArray === undefined)
	{ return; }
	
	for (var i = 0, vertexCount = vertexArray.length; i < vertexCount; i++) 
	{
		vertexArray[i].idxInList = i;
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param transformMatrix 변수
 */
VertexList.prototype.getVboDataArrays = function(resultVbo, vboMemManager) 
{
	VertexList.getVboDataArrays(this.vertexArray, resultVbo, vboMemManager) ;
	return resultVbo;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param transformMatrix 변수
 */
VertexList.getVboDataArrays = function(vertexArray, resultVbo, vboMemManager) 
{
	// returns positions, and if exist, normals, colors, texCoords.***
	var verticesCount = vertexArray.length;
	if (verticesCount === 0)
	{ return resultVbo; }
	
	if (resultVbo === undefined)
	{ resultVbo = new VBOVertexIdxCacheKey(); }
	
	var vertex, position, normal, color, texCoord;
	
	// 1rst, check if exist normals, colors & texCoords.***
	var hasNormals = false;
	var hasColors = false;
	var hasTexCoords = false;
	
	// Take the 1rst vertex.***
	vertex = vertexArray[0];
	if (vertex.point3d === undefined)
	{ return resultVbo; }
	
	if (vertex.normal !== undefined)
	{ hasNormals = true; }
	
	if (vertex.color4 !== undefined)
	{ hasColors = true; }
	
	if (vertex.texCoord !== undefined)
	{ hasTexCoords = true; }
	
	// Make dataArrays. Use vboMemManager to determine classified memorySize( if use memory pool).***
	var posVboDataArray, norVboDataArray, colVboDataArray, tcoordVboDataArray;
	
	// Positions.***
	var posByteSize = verticesCount * 3;
	posVboDataArray = new Float32Array(posByteSize);
	
	if (hasNormals)
	{ 
		var norByteSize = verticesCount * 3;
		norVboDataArray = new Int8Array(norByteSize);
	}
	
	if (hasColors)
	{ 
		var colByteSize = verticesCount * 4;
		colVboDataArray = new Uint8Array(colByteSize);
	}
	
	if (hasTexCoords)
	{ 
		var texCoordByteSize = verticesCount * 2;
		tcoordVboDataArray = new Float32Array(texCoordByteSize);
	}
	
	for (var i = 0; i < verticesCount; i++) 
	{
		vertex = vertexArray[i];
		if (vertex.point3d === undefined)
		{ continue; }
		
		position = vertex.point3d;

		posVboDataArray[i*3] = position.x;
		posVboDataArray[i*3+1] = position.y;
		posVboDataArray[i*3+2] = position.z;
		
		if (hasNormals)
		{
			normal = vertex.normal;
			norVboDataArray[i*3] = normal.x*127;
			norVboDataArray[i*3+1] = normal.y*127;
			norVboDataArray[i*3+2] = normal.z*127;
		}
		
		if (hasColors)
		{
			color = vertex.color4;
			colVboDataArray[i*4] = color.r*255;
			colVboDataArray[i*4+1] = color.g*255;
			colVboDataArray[i*4+2] = color.b*255;
			colVboDataArray[i*4+3] = color.a*255;
		}
		
		if (hasTexCoords)
		{
			texCoord = vertex.texCoord;
			tcoordVboDataArray[i*2] = texCoord.x;
			tcoordVboDataArray[i*2+1] = texCoord.y;
		}
	}
	
	resultVbo.setDataArrayPos(posVboDataArray, vboMemManager);
	
	if (hasNormals)
	{
		resultVbo.setDataArrayNor(norVboDataArray, vboMemManager);
	}
	
	if (hasColors)
	{
		resultVbo.setDataArrayCol(colVboDataArray, vboMemManager);
	}
	
	if (hasTexCoords)
	{
		resultVbo.setDataArrayTexCoord(tcoordVboDataArray, vboMemManager);
	}

	return resultVbo;
};






































