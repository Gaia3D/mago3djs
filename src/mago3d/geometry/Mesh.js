'use strict';

/**
 * This draws the outer shell of the feature as triangular mesh
 * @class Mesh
 */
var Mesh = function() 
{
	if (!(this instanceof Mesh)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.vertexList;
	
	//the list of the Surface features
	this.surfacesArray;
	this.color4;

	this.hedgesList;
	
	this.vboKeysContainer;
	this.bbox;
};

/**
 * Clear the data of this feature
 * @param {VBOMemManager} vboMemManager 
 */
Mesh.prototype.deleteObjects = function(vboMemManager)
{
	if (this.vertexList !== undefined)
	{
		this.vertexList.deleteObjects();
	}
	
	if (this.surfacesArray !== undefined)
	{
		var surfacesCount = this.surfacesArray.length;
		for (var i=0; i<surfacesCount; i++)
		{
			this.surfacesArray[i].deleteObjects();
			this.surfacesArray[i] = undefined;
		}
		this.surfacesArray = undefined;
	}
	
	if (this.hedgesList !== undefined)
	{
		this.hedgesList.deleteGlObjects();
		this.hedgesList = undefined;
	}
	
	if (this.vboKeysContainer !== undefined)
	{
		this.vboKeysContainer.deleteGlObjects(vboMemManager.gl, vboMemManager);
		this.vboKeysContainer = undefined;
	}
};

/**
 * Delete the VBO cache key of this feature from VBOMemManager
 * @param {VBOMemManager} vboMemManager 
 */
Mesh.prototype.deleteVbos = function(vboMemManager)
{
	if (this.vboKeysContainer !== undefined)
	{
		this.vboKeysContainer.deleteGlObjects(vboMemManager.gl, vboMemManager);
		this.vboKeysContainer = undefined;
	}
};

/**
 * Add new surface at the surface array
 */
Mesh.prototype.newSurface = function()
{
	if (this.surfacesArray === undefined)
	{ this.surfacesArray = []; }
	
	var surface = new Surface();
	this.surfacesArray.push(surface);
	return surface;
};

/**
 * Get the list of the half edges that this mesh has
 * @returns {HalfEdgesList}
 */
Mesh.prototype.getHalfEdgesList = function()
{
	if (this.hedgesList === undefined)
	{ this.hedgesList = new HalfEdgesList(); }

	return this.hedgesList;
};

/**
 * Get the specific surface of this mesh by index
 * @param {Number} idx 
 * @returns {Surface}
 */
Mesh.prototype.getSurface = function(idx)
{
	if (this.surfacesArray === undefined)
	{ return undefined; }
	
	return this.surfacesArray[idx];
};

/**
 * Add a surface at this mesh
 * @param {Surface} surface
 */
Mesh.prototype.addSurface = function(surface)
{
	if (surface === undefined)
	{ return; }
	
	if (this.surfacesArray === undefined)
	{ this.surfacesArray = []; }
	
	this.surfacesArray.push(surface);
};

/**
 * Merge the other mesh at this feature
 * @param {Mesh} mesh
 */
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

/**
 * Return the number of the surfaces that this feature holds.
 * @returns {Number} 
 */
Mesh.prototype.getSurfacesCount = function()
{
	if (this.surfacesArray === undefined)
	{ return 0; }
	
	return this.surfacesArray.length;
};

/**
 * Copy the mesh.
 * @param {Mesh} resultMesh this will copy this feature 
 * @returns {Mesh} resultMesh
 */

Mesh.prototype.getCopySurfaceIndependentMesh = function(resultMesh)
{
	// In a surfaceIndependentMesh, the surfaces are disconex.
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

/**
 * Get the array of the triangles which consist of this mesh
 * @param {TrianglesList} resultTrianglesArray The array which will hold the result of this function
 * @return {TrianglesList}
 */
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


/**
 * To call this method, the faces must be CONVEX.
 * Get the trianlgesArray from the surfaces array which have only convex faces. 
 * @param {TrianglesList} resultTrianglesArray
 * @returns {TrianglesList} resultTrianglesArray
 */
Mesh.prototype.getTrianglesConvex = function(resultTrianglesArray)
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
		resultTrianglesArray = surface.getTrianglesConvex(resultTrianglesArray);
	}
	
	return resultTrianglesArray;
};

