
'use strict';


/**
 * Vertex Matrix (Array of VertexList)
 * @see Vertex
 * @see VertexList
 * 
 * @exception {Error} Messages.CONSTRUCT_ERROR
 * 
 * @class VertexMatrix
 */
var VertexMatrix = function() 
{
	if (!(this instanceof VertexMatrix)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	/**
	 * VertexList Array
	 * @instance
	 * @type {Array.<VertexList>}
	 */
	this.vertexListsArray = [];
	// SCTRATXH.

	/**
	 * All Vertex array
	 * @instance
	 * @type {Array.<Vertex>}
	 */
	this.totalVertexArraySC = [];
};

/**
 * delete all vertex.
 */
VertexMatrix.prototype.deleteObjects = function() 
{
	for (var i = 0, vertexListsCount = this.vertexListsArray.length; i < vertexListsCount; i++) 
	{
		this.vertexListsArray[i].deleteObjects();
		this.vertexListsArray[i] = undefined;
	}
	this.vertexListsArray = undefined;
};

/**
 * add vertex list and return.
 * @returns {VertexList}}
 */
VertexMatrix.prototype.newVertexList = function() 
{
	var vertexList = new VertexList();
	this.vertexListsArray.push(vertexList);
	return vertexList;
};

/**
 * get vertex list
 * @param {Number }idx
 * @returns {VertextList|undefined} if invalid idx, return undefined
 */
VertexMatrix.prototype.getVertexList = function(idx) 
{
	if (idx >= 0 && idx < this.vertexListsArray.length) 
	{
		return this.vertexListsArray[idx];
	}
	else 
	{
		return undefined;
	}
};

/**
 * copy from another vertex matrix.
 * @param {VertexMatrix} vertexMatrix Required.
 */
VertexMatrix.prototype.copyFrom = function(vertexMatrix) 
{
	if (vertexMatrix === undefined)
	{ return; }
	
	var vertexList, myVertexList;
	var vertexListsCount = vertexMatrix.vertexListsArray.length;
	for (var i=0; i<vertexListsCount; i++)
	{
		vertexList = vertexMatrix.getVertexList(i);
		myVertexList = this.newVertexList();
		myVertexList.copyFrom(vertexList);
	}
};

/**
 * get bounding box this matrix.
 * init totalVertexArraySC and get bounding box
 * @param {BoundingBox} resultBox if this is undefined, set new BoundingBox instance.
 * @returns {BoundingBox}
 */
VertexMatrix.prototype.getBoundingBox = function(resultBox) 
{
	if (resultBox === undefined) { resultBox = new BoundingBox(); }
	
	this.totalVertexArraySC.length = 0;
	this.totalVertexArraySC = this.getTotalVertexArray(this.totalVertexArraySC);
	for (var i = 0, totalVertexCount = this.totalVertexArraySC.length; i < totalVertexCount; i++) 
	{
		if (i === 0) { resultBox.init(this.totalVertexArraySC[i].point3d); }
		else { resultBox.addPoint(this.totalVertexArraySC[i].point3d); }
	}
	return resultBox;
};

/**
 * set vertex index number in list
 * mIdxInList is maybe wrong. 
 * 
 * @see Atmosphere
 */
VertexMatrix.prototype.setVertexIdxInList = function() 
{
	var idxInList = 0;
	for (var i = 0, vertexListsCount = this.vertexListsArray.length; i < vertexListsCount; i++) 
	{
		var vtxList = this.vertexListsArray[i];
		for (var j = 0, vertexCount = vtxList.vertexArray.length; j < vertexCount; j++) 
		{
			var vertex = vtxList.getVertex(j);
			vertex.mIdxInList = idxInList;
			idxInList++;
		}
	}
};

/**
 * get total vertex count
 * @returns {number}}
 */
VertexMatrix.prototype.getVertexCount = function() 
{
	var vertexCount = 0;
	for (var i = 0, vertexListsCount = this.vertexListsArray.length; i < vertexListsCount; i++) 
	{
		vertexCount += this.vertexListsArray[i].getVertexCount();
	}
	
	return vertexCount;
};

/**
 * get total vertex array.
 * @param {Array} resultTotalVertexArray 변수
 * @returns {Array.<Vertex>}
 */
VertexMatrix.prototype.getTotalVertexArray = function(resultTotalVertexArray) 
{
	for (var i = 0, vertexListsCount = this.vertexListsArray.length; i < vertexListsCount; i++) 
	{
		var vtxList = this.vertexListsArray[i];
		for (var j = 0, vertexCount = vtxList.vertexArray.length; j < vertexCount; j++) 
		{
			var vertex = vtxList.getVertex(j);
			resultTotalVertexArray.push(vertex);
		}
	}
	
	return resultTotalVertexArray;
};

/**
 * get vertex color float array.
 * @param {Float32Array} resultFloatArray if this is undefined, set new Float32Array instance. length = this.totalVertexArraySC.length*6
 * @returns {Float32Array}
 */
VertexMatrix.prototype.getVBOVertexColorFloatArray = function(resultFloatArray) 
{
	this.totalVertexArraySC.length = 0;
	this.totalVertexArraySC = this.getTotalVertexArray(this.totalVertexArraySC);
	
	var totalVertexCount = this.totalVertexArraySC.length;
	if (resultFloatArray === undefined) { resultFloatArray = new Float32Array(totalVertexCount * 6); }
	
	for (var i = 0; i < totalVertexCount; i++) 
	{
		var vertex = this.totalVertexArraySC[i];
		resultFloatArray[i*6] = vertex.point3d.x;
		resultFloatArray[i*6+1] = vertex.point3d.y;
		resultFloatArray[i*6+2] = vertex.point3d.z;
		
		resultFloatArray[i*6+3] = vertex.color4.r;
		resultFloatArray[i*6+4] = vertex.color4.g;
		resultFloatArray[i*6+5] = vertex.color4.b;
	}
	
	return resultFloatArray;
};

/**
 * get vertex color with alpha float array.
 * @param {Float32Array} resultFloatArray if this is undefined, set new Float32Array instance. length = this.totalVertexArraySC.length*7
 * @returns {Float32Array}
 */
VertexMatrix.prototype.getVBOVertexColorRGBAFloatArray = function(resultFloatArray) 
{
	this.totalVertexArraySC.length = 0;
	this.totalVertexArraySC = this.getTotalVertexArray(this.totalVertexArraySC);
	
	var totalVertexCount = this.totalVertexArraySC.length;
	if (resultFloatArray === undefined) { resultFloatArray = new Float32Array(totalVertexCount * 7); }
	
	for (var i = 0; i < totalVertexCount; i++) 
	{
		var vertex = this.totalVertexArraySC[i];
		resultFloatArray[i*7] = vertex.point3d.x;
		resultFloatArray[i*7+1] = vertex.point3d.y;
		resultFloatArray[i*7+2] = vertex.point3d.z;
		
		resultFloatArray[i*7+3] = vertex.color4.r;
		resultFloatArray[i*7+4] = vertex.color4.g;
		resultFloatArray[i*7+5] = vertex.color4.b;
		resultFloatArray[i*7+6] = vertex.color4.a;
	}
	
	return resultFloatArray;
};

/**
 * get vertex basic float array.
 * @param {Float32Array} resultFloatArray if this is undefined, set new Float32Array instance. length = this.totalVertexArraySC.length*3
 * @returns {Float32Array}
 */
VertexMatrix.prototype.getVBOVertexFloatArray = function(resultFloatArray) 
{
	this.totalVertexArraySC.length = 0;
	this.totalVertexArraySC = this.getTotalVertexArray(this.totalVertexArraySC);
	
	var totalVertexCount = this.totalVertexArraySC.length;
	if (resultFloatArray === undefined) { resultFloatArray = new Float32Array(totalVertexCount * 3); }
	
	for (var i = 0; i < totalVertexCount; i++) 
	{
		var vertex = this.totalVertexArraySC[i];
		resultFloatArray[i*3] = vertex.point3d.x;
		resultFloatArray[i*3+1] = vertex.point3d.y;
		resultFloatArray[i*3+2] = vertex.point3d.z;
	}
	
	return resultFloatArray;
};

/**
 * translate vertex in vertex matrix
 * @param {Number} dx
 * @param {Number} dy
 * @param {Number} dz
 */
VertexMatrix.prototype.translateVertices = function(dx, dy, dz) 
{
	for (var i = 0, vertexListsCount = this.vertexListsArray.length; i < vertexListsCount; i++) 
	{
		this.vertexListsArray[i].translateVertices(dx, dy, dz);
	}
};

/**
 * set TTrianglesMatrix using vertexMatrix.
 * OLD function. Used for shadow blending cube. OLD.
 * TTriangles provisional is in geometryUtils.	
 * condition: all the vertex lists must have the same number of vertex.
 * @param {TTrianglesMatrix} tTrianglesMatrix
 */
VertexMatrix.prototype.makeTTrianglesLateralSidesLOOP = function(tTrianglesMatrix) 
{
	// 
	var vtxList1;
	var vtxList2;
	var tTrianglesList;
	var tTriangle1;
	var tTriangle2;
	var vertexCount = 0;
	for (var i = 0, vertexListsCount = this.vertexListsArray.length; i < vertexListsCount-1; i++) 
	{
		vtxList1 = this.vertexListsArray[i];
		vtxList2 = this.vertexListsArray[i+1];
		tTrianglesList = tTrianglesMatrix.newTTrianglesList();
		
		vertexCount = vtxList1.vertexArray.length;
		for (var j = 0; j < vertexCount; j++) 
		{
			tTriangle1 = tTrianglesList.newTTriangle();
			tTriangle2 = tTrianglesList.newTTriangle();
			
			if (j === vertexCount-1) 
			{
				tTriangle1.setVertices(vtxList1.getVertex(j), vtxList2.getVertex(j), vtxList2.getVertex(0)); 
				tTriangle2.setVertices(vtxList1.getVertex(j), vtxList2.getVertex(0), vtxList1.getVertex(0)); 
			}
			else 
			{
				tTriangle1.setVertices(vtxList1.getVertex(j), vtxList2.getVertex(j), vtxList2.getVertex(j+1)); 
				tTriangle2.setVertices(vtxList1.getVertex(j), vtxList2.getVertex(j+1), vtxList1.getVertex(j+1)); 
			}
		}
	}
};

/**
 * get vertex matrix. using data array.
 * @deprecated
 * @static
 * @param {Array.<Number>} positions3Array Required.
 * @param {Array.<Number>} normals3Array
 * @param {Array.<Number>} texCoords2Array
 * @param {Array.<Number>} colors4Array
 * @param {Number} numCols
 * @param {Number} numRows
 * @param {VertexMatrix} resultVertexMatrix if undefined, set new VertexMatrix instance.
 * @returns {VertexMatrix} 
 */
VertexMatrix.makeMatrixByDataArray = function(positions3Array, normals3Array, texCoords2Array, colors4Array, numCols, numRows, resultVertexMatrix) 
{
	if (positions3Array === undefined)
	{ return; }
	
	if (resultVertexMatrix === undefined)
	{ resultVertexMatrix = new VertexMatrix(); }
	
	var vertexList;
	var vertex;
	var px, py, pz;
	var nx, ny, nz;
	var tx, ty;
	var r, g, b, a;
	for (var r=0; r<numRows; r++)
	{
		vertexList = resultVertexMatrix.newVertexList();
		for (var c=0; c<numCols; c++)
		{
			vertex = vertexList.newVertex();
			px = positions3Array[c*3];
			py = positions3Array[c*3+1];
			pz = positions3Array[c*3+2];
			
			vertex.setPosition(px, py, pz);
			
			if (normals3Array)
			{
				nx = normals3Array[c*3];
				ny = normals3Array[c*3+1];
				nz = normals3Array[c*3+2];
				vertex.setNormal(nx, ny, nz);
			}
			
			if (texCoords2Array)
			{
				tx = texCoords2Array[c*2];
				ty = texCoords2Array[c*2+1];
				vertex.setTexCoord(tx, ty);
			}
			
			if (colors4Array)
			{
				r = colors4Array[c*4];
				g = colors4Array[c*4+1];
				b = colors4Array[c*4+2];
				a = colors4Array[c*4+3];
				vertex.setColorRGBA(r, g, b, a);
			}
		}
	}
	
	return resultVertexMatrix;
};

/**
 * make face array between two vertex lists.
 * condition: all the vertex lists must have the same number of vertex.
 *	 3   3-------------2  +   +-------------+  +   +-------------+  +   +-------------+
 *	 | \   \           |  | \   \           |  | \   \           |  | \   \           |
 *	 |   \   \  face_B |  |   \   \  face_B |  |   \   \  face_B |  |   \   \  face_B |
 *	 |     \   \       |  |     \   \       |  |     \   \       |  |     \   \       |
 *	 |       \   \     |  |       \   \     |  |       \   \     |  |       \   \     |
 *	 | face_A  \   \   |  | face_A  \   \   |  | face_A  \   \   |  | face_A  \   \   |
 *	 |           \   \ |  |           \   \ |  |           \   \ |  |           \   \ |
 *	 0-------------1   1  +-------------+   +  +-------------+   +  +-------------+   +
 *	
 *	 +   +-------------+  +   +-------------+  +   +-------------+  +   +-------------+
 *	 | \   \           |  | \   \           |  | \   \           |  | \   \           |
 *	 |   \   \  face_B |  |   \   \  face_B |  |   \   \  face_B |  |   \   \  face_B |
 *	 |     \   \       |  |     \   \       |  |     \   \       |  |     \   \       |
 *	 |       \   \     |  |       \   \     |  |       \   \     |  |       \   \     |
 *	 | face_A  \   \   |  | face_A  \   \   |  | face_A  \   \   |  | face_A  \   \   |
 *	 |           \   \ |  |           \   \ |  |           \   \ |  |           \   \ |
 *	 +-------------+   +  +-------------+   +  +-------------+   +  +-------------+   +
 * @static
 * @param {VertexList} vertexListDown Required.
 * @param {VertexList} vertexListUp
 * @param {Array.<Face>} resultFacesArray
 * @param {Boolean} bLoop
 * @param {Boolean} bClockWise
 * @returns {VertexMatrix} 
 */
VertexMatrix.makeFacesBetweenVertexLists = function(vertexListDown, vertexListUp, resultFacesArray, bLoop, bClockWise) 
{
	if (resultFacesArray === undefined)
	{ resultFacesArray = []; }
	
	var face_A, face_B;
	var hedge_A, hedge_B;
	var faceLast_B;
	var vertexCount = vertexListDown.vertexArray.length;
	var vertex_0, vertex_1, vertex_2, vertex_3;
	if (bClockWise === undefined)
	{ bClockWise = false; }
	
	var resultHalfEdgesArray_A = [];
	var resultHalfEdgesArray_B = [];
	var vtx0_idx, vtx1_idx, vtx2_idx, vtx3_idx;
	
	if (bClockWise)
	{
		for (var j = 0; j < vertexCount; j++) 
		{
			resultHalfEdgesArray_A.length = 0;
			resultHalfEdgesArray_B.length = 0;
			if (j < vertexCount-1) 
			{
				vertex_0 = vertexListDown.getVertex(j);
				vertex_1 = vertexListDown.getVertex(j+1);
				vertex_2 = vertexListUp.getVertex(j+1);
				vertex_3 = vertexListUp.getVertex(j);
				
				face_A = new Face();
				face_B = new Face();
				
				face_A.addVerticesArray([vertex_0, vertex_3, vertex_1]);
				//resultHalfEdgesArray_A = face_A.createHalfEdges(resultHalfEdgesArray_A);
				//hedge_A = resultHalfEdgesArray_A[1]; // Diagonal hedge of face_A.
				
				face_B.addVerticesArray([vertex_1, vertex_3, vertex_2]);
				//resultHalfEdgesArray_B = face_B.createHalfEdges(resultHalfEdgesArray_B);
				//hedge_B = resultHalfEdgesArray_B[2]; // Diagonal hedge of face_B.
				
				// Now, set twins between face_A & face_B.
				//hedge_A.setTwin(hedge_B);
				resultFacesArray.push(face_A);
				resultFacesArray.push(face_B);
			}
			else 
			{
				if (bLoop !== undefined && bLoop === true)
				{
					vertex_0 = vertexListDown.getVertex(j);
					vertex_1 = vertexListDown.getVertex(0);
					vertex_2 = vertexListUp.getVertex(0);
					vertex_3 = vertexListUp.getVertex(j);
					
					face_A = new Face();
					face_B = new Face();
					
					face_A.addVerticesArray([vertex_0, vertex_3, vertex_1]);
					//resultHalfEdgesArray_A = face_A.createHalfEdges(resultHalfEdgesArray_A);
					//hedge_A = resultHalfEdgesArray_A[1]; // Diagonal hedge of face_A.
					
					face_B.addVerticesArray([vertex_1, vertex_3, vertex_2]);
					//resultHalfEdgesArray_B = face_B.createHalfEdges(resultHalfEdgesArray_B);
					//hedge_B = resultHalfEdgesArray_B[2]; // Diagonal hedge of face_B.
					
					// Now, set twins between face_A & face_B.
					//hedge_A.setTwin(hedge_B);
					resultFacesArray.push(face_A);
					resultFacesArray.push(face_B);
				}
			}
			
			if (faceLast_B === undefined)
			{ faceLast_B = face_B; }
			else 
			{
				//face_A.setTwinFace(faceLast_B);
				faceLast_B = face_B;
			}
			
			
		}
	}
	else
	{
		for (var j = 0; j < vertexCount; j++) 
		{
			resultHalfEdgesArray_A.length = 0;
			resultHalfEdgesArray_B.length = 0;

			if (j < vertexCount - 1) 
			{
				vertex_0 = vertexListDown.getVertex(j);
				vertex_1 = vertexListDown.getVertex(j+1);
				vertex_2 = vertexListUp.getVertex(j+1);
				vertex_3 = vertexListUp.getVertex(j);
				
				face_A = new Face();
				face_B = new Face();
				
				face_A.addVerticesArray([vertex_0, vertex_1, vertex_3]);
				//resultHalfEdgesArray_A = face_A.createHalfEdges(resultHalfEdgesArray_A);
				//hedge_A = resultHalfEdgesArray_A[1]; // Diagonal hedge of face_A.
				
				face_B.addVerticesArray([vertex_1, vertex_2, vertex_3]);
				//resultHalfEdgesArray_B = face_B.createHalfEdges(resultHalfEdgesArray_B);
				//hedge_B = resultHalfEdgesArray_B[2]; // Diagonal hedge of face_B.
				
				// Now, set twins between face_A & face_B.
				//hedge_A.setTwin(hedge_B);
				
				resultFacesArray.push(face_A);
				resultFacesArray.push(face_B);
			}
			else 
			{
				if (bLoop !== undefined && bLoop === true)
				{
					vertex_0 = vertexListDown.getVertex(j);
					vertex_1 = vertexListDown.getVertex(0);
					vertex_2 = vertexListUp.getVertex(0);
					vertex_3 = vertexListUp.getVertex(j);
					
					face_A = new Face();
					face_B = new Face();
					
					face_A.addVerticesArray([vertex_0, vertex_1, vertex_3]);
					//resultHalfEdgesArray_A = face_A.createHalfEdges(resultHalfEdgesArray_A);
					//hedge_A = resultHalfEdgesArray_A[1]; // Diagonal hedge of face_A.
					
					face_B.addVerticesArray([vertex_1, vertex_2, vertex_3]);
					//resultHalfEdgesArray_B = face_B.createHalfEdges(resultHalfEdgesArray_B);
					//hedge_B = resultHalfEdgesArray_B[2]; // Diagonal hedge of face_B.
					
					// Now, set twins between face_A & face_B.
					//hedge_A.setTwin(hedge_B);
					
					resultFacesArray.push(face_A);
					resultFacesArray.push(face_B);
				}
				
			}
			
			if (faceLast_B === undefined)
			{ faceLast_B = face_B; }
			else 
			{
				//face_A.setTwinFace(faceLast_B);
				faceLast_B = face_B;
			}
			
			
		}
	}
	
	return resultFacesArray;
};

/**
* make Surface
* condition: all the vertex lists must have the same number of vertex.
* @deprecated
* @static
* @param {VertexMatrix} vertexMatrix
* @param {Surface} resultSurface  if undefined, set new Surface instance.
* @param {Boolean} bLoop
* @param {Boolean} bClockWise
* @returns {Surface} 
*/
VertexMatrix.makeSurface = function(vertexMatrix, resultSurface, bLoop, bClockWise) 
{
	if (resultSurface === undefined)
	{ resultSurface = new Surface(); }
	
	var vtxList1;
	var vtxList2;
	var vertexListDown, vertexListUp;
	var resultFacesArray = [];
	var resultFacesArrayLast;
	var vertexCount = 0;
	var vertexListsCount = vertexMatrix.vertexListsArray.length;
	for (var i = 0; i <vertexListsCount-1; i++) 
	{
		vertexListDown = vertexMatrix.vertexListsArray[i];
		vertexListUp = vertexMatrix.vertexListsArray[i+1];
		resultFacesArray = VertexMatrix.makeFacesBetweenVertexLists(vertexListDown, vertexListUp, resultFacesArray, bLoop, bClockWise);
		/*
		if(resultFacesArrayLast === undefined)
			resultFacesArrayLast = resultFacesArray;
		else{
			Surface.setTwinsFacesBetweenFacesArrays_regularQuadGrid(resultFacesArray, resultFacesArrayLast);
			resultFacesArrayLast = resultFacesArray;
		}
		*/
		
		resultSurface.addFacesArray(resultFacesArray);
		
		resultFacesArray.length = 0;
	}
	
	return resultSurface;
};

/**
 * set TTrianglesMatrix using vertexMatrix.
 * OLD function. Used for shadow blending cube. OLD.
 * TTriangles provisional is in geometryUtils.	
 * condition: all the vertex lists must have the same number of vertex.
 * @deprecated
 * @param {TTrianglesMatrix} trianglesMatrix
 * @param {Boolean} bLoop if true, include last vertex triangle
 */
VertexMatrix.prototype.makeTrianglesLateralSides = function(trianglesMatrix, bLoop) 
{
	var vtxList1;
	var vtxList2;
	var trianglesList;
	var triangle1;
	var triangle2;
	var vertexCount = 0;
	for (var i = 0, vertexListsCount = this.vertexListsArray.length; i < vertexListsCount-1; i++) 
	{
		vtxList1 = this.vertexListsArray[i];
		vtxList2 = this.vertexListsArray[i+1];
		trianglesList = trianglesMatrix.newTrianglesList();
		
		vertexCount = vtxList1.vertexArray.length;
		for (var j = 0; j < vertexCount; j++) 
		{
			if (j === vertexCount-1) 
			{
				if (bLoop !== undefined && bLoop === true)
				{
					triangle1 = trianglesList.newTriangle();
					triangle2 = trianglesList.newTriangle();
					triangle1.setVertices(vtxList1.getVertex(j), vtxList2.getVertex(j), vtxList2.getVertex(0)); 
					triangle2.setVertices(vtxList1.getVertex(j), vtxList2.getVertex(0), vtxList1.getVertex(0)); 
				}
			}
			else 
			{
				triangle1 = trianglesList.newTriangle();
				triangle2 = trianglesList.newTriangle();
				triangle1.setVertices(vtxList1.getVertex(j), vtxList2.getVertex(j), vtxList2.getVertex(j+1)); 
				triangle2.setVertices(vtxList1.getVertex(j), vtxList2.getVertex(j+1), vtxList1.getVertex(j+1)); 
			}
		}
	}
};

/**
* get index of array
* return col + row * numCols;
* @static
* @param {Number} numCols
* @param {Number} numRows not used.
* @param {Number} col
* @param {Number} row
* @returns {Number} 
*/
VertexMatrix.getIndexOfArray = function(numCols, numRows, col, row) 
{
	// static function.
	var idx = col + row * numCols;
	return idx;
};

/**
 * vertex point transform by matrix4
 * @param {Matrix4} transformMatrix
 * @see Matrix4#transformPoint3D
 */
VertexMatrix.prototype.transformPointsByMatrix4 = function(transformMatrix) 
{
	for (var i = 0, vertexListsCount = this.vertexListsArray.length; i < vertexListsCount; i++) 
	{
		var vtxList = this.vertexListsArray[i];
		vtxList.transformPointsByMatrix4(transformMatrix);
	}
};

