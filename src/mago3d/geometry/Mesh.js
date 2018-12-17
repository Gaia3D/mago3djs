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
	this.hedgesList;
	
	this.vboKeysContainer;
};

Mesh.prototype.newSurface = function()
{
	if (this.surfacesArray === undefined)
	{ this.surfacesArray = []; }
	
	var surface = new Surface();
	this.surfacesArray.push(surface);
	return surface;
};

Mesh.prototype.getSurface = function(idx)
{
	if (this.surfacesArray === undefined)
	{ return undefined; }
	
	return this.surfacesArray[idx];
};

Mesh.prototype.addSurface = function(surface)
{
	if (surface === undefined)
	{ return; }
	
	if (this.surfacesArray === undefined)
	{ this.surfacesArray = []; }
	
	this.surfacesArray.push(surface);
};

Mesh.prototype.mergeMesh = function(mesh)
{
	if (mesh === undefined)
	{ return; }
	
	if (this.surfacesArray === undefined)
	{ this.surfacesArray = []; }
	
	var surfacesCount = mesh.getSurfacesCount();
	for (var i=0; i<surfacesCount; i++)
	{
		this.addSurface(mesh.getSurface(i));
	}
	mesh.surfacesArray = undefined;
};

Mesh.prototype.getSurfacesCount = function()
{
	if (this.surfacesArray === undefined)
	{ return 0; }
	
	return this.surfacesArray.length;
};

Mesh.prototype.getCopySurfaceIndependentMesh = function(resultMesh)
{
	// In a surfaceIndependentMesh, the surfaces are disconex.***
	if (resultMesh === undefined)
	{ resultMesh = new Mesh(); }
	
	var surface, surfaceCopy;
	var surfacesCount = this.getSurfacesCount();
	for (var i=0; i<surfacesCount; i++)
	{
		surface = this.getSurface(i);
		surfaceCopy = resultMesh.newSurface();
		surfaceCopy = surface.getCopyIndependentSurface(surfaceCopy);
	}
	
	return resultMesh;
};

Mesh.prototype.getTriangles = function(resultTrianglesArray)
{
	if (this.surfacesArray === undefined || this.surfacesArray.length === 0)
	{ return resultTrianglesArray; }
	
	if (resultTrianglesArray === undefined)
	{ resultTrianglesArray = []; }
	
	var surface;
	var surfacesCount = this.getSurfacesCount();
	for (var i=0; i<surfacesCount; i++)
	{
		surface = this.getSurface(i);
		resultTrianglesArray = surface.getTriangles(resultTrianglesArray);
	}
	
	return resultTrianglesArray;
};

