'use strict';

/**
 * Triangular mesh
 * @class TriPolyhedron
 */
var TriPolyhedron = function() 
{
	if (!(this instanceof TriPolyhedron)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.vertexMatrix = new VertexMatrix();
	this.vertexList = this.vertexMatrix.newVertexList(); //the list of the vertexs which consist of this feature
	this.triSurfacesArray = []; //triSurfaceArray is a list of TriSurfaces which consist of this feature
};

TriPolyhedron.prototype.newTriSurface = function() 
{
	var triSurface = new TriSurface();
	this.triSurfacesArray.push(triSurface);
	return triSurface;
};

/**
 * Inverse the direction sense of the triangle meshes
 */
TriPolyhedron.prototype.invertTrianglesSenses = function() 
{
	var triSurfacesCount = this.triSurfacesArray.length;
	for (var i=0; i<triSurfacesCount; i++)
	{
		this.triSurfacesArray[i].invertTrianglesSenses();
	}
};

/**
 * Get the information of the VBO key of the triangles which consist of the TriPolyhedron
 * @param resultVBOVertexIdxCacheKey the array which will hold the VBO key of the triangular meshes
 * @param vboMemManager 
 */
TriPolyhedron.prototype.getVBOArrayModePosNorCol = function(resultVBOVertexIdxCacheKey, vboMemManager) 
{
	// there are "arrayMode" and the "elementMode". "elementMode" uses indices.***
	if (resultVBOVertexIdxCacheKey === undefined)
	{ resultVBOVertexIdxCacheKey = new VBOVertexIdxCacheKey(); }

	if (resultVBOVertexIdxCacheKey.posVboDataArray === undefined)
	{ resultVBOVertexIdxCacheKey.posVboDataArray = []; }

	if (resultVBOVertexIdxCacheKey.norVboDataArray === undefined)
	{ resultVBOVertexIdxCacheKey.norVboDataArray = []; }

	if (resultVBOVertexIdxCacheKey.colVboDataArray === undefined)
	{ resultVBOVertexIdxCacheKey.colVboDataArray = []; }

	var positionArray = [];
	var normalsArray = [];
	var colorsArray = [];


	resultVBOVertexIdxCacheKey.vertexCount = 0;

	var vertex0, vertex1, vertex2;
	var triangle;
	var trianglesCount;
	var triSurface;
	var triSurfacesCount = this.triSurfacesArray.length;
	for (var i = 0; i < triSurfacesCount; i++) 
	{
		triSurface = this.triSurfacesArray[i];
		trianglesCount = triSurface.trianglesArray.length;
		for (var j = 0; j < trianglesCount; j++) 
		{
			triangle = triSurface.trianglesArray[j];
			if (triangle.normal === undefined)
			{ triangle.calculatePlaneNormal(); }

			// position.***
			vertex0 = triangle.vertex0;
			vertex1 = triangle.vertex1;
			vertex2 = triangle.vertex2;

			positionArray.push(vertex0.point3d.x);
			positionArray.push(vertex0.point3d.y);
			positionArray.push(vertex0.point3d.z);

			positionArray.push(vertex1.point3d.x);
			positionArray.push(vertex1.point3d.y);
			positionArray.push(vertex1.point3d.z);

			positionArray.push(vertex2.point3d.x);
			positionArray.push(vertex2.point3d.y);
			positionArray.push(vertex2.point3d.z);

			// normal (use planeNormal).***
			normalsArray.push(triangle.normal.x);
			normalsArray.push(triangle.normal.y);
			normalsArray.push(triangle.normal.z);

			normalsArray.push(triangle.normal.x);
			normalsArray.push(triangle.normal.y);
			normalsArray.push(triangle.normal.z);

			normalsArray.push(triangle.normal.x);
			normalsArray.push(triangle.normal.y);
			normalsArray.push(triangle.normal.z);

			// colors.***
			if (vertex0.color4 === undefined) 
			{
				colorsArray.push(200);
				colorsArray.push(200);
				colorsArray.push(200);
				colorsArray.push(200);

				colorsArray.push(200);
				colorsArray.push(200);
				colorsArray.push(200);
				colorsArray.push(200);

				colorsArray.push(200);
				colorsArray.push(200);
				colorsArray.push(200);
				colorsArray.push(200);
			}
			else 
			{
				colorsArray.push(vertex0.color4.r);
				colorsArray.push(vertex0.color4.g);
				colorsArray.push(vertex0.color4.b);
				colorsArray.push(vertex0.color4.a);

				colorsArray.push(vertex1.color4.r);
				colorsArray.push(vertex1.color4.g);
				colorsArray.push(vertex1.color4.b);
				colorsArray.push(vertex1.color4.a);

				colorsArray.push(vertex2.color4.r);
				colorsArray.push(vertex2.color4.g);
				colorsArray.push(vertex2.color4.b);
				colorsArray.push(vertex2.color4.a);
			}

			resultVBOVertexIdxCacheKey.vertexCount += 3;
		}
	}

	var vertexCount = resultVBOVertexIdxCacheKey.vertexCount;
	
	var float32PosArray = new Float32Array(vertexCount*3);
	float32PosArray.set(positionArray);
	
	var int8NorArray = new Int8Array(vertexCount*3);
	int8NorArray.set(normalsArray);
	
	var uint8ColArray = new Uint8Array(vertexCount*4);
	uint8ColArray.set(colorsArray);
	
	///******************************************************************************
	// Positions.***
	resultVBOVertexIdxCacheKey.setDataArrayPos(float32PosArray, vboMemManager);
	
	// Normals.***
	resultVBOVertexIdxCacheKey.setDataArrayNor(int8NorArray, vboMemManager);
	
	// Colors.***
	resultVBOVertexIdxCacheKey.setDataArrayCol(uint8ColArray, vboMemManager);
	///******************************************************************************

	return resultVBOVertexIdxCacheKey;
};