/**
 * Get the vertices of this mesh without any repeatation
 * @param {VertexList} resultVerticesArray the array which will hold all vertices of this mesh
 * @returns {VertexLis}
 */
Mesh.prototype.getNoRepeatedVerticesArray = function(resultVerticesArray) 
{
	if (resultVerticesArray === undefined)
	{ resultVerticesArray = []; }
	
	// 1rst, assign vertex-IdxInList for all used vertices.
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
				vtx.setIdxInList(idxAux);
				idxAux++;
			}
		}
	}
	
	// now, make a map of unique vertices map using "idxInList" of vertices.
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
	
	// finally make the unique vertices array.
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

/**
 *	Get the list of the vertices which consist of this mesh
 *  @return {VertexList}
 */
Mesh.prototype.getVertexList = function()
{
	if (this.vertexList === undefined)
	{
		this.vertexList = new VertexList();
	}
	
	return this.vertexList;
};

/**
 * Returns the bbox.
 */
Mesh.prototype.getBoundingBox = function()
{
	if (this.bbox === undefined)
	{
		this.bbox = new BoundingBox();
		this.bbox = this.vertexList.getBoundingBox(this.bbox);
	}
	
	return this.bbox;
};

/**
 * Rotates this mesh specified angle by "angDeg" in (axisX, axisY, axisZ) axis.
 * @param {Number} angDeg Angle in degrees to rotate this mesh.
 * @param {Number} axisX X component of the rotation axis.
 * @param {Number} axisY Y component of the rotation axis.
 * @param {Number} axisZ Z component of the rotation axis.
 */
Mesh.prototype.rotate = function(angDeg, axisX, axisY, axisZ)
{
	var rotMat = new Matrix4();
	var quaternion = new Quaternion();
	
	// Note: the axisX, axisY, axisZ must be unitary, but to be safe process, force rotationAxis to be unitary.*** 
	var rotAxis = new Point3D(axisX, axisY, axisZ);
	rotAxis.unitary();

	// calculate rotation.
	quaternion.rotationAngDeg(angDeg, rotAxis.x, rotAxis.y, rotAxis.z);
	rotMat.rotationByQuaternion(quaternion);
	
	this.transformByMatrix4(rotMat);
	
};

/**
 * Transformate this mesh by the input 4x4 matrix
 * @param {Matrix4} transformByMatrix4
 */
Mesh.prototype.transformByMatrix4 = function(tMat4)
{
	if (this.vertexList === undefined)
	{
		this.vertexList = new VertexList();
		this.vertexList.vertexArray = this.getNoRepeatedVerticesArray(this.vertexList.vertexArray);
	}
	
	this.vertexList.transformPointsByMatrix4(tMat4);
	
	// If rotate a mesh, must recalculate normals.
	var bForceRecalculatePlaneNormal = true;
	this.calculateVerticesNormals(bForceRecalculatePlaneNormal);
};

/**
 * Translate this mesh to the given location
 * @param {Number} x
 * @param {Number} y
 * @param {Number} z
 */
Mesh.prototype.translate = function(x, y, z)
{
	if (this.vertexList === undefined)
	{
		this.vertexList = new VertexList();
		this.vertexList.vertexArray = this.getNoRepeatedVerticesArray(this.vertexList.vertexArray);
	}
	
	this.vertexList.translateVertices(x, y, z);
};

/**
 * Calculate the normal vectors of the vertices
 * @param {Boolean} bForceRecalculatePlaneNormal If the mesh is only moved by translating, then it will be false.
 */
Mesh.prototype.calculateVerticesNormals = function(bForceRecalculatePlaneNormal)
{
	// PROVISIONAL.
	var surface;
	var surfacesCount = this.getSurfacesCount();
	for (var i=0; i<surfacesCount; i++)
	{
		surface = this.getSurface(i);
		surface.calculateVerticesNormals(bForceRecalculatePlaneNormal);
	}
};

