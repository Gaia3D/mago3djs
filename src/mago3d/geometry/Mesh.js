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

	this.name;
	this.id;
	this.vertexList;
	
	//the list of the Surface features
	this.surfacesArray;
	this.color4;

	this.hedgesList;
	this.edgesSegment3dsArray; // to render wireframe.
	
	this.vboKeysContainer;
	this.edgesVboKeysContainer;
	this.bbox;
	this.material;// class Material.
};

/** 
 * Makes & returns a mesh from a vboCacheKey.
 */
Mesh.fromVbo = function(vboCacheKey)
{
	if (vboCacheKey === undefined)
	{ return; }
	
	var resultMesh = new Mesh();
	resultMesh.vertexList = new VertexList();
	var vertexList = resultMesh.vertexList;
	resultMesh.hedgesList = new HalfEdgesList();
	var hedgesList = resultMesh.hedgesList;
	
	var surface = resultMesh.newSurface();
	
	// Note: each triangle is a face.
	
	var pos0, pos1, pos2;
	var vertex0, vertex1, vertex2;
	var hedge0, hedge1, hedge2;
	var face;
	
	// 1rst, check if the vbo is "array" type or "element" type.
	if (vboCacheKey.vboBufferIdx !== undefined)
	{
		// the vbo is elementType.
		// TODO:
	}
	else
	{
		// the vbo is arrayType.
		var posDataArray = vboCacheKey.vboBufferPos.dataArray;
		
		if (posDataArray === undefined)
		{ return; }
		
		var pointsCount = posDataArray.length/3;
		
		if (pointsCount === 0)
		{ return; }
		
		var trianglesCount = pointsCount/3;
		
		var vertexOctree = new VertexOctree(); // indexing octree.
		vertexOctree.vertexArray = new Array(pointsCount);
		var indexingVertexArray = vertexOctree.vertexArray;
		
		// 1rst, make the vertexList and then make vertexIndexOctree.
		for (var i=0; i<trianglesCount; i++)
		{
			pos0 = new Point3D(posDataArray[i*9], posDataArray[i*9+1], posDataArray[i*9+2]);
			pos1 = new Point3D(posDataArray[i*9+3], posDataArray[i*9+4], posDataArray[i*9+5]);
			pos2 = new Point3D(posDataArray[i*9+6], posDataArray[i*9+7], posDataArray[i*9+8]);
			
			vertex0 = vertexList.newVertex(pos0);
			vertex1 = vertexList.newVertex(pos1);
			vertex2 = vertexList.newVertex(pos2);
			
			face = surface.newFace();
			face.addVerticesArray([vertex0, vertex1, vertex2]);
			hedgesList.addHalfEdgesArray(face.createHalfEdges(undefined));
			
			vertex0.facesOwnerArray = [face]; // array exists only in mesh making process.
			vertex1.facesOwnerArray = [face]; // array exists only in mesh making process.
			vertex2.facesOwnerArray = [face]; // array exists only in mesh making process.
			
			// parallely, make the indexingVertexArray of vertexOctree.
			indexingVertexArray[i*3] = vertex0;
			indexingVertexArray[i*3+1] = vertex1;
			indexingVertexArray[i*3+2] = vertex2;
		}
		
		// make a vertexOctree to indexing.
		var bbox = vertexList.getBoundingBox(undefined);
		var maxLength = bbox.getMaxLength();
		
		// make a cubic mother octree (cubic octree = all edges has the same length).
		vertexOctree.setBoxSize(bbox.minX, bbox.minX+maxLength, bbox.minY, bbox.minY+maxLength, bbox.minZ, bbox.minZ+maxLength);
		var targetMinSize = maxLength/30;
		if (targetMinSize < 0.1)
		{ targetMinSize = 0.1; }
		vertexOctree.makeTreeByMinSize(targetMinSize);
		
		var lowestOctrees = vertexOctree.extractOctreesWithData();
		
		// now, make triangles merging merge-able vertices.
		var errorDist = 1e-4;
		var vertexCount = vertexList.getVertexCount();
		for (var i=0; i<vertexCount; i++)
		{
			var currVertex = vertexList.getVertex(i);
			if (currVertex.getVertexType() === -1)
			{ continue; }
			
			// find all coincident vertices to "currVertex".
			var indexingOctree = currVertex.vertexIndexingOctree;
			var indexingOctreeVertexArray = indexingOctree.vertexArray;
			
			var resultCoincidentVertexArray = Vertex.getCoincidentVertexArray(currVertex, indexingOctreeVertexArray, undefined, errorDist);
			var coincidentVertexCount = resultCoincidentVertexArray.length;
			for (var j=0; j<coincidentVertexCount; j++)
			{
				var coincidentVertex = resultCoincidentVertexArray[j];
				coincidentVertex.setVertexType(-1); // mark the vertex, -1 = meaning that must be deleted.
				var facesOwnerArray = coincidentVertex.facesOwnerArray;
				var facesCount = facesOwnerArray.length;
				for (var k=0; k<facesCount; k++)
				{
					var face = facesOwnerArray[k];
					
					// for the face, change the "coincidentVertex" to "currVertex", & delete "coincidentVertex".
					face.setVertexIdxInList();
					var coincidentVertexIdx = coincidentVertex.getIdxInList();
					face.changeVertex(coincidentVertexIdx, currVertex);
					
					// Add face into the currVertex's facesOwnerArray.
					currVertex.facesOwnerArray.push(face);
				}
			}
			
			// now, set twins between faces of the currVertex.
			Face.setTwinsFacesOfArray(currVertex.facesOwnerArray);
		}
		
		// now, delete all coincident vertex.
		vertexList.deleteVertexByVertexType(-1);
		
	}
	
	return resultMesh;
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
	
	// No delete material if exist. This mesh is no owner of the material.
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
Mesh.prototype.newSurface = function(options)
{
	if (this.surfacesArray === undefined)
	{ this.surfacesArray = []; }
	
	var surface = new Surface(options);
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
 * Get the specific surface of this mesh by name
 * @param {string} idx 
 * @returns {Array<Surface>}
 */
Mesh.prototype.getSurfaceByName = function(name)
{
	if (this.surfacesArray === undefined)
	{ return undefined; }

	var filteredSurfaceArray = this.surfacesArray.filter(function(surface)
	{
		return surface.name === name;
	});
	
	return filteredSurfaceArray;
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
		if (!this.vertexList) 
		{
			this.vertexList = new VertexList();
			this.vertexList.vertexArray = this.getNoRepeatedVerticesArray(this.vertexList.vertexArray);
		}

		this.bbox = this.vertexList.getBoundingBox(this.bbox);
	}
	
	return this.bbox;
};

/**
 * Returns the bounding sphere.
 */
Mesh.prototype.getBoundingSphere = function()
{
	var bbox = this.getBoundingBox();
	return bbox.getBoundingSphere();
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
 * Get the texture coordinate by box projection
 */
Mesh.prototype.calculateTexCoordsBox = function(texCoordsBoundingBox)
{
	if (!texCoordsBoundingBox)
	{
		texCoordsBoundingBox = this.getBoundingBox();
	}

	var surface;
	var surfacesCount = this.getSurfacesCount();
	for (var i=0; i<surfacesCount; i++)
	{
		surface = this.getSurface(i);
		surface.calculateTexCoordsBox(texCoordsBoundingBox);
	}
};

/**
 * Get the texture coordinate by box projection
 */
Mesh.prototype.calculateTexCoordsByHeight = function(height)
{
	var surface;
	var surfacesCount = this.getSurfacesCount();
	for (var i=0; i<surfacesCount; i++)
	{
		surface = this.getSurface(i);
		surface.calculateTexCoordsByHeight(height);
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
 * Set the material of the mesh.
 * @param {Material} material
 */
Mesh.prototype.setMaterial = function(material)
{
	this.material = material;
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
		
		// copy id & name.
		surfaceCopy.id = surface.id;
		surfaceCopy.name = surface.name;
	
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
 * Render the mesh as child. equal render
 * @param {MagoManager}magoManager
 * @param {Shader} shader
 * @param {Number} renderType
 * @param glPrimitive
 * @TODO : 누가 이 gl primitive의 type 정체를 안다면 좀 달아주세요ㅠㅠ 세슘 쪽인거 같은데ㅠㅠ
 */
Mesh.prototype.renderAsChild = function (magoManager, shader, renderType, glPrimitive, isSelected, options, bWireframe) 
{
	var renderShaded = true;
	var renderWireframe = false;
	var depthMask = true;
	
	var gl = magoManager.getGl();

	if (bWireframe)
	{
		if ( renderType !== 1)
		{ return; }

		if (options)
		{
			if (options.renderWireframe !== undefined)
			{ renderWireframe = options.renderWireframe; }
			
			if (options.depthMask !== undefined)
			{ depthMask = options.depthMask; }
		}
	
		if (renderWireframe)
		{
			this.renderWireframe(magoManager, shader, renderType, glPrimitive, isSelected);
		}
	}
	else
	{
		if (options)
		{
			if (options.renderShaded !== undefined)
			{ renderShaded = options.renderShaded; }

			if (options.depthMask !== undefined)
			{ depthMask = options.depthMask; }
		}
		
		if (renderShaded)
		{
			gl.depthMask(depthMask);
			this.render(magoManager, shader, renderType, glPrimitive, isSelected);
			gl.depthMask(true);
		}
	}

};

/**
 * Render the mesh
 * @param {MagoManager}magoManager
 * @param {Shader} shader
 * @param {Number} renderType
 * @param glPrimitive
 * @TODO : 누가 이 gl primitive의 type 정체를 안다면 좀 달아주세요ㅠㅠ 세슘 쪽인거 같은데ㅠㅠ
 */
Mesh.prototype.render = function (magoManager, shader, renderType, glPrimitive, isSelected)
{
	var vboMemManager = magoManager.vboMemoryManager;
	
	if (this.vboKeysContainer === undefined)
	{
		this.vboKeysContainer = this.getVbo(this.vboKeysContainer, vboMemManager);
		//return;
	}
	
	var gl = magoManager.sceneState.gl;
	var primitive;
	
	if (renderType === 0)
	{
		// Depth render
		// provisionally disable texture
		// in the future must call "solveReferencePngTextureForDepthRender" function
		gl.uniform1i(shader.bHasTexture_loc, false);
		gl.uniform1i(shader.colorType_loc, 0);
	}
	else if (renderType === 1)
	{
		if (!isSelected)
		{
			// Color render.***
			var textureBinded = false;
			var material = this.material;
			if (material !== undefined)
			{
				var diffuseTexture = material.diffuseTexture;
				if (diffuseTexture !== undefined)
				{
					if (diffuseTexture.texId !== undefined)
					{
						gl.uniform1i(shader.colorType_loc, 2); // 0= oneColor, 1= attribColor, 2= texture.
						if (shader.last_tex_id !== diffuseTexture.texId) 
						{
							gl.activeTexture(gl.TEXTURE2);
							gl.bindTexture(gl.TEXTURE_2D, diffuseTexture.texId);
							shader.last_tex_id = diffuseTexture.texId;
							textureBinded = true;
						}
					}
					else 
					{
						// check texture fileLoadState.
						if (diffuseTexture.fileLoadState === CODE.fileLoadState.READY)
						{
							// proceed to load texture image.
							var url = diffuseTexture.url;
							var flipYTexCoord = false;
							TexturesManager.loadTexture(url, diffuseTexture, magoManager, flipYTexCoord);
							return;
						}
					}
				}
				else
				{
					// Apply fillColor.
					var color4 = material.color4;
					if (color4)
					{
						gl.uniform1i(shader.colorType_loc, 0); // 0= oneColor, 1= attribColor, 2= texture.
						gl.uniform4fv(shader.oneColor4_loc, [color4.r, color4.g, color4.b, color4.a]); 
					}
				}
			}
			
			if (!textureBinded && this.color4) // old.***
			{ 
				gl.uniform1i(shader.colorType_loc, 0); // 0= oneColor, 1= attribColor, 2= texture.
				gl.uniform4fv(shader.oneColor4_loc, [this.color4.r, this.color4.g, this.color4.b, this.color4.a]); 
			}
		}
	}
	if (!this.vboKeysContainer || !this.vboKeysContainer.vboCacheKeysArray) { return; }
	
	var vboKeysCount = this.vboKeysContainer.vboCacheKeysArray.length;
	for (var i=0; i<vboKeysCount; i++)
	{
		var vboKey = this.vboKeysContainer.vboCacheKeysArray[i];
		if (!vboKey) 
		{
			return false;
		}
		
		// Positions.
		if (!vboKey.bindDataPosition(shader, vboMemManager))
		{ return false; }

		if (renderType === 0)
		{
			// Normals.
			if (vboKey.vboBufferNor && shader.normal3_loc >= 0)
			{
				if (!vboKey.bindDataNormal(shader, vboMemManager))
				{ return false; }
			}
			else 
			{
				shader.disableVertexAttribArray(shader.normal3_loc);
			}
		}
	
		if (renderType === 1)
		{
			// Normals.
			if (vboKey.vboBufferNor && shader.normal3_loc >= 0)
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
		
		if (renderType === 1)// || renderType === 2)
		{
			// Colors.
			if (vboKey.vboBufferCol)
			{
				if (!vboKey.bindDataColor(shader, vboMemManager))
				{ return false; }
				gl.uniform1i(shader.colorType_loc, 1); // attributeColor.
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
 * Used in depth render. 
 */
/*
Mesh.prototype.solveReferencePngTextureForDepthRender = function(magoManager, neoBuilding, shader, currentObjectsRendering) 
{
	var gl = magoManager.getGl();

	if(!this.texture)// || this.texture.fileLoadState !== CODE.fileLoadState.LOADING_FINISHED)
	{
		// set into shader : bHasTexture = false.***
		gl.uniform1i(shader.bHasTexture_loc , false);
		return false;
	}
	
	if(this.texture.textureImageFileExtension === "PNG")// && this.texture.texId)
	{
		gl.uniform1i(shader.bHasTexture_loc , true);
		if (shader.last_tex_id !== this.texture.texId) 
		{
			gl.activeTexture(gl.TEXTURE2);
			gl.bindTexture(gl.TEXTURE_2D, this.texture.texId);
			shader.last_tex_id = this.texture.texId;
		}

		return true;
	}
	else{
		gl.uniform1i(shader.bHasTexture_loc , false);
		return false;
	}
	return false;
};
*/

/**
 * Render the mesh
 * @param {MagoManager}magoManager
 * @param {Shader} shader
 * @param {Number} renderType
 * @param glPrimitive
 * @TODO : 누가 이 gl primitive의 type 정체를 안다면 좀 달아주세요ㅠㅠ 세슘 쪽인거 같은데ㅠㅠ
 */
Mesh.prototype.renderWireframe = function(magoManager, shader, renderType, glPrimitive, isSelected)
{
	var vboMemManager = magoManager.vboMemoryManager;
	
	if (this.edgesVboKeysContainer === undefined)
	{
		this.edgesVboKeysContainer = this.getVboEdgesThickLines(this.edgesVboKeysContainer, magoManager);
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
			if (this.material !== undefined && this.material.diffuseTexture !== undefined && this.material.diffuseTexture.texId !== undefined)
			{
				var texture = this.material.diffuseTexture;
				gl.uniform1i(shader.colorType_loc, 2); // 0= oneColor, 1= attribColor, 2= texture.
				if (shader.last_tex_id !== texture.texId) 
				{
					gl.activeTexture(gl.TEXTURE2);
					gl.bindTexture(gl.TEXTURE_2D, texture.texId);
					shader.last_tex_id = texture.texId;
				}
			}
			else if (this.color4)
			{ 
				gl.uniform1i(shader.colorType_loc, 0); // 0= oneColor, 1= attribColor, 2= texture.
				gl.uniform4fv(shader.oneColor4_loc, [this.color4.r, this.color4.g, this.color4.b, this.color4.a]); 
			}
		}
	}
	
	var vbo = this.edgesVboKeysContainer.getVboKey(0);
	
	// based on https://weekly-geekly.github.io/articles/331164/index.html
	/*
	var shader = magoManager.postFxShadersManager.getShader("thickLine");
	shader.useProgram();
	shader.bindUniformGenerals();
	var gl = magoManager.getGl();

	gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
	gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
	gl.disable(gl.CULL_FACE);
	
	gl.enableVertexAttribArray(shader.prev_loc);
	gl.enableVertexAttribArray(shader.current_loc);
	gl.enableVertexAttribArray(shader.next_loc);
	
	var geoLocData = this.geoLocDataManager.getCurrentGeoLocationData();
	geoLocData.bindGeoLocationUniforms(gl, shader);

	var sceneState = magoManager.sceneState;
	var drawingBufferWidth = sceneState.drawingBufferWidth;
	var drawingBufferHeight = sceneState.drawingBufferHeight;

	gl.uniform4fv(shader.color_loc, [0.5, 0.7, 0.9, 1.0]);
	gl.uniform2fv(shader.viewport_loc, [drawingBufferWidth[0], drawingBufferHeight[0]]);
	*/
	
	this.thickness = 2.0;
	gl.uniform1f(shader.thickness_loc, this.thickness);

	var vboPos = vbo.vboBufferPos;
	var dim = vboPos.dataDimensions; // in this case dimensions = 4.
	if (!vboPos.isReady(gl, magoManager.vboMemoryManager))
	{
		return;
	}
	gl.bindBuffer(gl.ARRAY_BUFFER, vboPos.key);
	gl.vertexAttribPointer(shader.prev_loc, dim, gl.FLOAT, false, 16, 0);
	gl.vertexAttribPointer(shader.current_loc, dim, gl.FLOAT, false, 16, 32);
	gl.vertexAttribPointer(shader.next_loc, dim, gl.FLOAT, false, 16, 64);
	//gl.vertexAttribPointer(shader.next_loc, dim, gl.FLOAT, false, 16, 128-32); // original.***
	//gl.drawArrays(gl.TRIANGLE_STRIP, 0, vbo.vertexCount-(4)); // original.***
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, vbo.vertexCount-(6));

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
	if (!trianglesArray) { return; }
	
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

Mesh.prototype.getEdgeSegment3ds = function(resultSegment3dsArray)
{
	//****************************************************************************************************************************
	// TODO: must find NO repeated hedges. Develop function : getNoRepeatedEdges().***
	// Provisionally we use only "lateral surfaces hedges", because this function is used, for now, to render thickLines edges.
	// In the future, when develop boolean operations between meshes, frontierHalfEdges will be repeated in pairs.***
	//****************************************************************************************************************************
	var frontierHedgesArray = [];
	var surface;
	var surfacesCount = this.getSurfacesCount();
	for (var i=0; i<surfacesCount; i++)
	{
		surface = this.getSurface(i);
		//if (surface.name === "outerLateral") // this is provisional.***
		if (surface.name !== "top" && surface.name !== "bottom") // .***
		{ frontierHedgesArray = surface.getFrontierHalfEdges(frontierHedgesArray); }
	}

	var hedgesCount = frontierHedgesArray.length;
	
	if (hedgesCount === 0)
	{ return resultSegment3dsArray; }
	
	if (!resultSegment3dsArray)
	{ resultSegment3dsArray = []; }
	
	var hedge;
	var segment3d;
	var strVertex, endVertex;
	var strPoint3d, endPoint3d;
	var index = 0;
	for (var i=0; i<hedgesCount; i++)
	{
		hedge = frontierHedgesArray[i];
		strVertex = hedge.startVertex;
		endVertex = hedge.getEndVertex();
		
		strPoint3d = strVertex.getPosition();
		endPoint3d = endVertex.getPosition();
		
		segment3d = new Segment3D(strPoint3d, endPoint3d);
		resultSegment3dsArray.push(segment3d);
	}
	
	return resultSegment3dsArray;
};

/**
 * Register the VBO cache keys of the half edges of this mesh to VBOMemManager.
 * @param {VBOVertexIdxCacheKeysContainer} resultVboContainer 
 * @param {VBOMemManager} vboMemManager
 * @TODO : Need to change name! Not Getter!
 */
Mesh.prototype.getVboEdgesThickLines = function(resultVboContainer, magoManager)
{
	// Make edges if need render wireframe. 
	this.edgesSegment3dsArray = []; // init.
	this.edgesSegment3dsArray = this.getEdgeSegment3ds(this.edgesSegment3dsArray);
	resultVboContainer = Segment3D.getVboThickLines(magoManager, this.edgesSegment3dsArray, resultVboContainer);
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
	// Old. deprecated.
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
	
	return resultVboContainer;
};



















































