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

Mesh.prototype.getHalfEdgesList = function()
{
	if (this.hedgesList === undefined)
	{ this.hedgesList = new HalfEdgesList(); }

	return this.hedgesList;
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
		if (Object.prototype.hasOwnProperty.call(verticesMap, key))
		{
			vertex = verticesMap[key];
			resultVerticesArray.push(vertex);
		}
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
	
	// If rotate a mesh, must recalculate normals.***
	var bForceRecalculatePlaneNormal = true;
	this.calculateVerticesNormals(bForceRecalculatePlaneNormal);
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

Mesh.prototype.calculateVerticesNormals = function(bForceRecalculatePlaneNormal)
{
	// PROVISIONAL.***
	var surface;
	var surfacesCount = this.getSurfacesCount();
	for (var i=0; i<surfacesCount; i++)
	{
		surface = this.getSurface(i);
		surface.calculateVerticesNormals(bForceRecalculatePlaneNormal);
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
	var primitive;
	
	var vboKeysCount = this.vboKeysContainer.vboCacheKeysArray.length;
	for (var i=0; i<vboKeysCount; i++)
	{
		var vboKey = this.vboKeysContainer.vboCacheKeysArray[i];
		
		// Positions.***
		if (!vboKey.bindDataPosition(shader, magoManager.vboMemoryManager))
		{ return false; }
		
		// Normals.***
		if (vboKey.vboBufferNor)
		{
			if (!vboKey.bindDataNormal(shader, magoManager.vboMemoryManager))
			{ return false; }
		}
		else 
		{
			shader.disableVertexAttribArray(shader.normal3_loc);
		}
		
		// Colors.***
		if (vboKey.vboBufferCol)
		{
			if (!vboKey.bindDataColor(shader, magoManager.vboMemoryManager))
			{ return false; }
		}
		else 
		{
			shader.disableVertexAttribArray(shader.color4_loc);
		}
		
		// TexCoords.***
		if (vboKey.vboBufferTCoord)
		{
			if (!vboKey.bindDataTexCoord(shader, magoManager.vboMemoryManager))
			{ return false; }
		}
		else 
		{
			shader.disableVertexAttribArray(shader.texCoord2_loc);
		}
		
		// Indices.***
		if (!vboKey.bindDataIndice(shader, magoManager.vboMemoryManager))
		{ return false; }
		
		if (glPrimitive)
		{ primitive = glPrimitive; }
		else
		{ primitive = gl.TRIANGLES; }
		
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

Mesh.prototype.getVboEdges = function(resultVboContainer, vboMemManager)
{
	if (resultVboContainer === undefined)
	{ return; }
	
	// provisionally make edges by this.***
	var frontierHedgesArray = this.getFrontierHalfEdges(undefined);
	var hedgesCount = frontierHedgesArray.length;
	var hedge;
	var verticesCount = hedgesCount * 2;
	var vertexArray = new Float32Array(verticesCount*3);
	var indicesArray = new Uint16Array(verticesCount);
	var strVertex, endVertex;
	var index = 0;
	for (var i=0; i<hedgesCount; i++)
	{
		hedge = frontierHedgesArray[i];
		strVertex = hedge.startVertex;
		endVertex = hedge.getEndVertex();
		vertexArray[i*6] = strVertex.point3d.x;
		vertexArray[i*6+1] = strVertex.point3d.y;
		vertexArray[i*6+2] = strVertex.point3d.z;
		vertexArray[i*6+3] = endVertex.point3d.x;
		vertexArray[i*6+4] = endVertex.point3d.y;
		vertexArray[i*6+5] = endVertex.point3d.z;
		
		indicesArray[i*2] = index; index++;
		indicesArray[i*2+1] = index; index++;
	}
	
	var resultVbo = resultVboContainer.newVBOVertexIdxCacheKey();
	resultVbo.setDataArrayPos(vertexArray, vboMemManager);
	resultVbo.setDataArrayIdx(indicesArray, vboMemManager);
};



















































