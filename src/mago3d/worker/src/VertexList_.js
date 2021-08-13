'use strict';

var VertexList_ = function() 
{
	this.vertexArray = [];
};

VertexList_.prototype.newVertex = function(point3d) 
{
	var vertex = new Vertex_(point3d);
	this.vertexArray.push(vertex);
	return vertex;
};

VertexList_.prototype.getVertex = function(idx) 
{
	return this.vertexArray[idx];
};

VertexList_.prototype.getVertexCount = function() 
{
	return this.vertexArray.length;
};

VertexList_.prototype.setIdxInList = function()
{
	VertexList_.setIdxInList(this.vertexArray);
};

VertexList_.setIdxInList = function(vertexArray)
{
	if (vertexArray === undefined)
	{ return; }
	
	for (var i = 0, vertexCount = vertexArray.length; i < vertexCount; i++) 
	{
		vertexArray[i].idxInList = i;
	}
};

VertexList_.getPrevIdx = function(idx, vertexArray)
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

VertexList_.getNextIdx = function(idx, vertexArray)
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

VertexList_.solveUroborusOfArray = function(vertexArray, error) 
{
	var firstVertex = vertexArray[0];
	var lastVertex = vertexArray[vertexArray.length-1];

	if (firstVertex.getPosition().isCoincidentToPoint(lastVertex.getPosition(), error))
	{
		vertexArray.length = vertexArray.length-1;
	}

	return vertexArray;
};

VertexList_.getVboDataArrays = function(vertexArray, resultVbo) 
{
	// returns positions, and if exist, normals, colors, texCoords.
	var verticesCount = vertexArray.length;
	if (verticesCount === 0)
	{ return resultVbo; }
	
	if (resultVbo === undefined)
	{ resultVbo = {}; }
	
	var vertex, position, normal, color, texCoord;
	
	// 1rst, check if exist normals, colors & texCoords.
	var hasNormals = false;
	var hasColors = false;
	var hasTexCoords = false;
	
	// Take the 1rst vertex.
	vertex = vertexArray[0];
	if (vertex.point3d === undefined)
	{ return resultVbo; }
	
	if (vertex.normal !== undefined)
	{ hasNormals = true; }
	
	if (vertex.color4 !== undefined)
	{ hasColors = true; }
	
	if (vertex.texCoord !== undefined)
	{ hasTexCoords = true; }
	
	// Make dataArrays. Use vboMemManager to determine classified memorySize( if use memory pool).
	var posVboDataArray, norVboDataArray, colVboDataArray, tcoordVboDataArray;
	
	// Positions.
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
	
	resultVbo.posVboDataArray = posVboDataArray;
	resultVbo.norVboDataArray = norVboDataArray;
	resultVbo.colVboDataArray = colVboDataArray;
	resultVbo.tcoordVboDataArray = tcoordVboDataArray;

	return resultVbo;
};

VertexList_.prototype.getBoundingBox = function(resultBox) 
{
	if (resultBox === undefined) { resultBox = new BoundingBox_(); }

	for (var i = 0, vertexCount = this.vertexArray.length; i < vertexCount; i++) 
	{
		if (i === 0) { resultBox.init(this.vertexArray[i].point3d); }
		else { resultBox.addPoint(this.vertexArray[i].point3d); }
	}
	return resultBox;
};