/**
 * Get the texture coordinate by spherical projection
 */
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

/**
 * Set the color of the mesh
 * @param {Number} r
 * @param {Number} g
 * @param {Number} b 
 * @param {Number} a
 */
Mesh.prototype.setColor = function(r, g, b, a)
{
	// This function sets vertices colors.***
	var surface;
	var surfacesCount = this.getSurfacesCount();
	for (var i=0; i<surfacesCount; i++)
	{
		surface = this.getSurface(i);
		surface.setColor(r, g, b, a);
	}
};

/**
 * Set the unique one color of the mesh
 * @param {Number} r
 * @param {Number} g
 * @param {Number} b 
 * @param {Number} a
 */
Mesh.prototype.setOneColor = function(r, g, b, a)
{
	// This function sets the unique one color of the mesh.***
	if (this.color4 === undefined)
	{ this.color4 = new Color(); }
	
	this.color4.setRGBA(r, g, b, a);
};

/**
 * Reverse the direction of the sense of this mesh
 */
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

/**
 * Get the frontier half edges of half edges
 * @param {HalfEdgesList} resultHalfEdgesArray the list of the half edges which will hold the result of this operation
 * @return {HalfEdgesList}
 */
Mesh.prototype.getFrontierHalfEdges = function(resultHalfEdgesArray)
{
	var surface;
	var surfacesCount = this.getSurfacesCount();
	for (var i=0; i<surfacesCount; i++)
	{
		surface = this.getSurface(i);
		resultHalfEdgesArray = surface.getFrontierHalfEdges(resultHalfEdgesArray);
	}
	
	return resultHalfEdgesArray;
};

/**
 * Copy the mesh to the parameter mesh
 * @param {Mesh} resultMeshCopy this will be the copy of this mesh
 * @return {Mesh} return the copied mesh
 */
