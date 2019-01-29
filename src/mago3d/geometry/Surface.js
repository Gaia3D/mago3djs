'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class Surface
 */
var Surface = function() 
{
	if (!(this instanceof Surface)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.facesArray;
	this.localVertexList; // vertices used only for this surface.***
	this.localHedgesList;
};

Surface.prototype.newFace = function()
{
	if (this.facesArray === undefined)
	{ this.facesArray = []; }
	
	var face = new Face();
	this.facesArray.push(face);
	return face;
};

Surface.prototype.getFacesCount = function()
{
	if (this.facesArray === undefined)
	{ return 0; }

	return this.facesArray.length;
};

Surface.prototype.getFace = function(idx)
{
	if (this.facesArray === undefined)
	{ return undefined; }

	return this.facesArray[idx];
};

Surface.prototype.setColor = function(r, g, b, a)
{
	var face;
	var facesCount = this.getFacesCount();
	for (var i=0; i<facesCount; i++)
	{
		face = this.getFace(i);
		face.setColor(r, g, b, a);
	}
};

Surface.prototype.addFacesArray = function(facesArray)
{
	if (facesArray === undefined)
	{ return; }
	
	if (this.facesArray === undefined)
	{ this.facesArray = []; }
	
	Array.prototype.push.apply(this.facesArray, facesArray);
};

Surface.prototype.getFrontierHalfEdges = function(resultHedgesArray)
{
	if (this.facesArray === undefined)
	{ return resultHedgesArray; }
	
	if (resultHedgesArray === undefined)
	{ resultHedgesArray = []; }
	
	var facesCount = this.getFacesCount();
	var face;
	for (var i=0; i<facesCount; i++)
	{
		face = this.getFace(i);
		resultHedgesArray = face.getFrontierHalfEdges(resultHedgesArray);
	}
	
	return resultHedgesArray;
};

Surface.prototype.getHalfEdges = function(resultHedgesArray)
{
	if (this.facesArray === undefined)
	{ return resultHedgesArray; }
	
	if (resultHedgesArray === undefined)
	{ resultHedgesArray = []; }
	
	var facesCount = this.getFacesCount();
	var face;
	for (var i=0; i<facesCount; i++)
	{
		face = this.getFace(i);
		resultHedgesArray = face.getHalfEdgesLoop(resultHedgesArray);
	}
	
	return resultHedgesArray;
};

Surface.prototype.getCopyIndependentSurface = function(resultSurface)
{
	if (this.facesArray === undefined)
	{ return resultSurface; }
	
	if (resultSurface === undefined)
	{ resultSurface = new Surface(); }
	
	if (resultSurface.localVertexList === undefined)
	{ resultSurface.localVertexList = new VertexList(); }
	
	var resultLocalvertexList = resultSurface.localVertexList;
	
	// 1rst, copy the localVertexList.***
	var verticesArray = this.getNoRepeatedVerticesArray(undefined);
	var verticesCount = verticesArray.length;
	var vertex, vertexCopy;
	for (var i=0; i<verticesCount; i++)
	{
		vertex = verticesArray[i];
		vertex.setIdxInList(i); // set idxInList.***
		vertexCopy = resultLocalvertexList.newVertex();
		vertexCopy.copyFrom(vertex);
	}

	// now, copy the faces.***
	var face, faceCopy;
	var vertexIdxInList;
	var facesCount = this.getFacesCount();
	for (var i=0; i<facesCount; i++)
	{
		face = this.getFace(i);
		faceCopy = resultSurface.newFace();
		faceCopy.vertexArray = [];
		
		verticesCount = face.getVerticesCount();
		for (var j=0; j<verticesCount; j++)
		{
			vertex = face.getVertex(j);
			vertexIdxInList = vertex.getIdxInList();
			faceCopy.vertexArray.push(resultLocalvertexList.getVertex(vertexIdxInList));
		}
		var halfEdgesArray = [];
		faceCopy.createHalfEdges(halfEdgesArray);
	}
	
	resultSurface.setTwinsFaces();
	
	return resultSurface;
};

/**
 * 어떤 일을 하고 있습니까?
 */
Surface.setTwinsFacesBetweenFaceAndFacesArrays = function(face, facesArray, bIsRegularQuadGrid) 
{
	// if the faces pertains a regular-quad-grid, then there are only ONE twin between the "face" & the "facesArray".***
	if(facesArray === undefined)
		return false;
	
	var twined = false;
	var facesCount = facesArray.length;
	var face_A;
	for(var i=0; i<facesCount; i++)
	{
		face_A = facesArray[i];
		if(face_A.setTwinFace(face))
		{
			twined = true;
			if(bIsRegularQuadGrid)
			{
				// if faces are from a regular quad grid, there are only 1 twin possible.***
				return true;
			}
		}
	}
	
	return twined;
};

/**
 * 어떤 일을 하고 있습니까?
 */
Surface.setTwinsFacesBetweenFacesArrays_regularQuadGrid = function(facesArray_A, facesArray_B) 
{
	// Faces are rectangles in a rectangle grid.***
	if(facesArray_A === undefined || facesArray_B === undefined)
		return false;
	
	var bIsRegularQuadGrid = true;
	var faces_A_count = facesArray_A.length;
	var face_A, face_B;
	for(var i=0; i<faces_A_count-1; i++)
	{
		face_A = facesArray_A[i];
		face_B = facesArray_B[i+1];
		if(!face_A.setTwinFace(face_B))
		{
			face_A = facesArray_A[i+1];
			face_B = facesArray_B[i];
			if(!face_A.setTwinFace(face_B))
			{
				face_A = facesArray_A[i];
				face_B = facesArray_B[i];
				if(!face_A.setTwinFace(face_B))
				{
					face_A = facesArray_A[i+1];
					face_B = facesArray_B[i+1];
					if(!face_A.setTwinFace(face_B))
					{
						// do nothing.***
					}
				}
			}
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param idx 변수
 * @returns vertexArray[idx]
 */
Surface.prototype.setTwinsFaces = function() 
{
	// this func set twins between all faces of this surface.***
	var facesCount = this.facesArray.length;
	var face, face2;
	
	for (var i=0; i<facesCount; i++)
	{
		face = this.getFace(i);
		for (var j=0; j<facesCount; j++)
		{
			if (i !== j)
			{
				face2 = this.getFace(j);
				face.setTwinFace(face2);
			}
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param idx 변수
 * @returns vertexArray[idx]
 */
Surface.prototype.getNoRepeatedVerticesArray = function(resultVerticesArray) 
{
	if (resultVerticesArray === undefined)
	{ resultVerticesArray = []; }
	
	// 1rst, assign vertex-IdxInList for all used vertices.***
	var facesCount = this.getFacesCount();
	var face;
	var idxAux = 0;
	var vtx;
	var verticesCount;
	for (var i=0; i<facesCount; i++)
	{
		face = this.getFace(i);
		verticesCount = face.getVerticesCount();
		for (var j=0; j<verticesCount; j++)
		{
			vtx = face.getVertex(j);
			if (vtx === undefined)
			{ var hola = 0; }
			vtx.setIdxInList(idxAux);
			idxAux++;
		}
	}
	
	// now, make a map of unique vertices map using "idxInList" of vertices.***
	var verticesMap = {};
	for (var i=0; i<facesCount; i++)
	{
		face = this.getFace(i);
		verticesCount = face.getVerticesCount();
		for (var j=0; j<verticesCount; j++)
		{
			vtx = face.getVertex(j);
			verticesMap[vtx.getIdxInList().toString()] = vtx;
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

Surface.prototype.getTrianglesConvex = function(resultTrianglesArray)
{
	// To call this method, the faces must be convex.***
	if (this.facesArray === undefined || this.facesArray.length ===0)
	{ return resultTrianglesArray; }
	
	if (resultTrianglesArray === undefined)
	{ resultTrianglesArray = []; }
	
	var face;
	var facesCount = this.getFacesCount();
	for (var i=0; i<facesCount; i++)
	{
		face = this.getFace(i);
		resultTrianglesArray = face.getTrianglesConvex(resultTrianglesArray);
	}
	
	return resultTrianglesArray;
};

Surface.prototype.getTriangles = function(resultTrianglesArray)
{
	if (this.facesArray === undefined || this.facesArray.length ===0)
	{ return resultTrianglesArray; }
	
	if (resultTrianglesArray === undefined)
	{ resultTrianglesArray = []; }
	
	var face;
	var facesCount = this.getFacesCount();
	for (var i=0; i<facesCount; i++)
	{
		face = this.getFace(i);
		resultTrianglesArray = face.getTessellatedTriangles(resultTrianglesArray);
	}
	
	return resultTrianglesArray;
};

Surface.prototype.calculateVerticesNormals = function(bForceRecalculatePlaneNormal)
{
	// PROVISIONAL.***
	var face;
	var facesCount = this.getFacesCount();
	for (var i=0; i<facesCount; i++)
	{
		face = this.getFace(i);
		face.calculateVerticesNormals(bForceRecalculatePlaneNormal);
	}
};

Surface.prototype.reverseSense = function()
{
	var face;
	var facesCount = this.getFacesCount();
	for (var i=0; i<facesCount; i++)
	{
		face = this.getFace(i);
		face.reverseSense();
	}
};


















































