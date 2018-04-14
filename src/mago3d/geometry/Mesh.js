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

Mesh.prototype.getCopySurfaceIndependentMesh = function(resultMesh)
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

Mesh.prototype.getCopy = function(resultMesh)
{
	// TODO:
	// In a surfaceIndependentMesh, the surfaces are disconex.***
	if(resultMesh === undefined)
		resultMesh = new Mesh();
	
	// 1rst, copy the localVertexList.***
	var verticesArray = this.getNoRepeatedVerticesArray(undefined);
	var verticesCopyArray = [];
	var verticesCount = verticesArray.length;
	var vertex, vertexCopy;
	for(var i=0; i<verticesCount; i++)
	{
		vertex = verticesArray[i];
		vertex.setIdxInList(i); // set idxInList.***
		vertexCopy = new Vertex();
		vertexCopy.copyFrom(vertex);
		verticesCopyArray.push(vertexCopy);
	}
	
	// Now, copy the surfaces.***
	var surface, surfaceCopy;
	var face, faceCopy, facesCount;
	var vertex, vertexCopy;
	var surfacesCount = this.getSurfacesCount();
	for(var i=0; i<surfacesCount; i++)
	{
		surface = this.getSurface(i);
		surfaceCopy = resultMesh.newSurface();
		facesCount = surface.getFacesCount();
		for(var j=0; j<facesCount; j++)
		{
			face = surface.getFace(j);
			faceCopy = surfaceCopy.newFace();
			verticesCount = face.getVerticesCount();
			for(var k=0; k<verticesCount; k++)
			{
				
			}
		}
		
	}
	
	return resultMesh;
};

Mesh.prototype.getTrianglesConvex = function(resultTrianglesArray)
{
	// To call this method, the faces must be CONVEX.***
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

Mesh.prototype.getTrianglesListsArrayBy2ByteSize = function(trianglesArray, resultTrianglesListsArray)
{
	if(resultTrianglesListsArray === undefined)
		resultTrianglesListsArray = [];
	
	// This function returns trianglesListsArray. Each trianglesList's vertices count is lower than 65535.***
	// 1rst, make global vertices array.***
	var shortSize = 65535;
	var globalVerticesArray = TrianglesList.getNoRepeatedVerticesArray(trianglesArray, undefined);
	var verticesCount = globalVerticesArray.length;
	var trianglesList = new TrianglesList();
	resultTrianglesListsArray.push(trianglesList);
	
	if(verticesCount <shortSize)
	{
		trianglesList.trianglesArray = [];
		Array.prototype.push.apply(trianglesList.trianglesArray, trianglesArray);
		return resultTrianglesListsArray;
	}
	
	VertexList.setIdxInList(globalVerticesArray);
	var rejectedTrianglesArray = [];
	var trianglesCount = trianglesArray.length;
	var triangle;
	TrianglesList.assignVerticesIdx(trianglesArray);
	
	for(var i=0; i<trianglesCount; i++)
	{
		triangle = trianglesArray[i];
		if(triangle.vertex0.idxInList < shortSize && triangle.vertex1.idxInList< shortSize && triangle.vertex2.idxInList< shortSize)
		{
			trianglesList.addTriangle(triangle);
		}
		else{
			rejectedTrianglesArray.push(triangle);
		}
	};
	
	if(rejectedTrianglesArray.length > 0)
	{
		resultTrianglesListsArray = this.getTrianglesListsArrayBy2ByteSize(rejectedTrianglesArray, resultTrianglesListsArray);
	}
	
	return resultTrianglesListsArray;
};

Mesh.prototype.getVbo = function(resultVboContainer)
{
	if(resultVboContainer === undefined)
		resultVboContainer = new VBOVertexIdxCacheKeysContainer();

	// 1rst, make global vertices array.***
	var globalVerticesArray = this.getNoRepeatedVerticesArray();
	VertexList.setIdxInList(globalVerticesArray);
	var verticesCount = globalVerticesArray.length;
	
	// make global triangles array.***
	var trianglesArray = this.getTrianglesConvex(undefined);
	TrianglesList.assignVerticesIdx(trianglesArray);
	var trianglesCount = trianglesArray.length;
	
	// If vertices count > shortSize(65535), then must split the mesh.***
	var trianglesListsArray = this.getTrianglesListsArrayBy2ByteSize(trianglesArray, undefined);
	var trianglesList;
	var verticesArray;
	var trianglesListsCount = trianglesListsArray.length;
	for(var i=0; i<trianglesListsCount; i++)
	{
		trianglesList = trianglesListsArray[i];
		verticesArray = trianglesList.getNoRepeatedVerticesArray(undefined);
		var vbo = resultVboContainer.newVBOVertexIdxCacheKey();
		VertexList.setIdxInList(verticesArray);
		VertexList.getVboDataArrays(verticesArray, vbo);
		trianglesList.assignVerticesIdx();
		TrianglesList.getVboFaceDataArray(trianglesList.trianglesArray, vbo);
	}

	return resultVboContainer;
};



















