VertexList_.getProjectedPoints2DArray = function(vertexArray, normal, resultPoints2dArray)
{
	// This function projects the vertices on to planes xy, yz or xz.
	if (vertexArray === undefined)
	{ return resultPoints2dArray; }
	
	if (resultPoints2dArray === undefined)
	{ resultPoints2dArray = []; }
	
	var bestPlaneToProject = Face_.getBestFacePlaneToProject(normal);
	
	var point2d;
	var verticesCount = vertexArray.length;
	// Project this face into the bestPlane.
	if (bestPlaneToProject === 0) // plane-xy.
	{
		// project this face into a xy plane.
		for (var i=0; i<verticesCount; i++)
		{
			var vertex = vertexArray[i];
			var point3d = vertex.point3d;
			if (normal.z > 0)
			{ point2d = new Point2D_(point3d.x, point3d.y); }
			else
			{ point2d = new Point2D_(point3d.x, -point3d.y); }
			point2d.ownerVertex3d = vertex; // with this we can reconvert polygon2D to face3D.
			resultPoints2dArray.push(point2d);
		}
	}
	else if (bestPlaneToProject === 1) // plane-yz.
	{
		// project this face into a yz plane.
		for (var i=0; i<verticesCount; i++)
		{
			var vertex = vertexArray[i];
			var point3d = vertex.point3d;
			if (normal.x > 0)
			{ point2d = new Point2D_(point3d.y, point3d.z); }
			else
			{ point2d = new Point2D_(-point3d.y, point3d.z); }
			point2d.ownerVertex3d = vertex; // with this we can reconvert polygon2D to face3D.
			resultPoints2dArray.push(point2d);
		}
	}
	else if (bestPlaneToProject === 2) // plane-xz.
	{
		// project this face into a xz plane.
		for (var i=0; i<verticesCount; i++)
		{
			var vertex = vertexArray[i];
			var point3d = vertex.point3d;
			if (normal.y > 0)
			{ point2d = new Point2D_(-point3d.x, point3d.z); }
			else
			{ point2d = new Point2D_(point3d.x, point3d.z); }
			point2d.ownerVertex3d = vertex; // with this we can reconvert polygon2D to face3D.
			resultPoints2dArray.push(point2d);
		}
	}
	
	return resultPoints2dArray;
};

VertexList_.getVector = function(idx, vertexArray, resultVector)
{
	var currVertex = vertexArray[idx];
	var nextIdx = VertexList_.getNextIdx(idx, vertexArray);
	var nextVertex = vertexArray[nextIdx];
	
	var currPoint = currVertex.point3d;
	var nextPoint = nextVertex.point3d;
	
	if (resultVector === undefined)
	{ resultVector = new Point3D_(nextPoint.x - currPoint.x, nextPoint.y - currPoint.y, nextPoint.z - currPoint.z); }
	else 
	{
		resultVector.set(nextPoint.x - currPoint.x, nextPoint.y - currPoint.y, nextPoint.z - currPoint.z);
	}

	return resultVector;
};

VertexList_.eliminateCoincidentVerticesOfArray = function(vertexArray, resultVertexArray, error) 
{
	if (!resultVertexArray)
	{ resultVertexArray = []; }

	// put the 1rst vertex into resultVertexArray.
	resultVertexArray.push(vertexArray[0]);
	var lastVertex = vertexArray[0];
	var vertexCount = vertexArray.length;
	for (var i=1; i<vertexCount; i++)
	{
		var vertex = vertexArray[i];

		// check if the vertex is coincident with the lastVertex.
		if (!vertex.getPosition().isCoincidentToPoint(lastVertex.getPosition(), error))
		{
			resultVertexArray.push(vertex);
			lastVertex = vertex;
		}
	}

	resultVertexArray = VertexList_.solveUroborusOfArray(resultVertexArray, error);

	return resultVertexArray;
};

VertexList_.prototype.getNextIdx = function(idx)
{
	return VertexList_.getNextIdx(idx, this.vertexArray);
};

VertexList_.prototype.getPrevIdx = function(idx)
{
	return VertexList_.getPrevIdx(idx, this.vertexArray);
};

VertexList_.prototype.deleteObjects = function() 
{
	for (var i = 0, vertexCount = this.vertexArray.length; i < vertexCount; i++) 
	{
		this.vertexArray[i].deleteObjects();
		this.vertexArray[i] = undefined;
	}
	this.vertexArray = undefined;
};

VertexList_.prototype.copyFromPoint3DArray = function(point3dArray) 
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
		vertex.point3d = new Point3D_();
		vertex.point3d.set(point3d.x, point3d.y, point3d.z);
		vertex.point3d.pointType = point3d.pointType;
		vertex.vertexType = point3d.pointType;
	}
};