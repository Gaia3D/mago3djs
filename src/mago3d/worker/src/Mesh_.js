'use strict';

/**
 * This draws the outer shell of the feature as triangular mesh
 * @class Mesh
 */
var Mesh_ = function() 
{
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

Mesh_.prototype.getSurface = function(idx)
{
	if (this.surfacesArray === undefined)
	{ return undefined; }
	
	return this.surfacesArray[idx];
};

Mesh_.prototype.getSurfacesCount = function()
{
	if (this.surfacesArray === undefined)
	{ return 0; }
	
	return this.surfacesArray.length;
};

Mesh_.prototype.newSurface = function(options)
{
	if (this.surfacesArray === undefined)
	{ this.surfacesArray = []; }
	
	var surface = new Surface_(options);
	this.surfacesArray.push(surface);
	return surface;
};

Mesh_.prototype.addSurface = function(surface)
{
	if (surface === undefined)
	{ return; }
	
	if (this.surfacesArray === undefined)
	{ this.surfacesArray = []; }
	
	this.surfacesArray.push(surface);
};

Mesh_.prototype.mergeMesh = function(mesh)
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

Mesh_.prototype.getHalfEdgesList = function()
{
	if (this.hedgesList === undefined)
	{ this.hedgesList = new HalfEdgesList_(); }

	return this.hedgesList;
};

Mesh_.prototype.calculateVerticesNormals = function(bForceRecalculatePlaneNormal)
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

Mesh_.prototype.getCopySurfaceIndependentMesh = function(resultMesh)
{
	// In a surfaceIndependentMesh, the surfaces are disconex.
	if (resultMesh === undefined)
	{ resultMesh = new Mesh_(); }
	
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

Mesh_.prototype.getTriangles = function(resultTrianglesArray)
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

Mesh_.prototype.getTrianglesListsArrayBy2ByteSize = function(trianglesArray, resultTrianglesListsArray)
{
	if (resultTrianglesListsArray === undefined)
	{ resultTrianglesListsArray = []; }
	
	// This function returns trianglesListsArray. Each trianglesList's vertices count is lower than 65535.
	var shortSize = 65535;
	var trianglesList = new TrianglesList_();
	resultTrianglesListsArray.push(trianglesList);
	var trianglesCount = trianglesArray.length;
	if (trianglesCount*3 <shortSize)
	{
		trianglesList.trianglesArray = [];
		Array.prototype.push.apply(trianglesList.trianglesArray, trianglesArray);
		return resultTrianglesListsArray;
	}
	
	// 1rst, make global vertices array.
	var globalVerticesArray = TrianglesList_.getNoRepeatedVerticesArray(trianglesArray, undefined);
	var verticesCount = globalVerticesArray.length;
	
	if (verticesCount <shortSize)
	{
		trianglesList.trianglesArray = [];
		Array.prototype.push.apply(trianglesList.trianglesArray, trianglesArray);
		return resultTrianglesListsArray;
	}
	
	VertexList_.setIdxInList(globalVerticesArray);
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

Mesh_.prototype.setColor = function(r, g, b, a)
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

Mesh_.prototype.getBoundingBox = function()
{
	if (this.bbox === undefined)
	{
		this.bbox = new BoundingBox_();
		if (!this.vertexList) 
		{
			this.vertexList = new VertexList_();
			this.vertexList.vertexArray = this.getNoRepeatedVerticesArray(this.vertexList.vertexArray);
		}

		this.bbox = this.vertexList.getBoundingBox(this.bbox);
	}
	
	return this.bbox;
};

Mesh_.prototype.getNoRepeatedVerticesArray = function(resultVerticesArray) 
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

Mesh_.prototype.getVbo = function(resultVboContainer)
{
	if (resultVboContainer === undefined)
	{ resultVboContainer = []; }

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
		var vbo = {};// = resultVboContainer.newVBOVertexIdxCacheKey();
		VertexList_.setIdxInList(verticesArray);
		VertexList_.getVboDataArrays(verticesArray, vbo);
		trianglesList.assignVerticesIdx();
		TrianglesList_.getVboFaceDataArray(trianglesList.trianglesArray, vbo);
		resultVboContainer.push(vbo);
	}

	return resultVboContainer;
};