Mesh.prototype.getTrianglesConvex = function(resultTrianglesArray)
{
	// To call this method, the faces must be CONVEX.***
	if (this.surfacesArray === undefined || this.surfacesArray.length === 0)
	{ return resultTrianglesArray; }
	
	if (resultTrianglesArray === undefined)
	{ resultTrianglesArray = []; }
	
	var surface;
	var surfacesCount = this.getSurfacesCount();
	for (var i=0; i<surfacesCount; i++)
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
	if (resultVerticesArray === undefined)
	{ resultVerticesArray = []; }
	
	// 1rst, assign vertex-IdxInList for all used vertices.***
	var facesCount;
	var face;
	var surface;
	var idxAux = 0;
	var vtx;
	var verticesCount;
	var surfacesCount = this.getSurfacesCount();
	for (var i=0; i<surfacesCount; i++)
	{
		surface = this.getSurface(i);
		facesCount = surface.getFacesCount();
		for (var j=0; j<facesCount; j++)
		{
			face = surface.getFace(j);
			verticesCount = face.getVerticesCount();
			for (var k=0; k<verticesCount; k++)
			{
				vtx = face.getVertex(k);
				if (vtx === undefined)
				{ var hola = 0; }
				vtx.setIdxInList(idxAux);
				idxAux++;
			}
		}
	}
	
	// now, make a map of unique vertices map using "idxInList" of vertices.***
	var verticesMap = {};
	var surfacesCount = this.getSurfacesCount();
	for (var i=0; i<surfacesCount; i++)
	{
		surface = this.getSurface(i);
		facesCount = surface.getFacesCount();
		for (var j=0; j<facesCount; j++)
		{
			face = surface.getFace(j);
			verticesCount = face.getVerticesCount();
			for (var k=0; k<verticesCount; k++)
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

Mesh.prototype.getVertexList = function()
{
	if (this.vertexList === undefined)
	{
		this.vertexList = new VertexList();
	}
	
	return this.vertexList;
};

Mesh.prototype.transformByMatrix4 = function(tMat4)
{
	if (this.vertexList === undefined)
	{
		this.vertexList = new VertexList();
		this.vertexList.vertexArray = this.getNoRepeatedVerticesArray(this.vertexList.vertexArray);
	}
	
	this.vertexList.transformPointsByMatrix4(tMat4);
	this.calculateVerticesNormals();
};

Mesh.prototype.translate = function(x, y, z)
{
	if (this.vertexList === undefined)
	{
		this.vertexList = new VertexList();
		this.vertexList.vertexArray = this.getNoRepeatedVerticesArray(this.vertexList.vertexArray);
	}
	
	this.vertexList.translateVertices(x, y, z);
};

Mesh.prototype.calculateVerticesNormals = function()
{
	// PROVISIONAL.***
	var surface;
	var surfacesCount = this.getSurfacesCount();
	for (var i=0; i<surfacesCount; i++)
	{
		surface = this.getSurface(i);
		surface.calculateVerticesNormals();
	}
};

Mesh.prototype.calculateTexCoordsSpherical = function()
{
	var sphericalCoords = new GeographicCoord();
	var verticesCount = this.vertexList.getVertexCount();
	for (var i=0; i<verticesCount; i++)
	{
		var vertex = this.vertexList.getVertex(i);
		var position = vertex.point3d;
		sphericalCoords = position.getSphericalCoords(sphericalCoords);
		
		var u = sphericalCoords.longitude / 360.0;
		var v;
		var lat = sphericalCoords.latitude;
		v = 0.5 * (90.0 + lat) / 90.0;
		
		if (vertex.texCoord === undefined)
		{ vertex.texCoord = new Point2D(u, v); }
	}
};

Mesh.prototype.setColor = function(r, g, b, a)
{
	var surface;
	var surfacesCount = this.getSurfacesCount();
	for (var i=0; i<surfacesCount; i++)
	{
		surface = this.getSurface(i);
		surface.setColor(r, g, b, a);
	}
};

Mesh.prototype.reverseSense = function()
{
	var surface;
	var surfacesCount = this.getSurfacesCount();
	for (var i=0; i<surfacesCount; i++)
	{
		surface = this.getSurface(i);
		surface.reverseSense();
	}
	
	this.calculateVerticesNormals();
};

Mesh.prototype.getFrontierHalfEdges = function(resultHedgesArray)
{
	var surface;
	var surfacesCount = this.getSurfacesCount();
	for (var i=0; i<surfacesCount; i++)
	{
		surface = this.getSurface(i);
		resultHedgesArray = surface.getFrontierHalfEdges(resultHedgesArray);
	}
	
	return resultHedgesArray;
};

Mesh.prototype.getCopy = function(resultMeshCopy)
{
	if (this.vertexList === undefined)
	{ this.vertexList = new VertexList(); }
	
	if (this.vertexList.vertexArray === undefined || this.vertexList.vertexArray.length === 0)
	{ this.vertexList.vertexArray = this.getNoRepeatedVerticesArray(this.vertexList.vertexArray); }
	
	if (resultMeshCopy === undefined)
	{ resultMeshCopy = new Mesh(); }
	
	// 1rst copy vertexList.***
	if (resultMeshCopy.vertexList === undefined)
	{ resultMeshCopy.vertexList = new VertexList(); }
	
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
	for (var i=0; i<surfacesCount; i++)
	{
		surface = this.getSurface(i);
		surfaceCopy = resultMeshCopy.newSurface();
		facesCount = surface.getFacesCount();
		for (var j=0; j<facesCount; j++)
		{
			face = surface.getFace(j);
			faceCopy = surfaceCopy.newFace();
			verticesCount = face.getVerticesCount();
			for (var k=0; k<verticesCount; k++)
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
	if (resultTrianglesListsArray === undefined)
	{ resultTrianglesListsArray = []; }
	
	// This function returns trianglesListsArray. Each trianglesList's vertices count is lower than 65535.***
	var shortSize = 65535;
	var trianglesList = new TrianglesList();
	resultTrianglesListsArray.push(trianglesList);
	var trianglesCount = trianglesArray.length;
	if (trianglesCount*3 <shortSize)
	{
		trianglesList.trianglesArray = [];
		Array.prototype.push.apply(trianglesList.trianglesArray, trianglesArray);
		return resultTrianglesListsArray;
	}
	
	// 1rst, make global vertices array.***
	var globalVerticesArray = TrianglesList.getNoRepeatedVerticesArray(trianglesArray, undefined);
	var verticesCount = globalVerticesArray.length;
	
	if (verticesCount <shortSize)
	{
		trianglesList.trianglesArray = [];
		Array.prototype.push.apply(trianglesList.trianglesArray, trianglesArray);
		return resultTrianglesListsArray;
	}
	
	VertexList.setIdxInList(globalVerticesArray);
	var rejectedTrianglesArray = [];
	var trianglesCount = trianglesArray.length;
	var triangle;
	
	for (var i=0; i<trianglesCount; i++)
	{
		triangle = trianglesArray[i];
		if (triangle.vertex0.idxInList < shortSize && triangle.vertex1.idxInList< shortSize && triangle.vertex2.idxInList< shortSize)
		{
			trianglesList.addTriangle(triangle);
		}
		else 
		{
			rejectedTrianglesArray.push(triangle);
		}
	};
	
	if (rejectedTrianglesArray.length > 0)
	{
		resultTrianglesListsArray = this.getTrianglesListsArrayBy2ByteSize(rejectedTrianglesArray, resultTrianglesListsArray);
	}
	
	return resultTrianglesListsArray;
};

Mesh.prototype.render = function(magoManager, shader, renderType, glPrimitive)
{
	var vboMemManager = magoManager.vboMemoryManager;
	
	if (this.vboKeysContainer === undefined)
	{
		this.vboKeysContainer = this.getVbo(this.vboKeysContainer, vboMemManager);
		return;
	}
	
	var gl = magoManager.sceneState.gl;
	
	var vboKeysCount = this.vboKeysContainer.vboCacheKeysArray.length;
	for (var i=0; i<vboKeysCount; i++)
	{
		var vboKey = this.vboKeysContainer.vboCacheKeysArray[i];
		if (!vboKey.isReadyPositions(gl, vboMemManager) || 
			!vboKey.isReadyNormals(gl, vboMemManager) || 
			!vboKey.isReadyFaces(gl, vboMemManager))
		{ return false; }
		
		// Positions.***
		if (vboKey.meshVertexCacheKey !== shader.last_vboPos_binded)
		{
			gl.bindBuffer(gl.ARRAY_BUFFER, vboKey.meshVertexCacheKey);
			gl.vertexAttribPointer(shader.position3_loc, 3, gl.FLOAT, false, 0, 0);
			shader.last_vboPos_binded = vboKey.meshVertexCacheKey;
		}
		
		// Normals.***
		if (shader.normal3_loc && shader.normal3_loc !== -1) 
		{
			if (vboKey.meshNormalCacheKey !== shader.last_vboNor_binded)
			{
				gl.bindBuffer(gl.ARRAY_BUFFER, vboKey.meshNormalCacheKey);
				gl.vertexAttribPointer(shader.normal3_loc, 3, gl.BYTE, true, 0, 0);
				shader.last_vboNor_binded = vboKey.meshNormalCacheKey;
			}
		}
		
		// Indices.***
		if (vboKey.meshFacesCacheKey !== shader.last_vboIdx_binded)
		{
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vboKey.meshFacesCacheKey);
			shader.last_vboIdx_binded = vboKey.meshFacesCacheKey;
		}
		var primitive;
		if(glPrimitive)
			primitive = glPrimitive;
		else
			primitive = gl.TRIANGLES;
		
		gl.drawElements(primitive, vboKey.indicesCount, gl.UNSIGNED_SHORT, 0);
	}
};

Mesh.prototype.getVbo = function(resultVboContainer, vboMemManager)
{
	if (resultVboContainer === undefined)
	{ resultVboContainer = new VBOVertexIdxCacheKeysContainer(); }

	// make global triangles array.***
	var trianglesArray = this.getTriangles(undefined);
	var trianglesCount = trianglesArray.length;
	
	// If vertices count > shortSize(65535), then must split the mesh.***
	var trianglesListsArray = this.getTrianglesListsArrayBy2ByteSize(trianglesArray, undefined);
	var trianglesList;
	var verticesArray;
	var trianglesListsCount = trianglesListsArray.length;
	for (var i=0; i<trianglesListsCount; i++)
	{
		trianglesList = trianglesListsArray[i];
		verticesArray = trianglesList.getNoRepeatedVerticesArray(undefined);
		var vbo = resultVboContainer.newVBOVertexIdxCacheKey();
		VertexList.setIdxInList(verticesArray);
		VertexList.getVboDataArrays(verticesArray, vbo, vboMemManager);
		trianglesList.assignVerticesIdx();
		TrianglesList.getVboFaceDataArray(trianglesList.trianglesArray, vbo, vboMemManager);
		
	}

	return resultVboContainer;
};

Mesh.prototype.getVboTrianglesConvex = function(resultVboContainer, vboMemManager)
{
	if (resultVboContainer === undefined)
	{ resultVboContainer = new VBOVertexIdxCacheKeysContainer(); }

	// make global triangles array.***
	var trianglesArray = this.getTrianglesConvex(undefined); // for convex faces (faster).***
	var trianglesCount = trianglesArray.length;
	
	// If vertices count > shortSize(65535), then must split the mesh.***
	var trianglesListsArray = this.getTrianglesListsArrayBy2ByteSize(trianglesArray, undefined);
	var trianglesList;
	var verticesArray;
	var trianglesListsCount = trianglesListsArray.length;
	for (var i=0; i<trianglesListsCount; i++)
	{
		trianglesList = trianglesListsArray[i];
		verticesArray = trianglesList.getNoRepeatedVerticesArray(undefined);
		var vbo = resultVboContainer.newVBOVertexIdxCacheKey();
		VertexList.setIdxInList(verticesArray);
		VertexList.getVboDataArrays(verticesArray, vbo, vboMemManager);
		trianglesList.assignVerticesIdx();
		TrianglesList.getVboFaceDataArray(trianglesList.trianglesArray, vbo, vboMemManager);
		
	}

	return resultVboContainer;
};

Mesh.prototype.getVboEdges = function(resultVboContainer)
{
	// provisionally make edges by this.***
	var frontierHedgesArray = this.getFrontierHalfEdges(undefined);
	var hedgesCount = frontierHedgesArray.length;
	var hedge;
	var vertexArray = [];
	var indicesArray = [];
	var strVertex, endVertex;
	var index = 0;
	for (var i=0; i<hedgesCount; i++)
	{
		hedge = frontierHedgesArray[i];
		strVertex = hedge.startVertex;
		endVertex = hedge.getEndVertex();
		vertexArray.push(strVertex.point3d.x);
		vertexArray.push(strVertex.point3d.y);
		vertexArray.push(strVertex.point3d.z);
		vertexArray.push(endVertex.point3d.x);
		vertexArray.push(endVertex.point3d.y);
		vertexArray.push(endVertex.point3d.z);
		
		indicesArray.push(index); index++;
		indicesArray.push(index); index++;
	}
	
	var resultVbo = resultVboContainer.newVBOVertexIdxCacheKey();
	resultVbo.posVboDataArray = Float32Array.from(vertexArray);
	resultVbo.idxVboDataArray = Int16Array.from(indicesArray);
	resultVbo.indicesCount = resultVbo.idxVboDataArray.length;
};



















































