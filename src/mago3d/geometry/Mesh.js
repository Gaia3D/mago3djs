'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class Mesh
 */
var Mesh = function() 
{
	if (!(this instanceof Mesh)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.vertexList;
	this.surfacesArray;
};

Mesh.prototype.newSurface = function()
{
	if(this.surfacesArray === undefined)
		this.surfacesArray = [];
	
	var surface = new Surface();
	this.surfacesArray.push(surface);
	return surface;
};

Mesh.prototype.getSurface = function(idx)
{
	if(this.surfacesArray === undefined)
		return undefined;
	
	return this.surfacesArray[idx];
};

Mesh.prototype.addSurface = function(surface)
{
	if(surface === undefined)
		return;
	
	if(this.surfacesArray === undefined)
		this.surfacesArray = [];
	
	this.surfacesArray.push(surface);
};

Mesh.prototype.mergeMesh = function(mesh)
{
	if(mesh === undefined)
		return;
	
	if(this.surfacesArray === undefined)
		this.surfacesArray = [];
	
	var surfacesCount = mesh.getSurfacesCount();
	for(var i=0; i<surfacesCount; i++)
	{
		this.addSurface(mesh.getSurface(i));
	}
	mesh.surfacesArray = undefined;
};

Mesh.prototype.getSurfacesCount = function()
{
	if(this.surfacesArray === undefined)
		return 0;
	
	return this.surfacesArray.length;
};

Mesh.prototype.getCopySurfaceIndependetMesh = function(resultMesh)
{
	// In a surfaceIndependentMesh, the surfaces are disconex.***
	if(resultMesh === undefined)
		resultMesh = new Mesh();
	
	var surface, surfaceCopy;
	var surfacesCount = this.getSurfacesCount();
	for(var i=0; i<surfacesCount; i++)
	{
		surface = this.getSurface(i);
		surfaceCopy = resultMesh.newSurface();
		surfaceCopy = surface.getCopyIndependentSurface(surfaceCopy);
	}
	
	return resultMesh;
};

Mesh.prototype.getTrianglesConvex = function(resultTrianglesArray)
{
	// To call this method, the faces must be convex.***
	if(this.surfacesArray === undefined || this.surfacesArray.length === 0)
		return resultTrianglesArray;
	
	if(resultTrianglesArray === undefined)
		resultTrianglesArray = [];
	
	var surface;
	var surfacesCount = this.getSurfacesCount();
	for(var i=0; i<surfacesCount; i++)
	{
		surface = this.getSurface(i);
		resultTrianglesArray = surface.getTrianglesConvex(resultTrianglesArray);
	}
	
	return resultTrianglesArray;
};

Mesh.prototype.calculateVerticesNormals = function()
{
	// PROVISIONAL.***
	var surface;
	var surfacesCount = this.getSurfacesCount();
	for(var i=0; i<surfacesCount; i++)
	{
		surface = this.getSurface(i);
		surface.calculateVerticesNormals();
	}
};

Mesh.prototype.setColor = function(r, g, b, a)
{
	var surface;
	var surfacesCount = this.getSurfacesCount();
	for(var i=0; i<surfacesCount; i++)
	{
		surface = this.getSurface(i);
		surface.setColor(r, g, b, a);
	}
};

Mesh.prototype.getVbo = function(resultVbo)
{
	if(resultVbo === undefined)
		resultVbo = new VBOVertexIdxCacheKey();

	// 1rst, make global vertices array.***
	var globalVerticesArray = [];
	var surfaceLocalVerticesArray = [];
	var surface;
	var surfacesCount = this.getSurfacesCount();
	for(var i=0; i<surfacesCount; i++)
	{
		surface = this.getSurface(i);
		surfaceLocalVerticesArray.length = 0;
		if(surface.localVertexList !== undefined)
		{
			// if exist localVerticesList use it.***
			Array.prototype.push.apply(surfaceLocalVerticesArray, surface.localVertexList.vertexArray);
		}
		else{
			surfaceLocalVerticesArray = surface.getNoRepeatedVerticesArray(surfaceLocalVerticesArray);
		}
		
		Array.prototype.push.apply(globalVerticesArray, surfaceLocalVerticesArray);
	}
	
	var globalVertexList = new VertexList();
	globalVertexList.vertexArray = globalVerticesArray;
	globalVertexList.setIdxInList();
	resultVbo = globalVertexList.getVboDataArrays(resultVbo);
	
	// now, triangles vbo.***
	var faceIndicesArray = [];
	var trianglesArray = this.getTrianglesConvex(undefined);
	var trianglesCount = trianglesArray.length;
	var triangle;
	var idx0, idx1, idx2;
	for(var i=0; i<trianglesCount; i++)
	{
		triangle = trianglesArray[i];
		if(triangle.vertex0 !== undefined)
		{
			idx0 = triangle.vertex0.getIdxInList();
			idx1 = triangle.vertex1.getIdxInList();
			idx2 = triangle.vertex2.getIdxInList();
			Array.prototype.push.apply(faceIndicesArray, [idx0, idx1, idx2]);
		}
	}
	
	resultVbo.idxVboDataArray = Int16Array.from(faceIndicesArray);
	resultVbo.indicesCount = resultVbo.idxVboDataArray.length;
	
	return resultVbo;
};



















































