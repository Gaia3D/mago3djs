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

/**
 * 어떤 일을 하고 있습니까?
 * @param idx 변수
 * @returns vertexArray[idx]
 */
Mesh.prototype.getNoRepeatedVerticesArray = function(resultVerticesArray) 
{
	if(resultVerticesArray === undefined)
		resultVerticesArray = [];
	
	// 1rst, assign vertex-IdxInList for all used vertices.***
	var facesCount;
	var face;
	var surface;
	var idxAux = 0;
	var vtx;
	var verticesCount;
	var surfacesCount = this.getSurfacesCount();
	for(var i=0; i<surfacesCount; i++)
	{
		surface = this.getSurface(i);
		facesCount = surface.getFacesCount();
		for(var j=0; j<facesCount; j++)
		{
			face = surface.getFace(j);
			verticesCount = face.getVerticesCount();
			for(var k=0; k<verticesCount; k++)
			{
				vtx = face.getVertex(k);
				if(vtx === undefined)
					var hola = 0;
				vtx.setIdxInList(idxAux);
				idxAux++;
			}
		}
	}
	
	// now, make a map of unique vertices map using "idxInList" of vertices.***
	var verticesMap = {};
	var surfacesCount = this.getSurfacesCount();
	for(var i=0; i<surfacesCount; i++)
	{
		surface = this.getSurface(i);
		facesCount = surface.getFacesCount();
		for(var j=0; j<facesCount; j++)
		{
			face = surface.getFace(j);
			verticesCount = face.getVerticesCount();
			for(var k=0; k<verticesCount; k++)
			{
				vtx = face.getVertex(k);
				verticesMap[vtx.getIdxInList().toString()] = vtx;
			}
		}
	}
	
	// finally make the unique vertices array.***
	var vertex;
	for (var key in verticesMap)
	{
		vertex = verticesMap[key];
		resultVerticesArray.push(vertex);
	}
	
	return resultVerticesArray;
};

Mesh.prototype.transformByMatrix4 = function(tMat4)
{
	if(this.vertexList === undefined)
	{
		this.vertexList = new VertexList();
		this.vertexList.vertexArray = this.getNoRepeatedVerticesArray(this.vertexList.vertexArray);
	}
	
	this.vertexList.transformPointsByMatrix4(tMat4);
	this.calculateVerticesNormals();
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

Mesh.prototype.reverseSense = function()
{
	var surface;
	var surfacesCount = this.getSurfacesCount();
	for(var i=0; i<surfacesCount; i++)
	{
		surface = this.getSurface(i);
		surface.reverseSense();
	}
	
	this.calculateVerticesNormals();
};

Mesh.prototype.getCopy = function(resultMeshCopy)
{
	if(this.vertexList === undefined)
		this.vertexList = new VertexList();
	
	if(this.vertexList.vertexArray === undefined || this.vertexList.vertexArray.length === 0)
		this.vertexList.vertexArray = this.getNoRepeatedVerticesArray(this.vertexList.vertexArray);
	
	if(resultMeshCopy === undefined)
		resultMeshCopy = new Mesh();
	
	// 1rst copy vertexList.***
	if(resultMeshCopy.vertexList === undefined)
		resultMeshCopy.vertexList = new VertexList();
	
	resultMeshCopy.vertexList.copyFrom(this.vertexList);
	
	// set idxInList both vertexLists.***
	this.vertexList.setIdxInList();
	resultMeshCopy.vertexList.setIdxInList();
	
	// now copy surfaces.***
	var surface, facesCount, face, verticesCount;
	var vtxIdx;
	var surfaceCopy, faceCopy, vtxCopy;
	var vtx;
	var surfacesCount = this.getSurfacesCount();
	for(var i=0; i<surfacesCount; i++)
	{
		surface = this.getSurface(i);
		surfaceCopy = resultMeshCopy.newSurface();
		facesCount = surface.getFacesCount();
		for(var j=0; j<facesCount; j++)
		{
			face = surface.getFace(j);
			faceCopy = surfaceCopy.newFace();
			verticesCount = face.getVerticesCount();
			for(var k=0; k<verticesCount; k++)
			{
				vtx = face.getVertex(k);
				vtxIdx = vtx.getIdxInList();
				vtxCopy = resultMeshCopy.vertexList.getVertex(vtxIdx);
				faceCopy.addVertex(vtxCopy);
			}
		}
	}
	
	resultMeshCopy.calculateVerticesNormals();
	
	return resultMeshCopy;
};

Mesh.prototype.getVbo = function(resultVbo)
{
	if(resultVbo === undefined)
		resultVbo = new VBOVertexIdxCacheKey();

	// 1rst, make global vertices array.***
	var globalVerticesArray = this.getNoRepeatedVerticesArray();
	
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



















