Mesh.prototype.getCopy = function(resultMeshCopy)
{
	if (this.vertexList === undefined)
	{ this.vertexList = new VertexList(); }
	
	if (this.vertexList.vertexArray === undefined || this.vertexList.vertexArray.length === 0)
	{ this.vertexList.vertexArray = this.getNoRepeatedVerticesArray(this.vertexList.vertexArray); }
	
	if (resultMeshCopy === undefined)
	{ resultMeshCopy = new Mesh(); }
	
	// 1rst copy vertexList.
	if (resultMeshCopy.vertexList === undefined)
	{ resultMeshCopy.vertexList = new VertexList(); }
	
	resultMeshCopy.vertexList.copyFrom(this.vertexList);
	
	// set idxInList both vertexLists.
	this.vertexList.setIdxInList();
	resultMeshCopy.vertexList.setIdxInList();
	
	// now copy surfaces.
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

/**
 * WebGL's array index range is short number. So if the length of the trianglesArray is over short, then rearrange the list.
 * @param {TrianglesList} trianglesArray the target triangle array
 * @param {Array} resultTrianglesListsArray the array of the TrianglesLis divided into WebGL's index range.
 */
Mesh.prototype.getTrianglesListsArrayBy2ByteSize = function(trianglesArray, resultTrianglesListsArray)
{
	if (resultTrianglesListsArray === undefined)
	{ resultTrianglesListsArray = []; }
	
	// This function returns trianglesListsArray. Each trianglesList's vertices count is lower than 65535.
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
	
	// 1rst, make global vertices array.
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
/**
 * Render the mesh
 * @param {MagoManager}magoManager
 * @param {Shader} shader
 * @param {Number} renderType
 * @param glPrimitive
 * @TODO : 누가 이 gl primitive의 type 정체를 안다면 좀 달아주세요ㅠㅠ 세슘 쪽인거 같은데ㅠㅠ
 */
Mesh.prototype.render = function(magoManager, shader, renderType, glPrimitive, isSelected)
{
	var vboMemManager = magoManager.vboMemoryManager;
	
	if (this.vboKeysContainer === undefined)
	{
		this.vboKeysContainer = this.getVbo(this.vboKeysContainer, vboMemManager);
		return;
	}
	
	var gl = magoManager.sceneState.gl;
	var primitive;
	
	if (renderType === 0)
	{
		// Depth render.***
	}
	else if (renderType === 1)
	{
		if (!isSelected)
		{
			// Color render.***
			if (this.color4)
			{ gl.uniform4fv(shader.oneColor4_loc, [this.color4.r, this.color4.g, this.color4.b, 1.0]); }
		}
	}
	else if (renderType === 2)
	{
		// Selection render.***
	}
	
	var vboKeysCount = this.vboKeysContainer.vboCacheKeysArray.length;
	for (var i=0; i<vboKeysCount; i++)
	{
		var vboKey = this.vboKeysContainer.vboCacheKeysArray[i];
		
		// Positions.
		if (!vboKey.bindDataPosition(shader, vboMemManager))
		{ return false; }
		
		
		if (renderType === 1)
		{
			// Normals.
			if (vboKey.vboBufferNor)
			{
				if (!vboKey.bindDataNormal(shader, vboMemManager))
				{ return false; }
			}
			else 
			{
				shader.disableVertexAttribArray(shader.normal3_loc);
			}
			
			// TexCoords.
			if (vboKey.vboBufferTCoord)
			{
				if (!vboKey.bindDataTexCoord(shader, vboMemManager))
				{ return false; }
			}
			else 
			{
				shader.disableVertexAttribArray(shader.texCoord2_loc);
			}
		}
		
		if (renderType === 1 || renderType === 2)
		{
			// Colors.
			if (vboKey.vboBufferCol)
			{
				if (!vboKey.bindDataColor(shader, vboMemManager))
				{ return false; }
			}
			else 
			{
				shader.disableVertexAttribArray(shader.color4_loc);
			}
		}
		
		
		// Indices.
		if (!vboKey.bindDataIndice(shader, vboMemManager))
		{ return false; }
		
		if (glPrimitive)
		{ primitive = glPrimitive; }
		else
		{ primitive = gl.TRIANGLES; }
		
		gl.drawElements(primitive, vboKey.indicesCount, gl.UNSIGNED_SHORT, 0);
	}
};
/**
 * Get the VBO keys of this mesh
 * @param {VBOVertexIdxCacheKeysContainer} resultVboContainer 
 * @param {VBOMemManager} vboMemManager
 * @return {VBOVertexIdxCacheKeysContainer}
 */
Mesh.prototype.getVbo = function(resultVboContainer, vboMemManager)
{
	if (resultVboContainer === undefined)
	{ resultVboContainer = new VBOVertexIdxCacheKeysContainer(); }

	// make global triangles array.
	var trianglesArray = this.getTriangles(undefined);
	var trianglesCount = trianglesArray.length;
	
	// If vertices count > shortSize(65535), then must split the mesh.
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

/**
 * Get the VBO keys of the convex triangles
 * @param {VBOVertexIdxCacheKeysContainer} resultVboContainer 
 * @param {VBOMemManager} vboMemManager
 * @return {VBOVertexIdxCacheKeysContainer} 
 */
Mesh.prototype.getVboTrianglesConvex = function(resultVboContainer, vboMemManager)
{
	if (resultVboContainer === undefined)
	{ resultVboContainer = new VBOVertexIdxCacheKeysContainer(); }

	// make global triangles array.
	var trianglesArray = this.getTrianglesConvex(undefined); // for convex faces (faster).
	var trianglesCount = trianglesArray.length;
	
	// If vertices count > shortSize(65535), then must split the mesh.
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

/**
 * Register the VBO cache keys of the half edges of this mesh to VBOMemManager.
 * @param {VBOVertexIdxCacheKeysContainer} resultVboContainer 
 * @param {VBOMemManager} vboMemManager
 * @TODO : Need to change name! Not Getter!
 */
Mesh.prototype.getVboEdges = function(resultVboContainer, vboMemManager)
{
	if (resultVboContainer === undefined)
	{ return; }
	
	// provisionally make edges by this.
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



















































