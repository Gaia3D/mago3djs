'use strict';

/**
 * 서피스
 * 
 * @class
 */
var Surface = function()
{
	if (!(this instanceof Surface))
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	/** 
	 * Surface 가 가진 Face 배열
	 * @type {Face[]}
	 */
	this.facesArray = [];

	/** 
	 * 전체 Face 가 가진 Vertex 배열
	 * - "Surface" is NO-Owner of vertices of "localVertexList".
	 * - so, don't delete "localVertexList". Only set as "undefined".
	 * @type {VertexList}
	 */
	this.localVertexList = undefined;

	/** 
	 * - "Surface" is NO-Owner of hedges of "localHedgesList".
	 * - so, don't delete "localHedgesList". Only set as "undefined".
	 * @type {Object[]}
	 */
	this.localHedgesList = undefined;
};

/**
 * 생성된 객체가 있다면 삭제하고 초기화 한다.
 */
Surface.prototype.deleteObjects = function()
{
	for (var i=0, len=this.facesArray.length; i<len; i++)
	{
		this.facesArray[i].deleteObjects();
		this.facesArray[i] = undefined;
	}

	this.facesArray = [];
	this.localVertexList = undefined;
	this.localHedgesList = undefined;
};


/**
 * 페이스 객체를 생성하고 배열에 추가한다.
 *
 * @return {Face} 새로 생성된 Face 객체
 * 
 * @see Face
 */
Surface.prototype.newFace = function()
{
	var face = new Face();
	this.facesArray.push(face);
	return face;
};


/**
 * Surface 가 가지고 있는 Face 의 총 개수를 구한다.
 *
 * @return {Number} 생성된 Face 의 총 개수
 */
Surface.prototype.getFacesCount = function()
{
	return this.facesArray.length;
};


/**
 * 주어진 인덱스값의 위치에 있는 Face 객체를 가져온다.
 *
 * @param {Number} index 검색하기 위한 인덱스값
 * @return {Face} 해당 Face
 */
Surface.prototype.getFace = function(index)
{
	return this.facesArray[index];
};

/**
 * 전체 Face 에 대한 색상정보를 주어진 색상값으로 설정한다.
 *
 * @param {Number} r Red 색상정보
 * @param {Number} g green 색상정보
 * @param {Number} b blue 색상정보
 * @param {Number} a alpha 색상정보
 */
Surface.prototype.setColor = function(r, g, b, a)
{
	var face;
	for (var i=0, len=this.getFacesCount(); i<len; i++)
	{
		face = this.getFace(i);
		face.setColor(r, g, b, a);
	}
};

/**
 * 주어진 Face 객체들을 추가한다.
 *
 * @param {Face[]} faces 추가할 Face 배열
 */
Surface.prototype.addFacesArray = function(faces)
{
	if (faces !== undefined)
	{
		Array.prototype.push.apply(this.facesArray, faces);
	}
};


/**
 * 전체 Face 에 대한 Frontier Half Edge 를 구한다.
 *
 * @param {HalfEdge[]} result Frontier Half Edges
 * @return {HalfEdge[]} Frontier Half Edges
 * 
 * @see HalfEdge
 */
Surface.prototype.getFrontierHalfEdges = function(result)
{
	result = result || [];

	var face;
	for (var i=0, len=this.getFacesCount(); i<len; i++)
	{
		face = this.getFace(i);
		result = face.getFrontierHalfEdges(result);
	}

	return result;
};

/**
 * 전체 Face 에 대한 Half Edge 를 구한다.
 *
 * @param {HalfEdge[]} result Half Edges
 * @return {HalfEdge[]} Half Edges
 * 
 * @see HalfEdge
 */
Surface.prototype.getHalfEdges = function(result)
{
	result = result || [];

	var face;
	for (var i=0, len=this.getFacesCount(); i<len; i++)
	{
		face = this.getFace(i);
		result = face.getHalfEdgesLoop(result);
	}

	return result;
};

/**
 * 현재 서피스 정보의 복사본을 제공한다.
 *
 * @param {Surface} result 서피스
 * @return {Surface}
 */
Surface.prototype.getCopyIndependentSurface = function(result)
{
	if (result === undefined)
	{
		result = new Surface();
	}

	if (result.localVertexList === undefined)
	{
		result.localVertexList = new VertexList();
	}

	var resultLocalvertexList = result.localVertexList;

	// copy the localVertexList.
	var vertex;
	var vertexCopy;
	var verticesArray = this.getNoRepeatedVerticesArray();
	for (var i=0, len=verticesArray.length; i<len; i++)
	{
		vertex = verticesArray[i];
		vertex.setIdxInList(i);
		vertexCopy = resultLocalvertexList.newVertex();
		vertexCopy.copyFrom(vertex);
	}

	// copy the faces.
	var face;
	var faceCopy;
	var vertexIdxInList;
	for (var i=0, len=this.getFacesCount(); i<len; i++)
	{
		face = this.getFace(i);
		faceCopy = result.newFace();
		// TODO : 생성과 관련된 코드는 클래스 외부에서 하지 않도록 변경해야함
		faceCopy.vertexArray = [];

		for (var j=0, len2=face.getVerticesCount(); j<len2; j++)
		{
			vertex = face.getVertex(j);
			vertexIdxInList = vertex.getIdxInList();
			faceCopy.vertexArray.push(resultLocalvertexList.getVertex(vertexIdxInList));
		}
		var halfEdgesArray = [];
		faceCopy.createHalfEdges(halfEdgesArray);
	}

	result.setTwinsFaces();

	return result;
};

/**
 * 특정 Face 와 Face 배열을 비교하여 동일한 Face 가 존재하는지를 알려준다.
 *
 * @param {Face} face 찾을 Face 대상
 * @param {Face[]} facesArray Face 배열
 * @param {Boolean} bIsRegularQuadGrid 정규쿼드격자 여부
 * @return {Boolean} 동일한 Face 존재 여부.
 * 					 동일한 Face 가 존재하면 <code>true</code>
 * 					 동일한 Face 가 존재하지 않으면 <code>false</code>
 */
Surface.setTwinsFacesBetweenFaceAndFacesArrays = function(face, facesArray, bIsRegularQuadGrid)
{
	// if the faces pertains a regular-quad-grid,
	// then there are only ONE twin between the "face" & the "facesArray".
	if (facesArray === undefined)
	{
		return false;
	}

	var twined = false;
	for (var i=0, len=facesArray.length; i<len; i++)
	{
		if (facesArray[i].setTwinFace(face))
		{
			twined = true;
			if (bIsRegularQuadGrid)
			{
				// if faces are from a regular quad grid,
				// there are only 1 twin possible.
				return true;
			}
		}
	}

	return twined;
};


/**
 * 두개의 Face 배열 사이에 동일한 Face 가 존재하는지를 알려준다.
 *
 * @param {Face[]} facesA 비교할 Face 배열
 * @param {Face[]} facesB 비교할 Face 배열
 * @return {Boolean} 동일한 Face 존재 여부.
 * 					 동일한 Face 가 존재하면 <code>true</code>
 * 					 동일한 Face 가 존재하지 않으면 <code>false</code>
 */
Surface.setTwinsFacesBetweenFacesArrays_regularQuadGrid = function(facesA, facesB)
{
	// Faces are rectangles in a rectangle grid.
	if (facesA === undefined || facesB === undefined)
	{
		return false;
	}

	var faceA, faceB;
	for (var i=0, len=facesA.length-1; i<len; i++)
	{
		faceA = facesA[i];
		faceB = facesB[i+1];
		if (!faceA.setTwinFace(faceB))
		{
			faceA = facesA[i+1];
			faceB = facesB[i];
			if (!faceA.setTwinFace(faceB))
			{
				faceA = facesA[i];
				faceB = facesB[i];
				if (!faceA.setTwinFace(faceB))
				{
					faceA = facesA[i+1];
					faceB = facesB[i+1];
					if (!faceA.setTwinFace(faceB))
					{
						// do nothing.
					}
				}
			}
		}
	}
};


/**
 * 전체 Face 배열 중 동일한 Face 가 존재하는지를 알려준다.
 *
 */
Surface.prototype.setTwinsFaces = function()
{
	var face, face2;
	
	var facesCount = this.facesArray.length;
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
 * 전체 Face 로부터 반복되지 않는 버텍스 배열을 구한다.
 *
 * @param {Vertex[]} result 버텍스 배열 결과를 저장
 * @return {Vertex[]} 버텍스 배열
 */
Surface.prototype.getNoRepeatedVerticesArray = function(result)
{
	result = result || [];

	// assign vertex-IdxInList for all used vertices.
	var face;
	var vtx;
	var idxAux = 0;
	var facesCount = this.getFacesCount();
	for (var i=0; i<facesCount; i++)
	{
		face = this.getFace(i);
		for (var j=0, len=face.getVerticesCount(); j<len; j++)
		{
			vtx = face.getVertex(j);
			vtx.setIdxInList(idxAux);
			idxAux++;
		}
	}

	// make a map of unique vertices map using "idxInList" of vertices.
	var verticesMap = {};
	for (var i=0; i<facesCount; i++)
	{
		face = this.getFace(i);
		for (var j=0, len=face.getVerticesCount(); j<len; j++)
		{
			vtx = face.getVertex(j);
			verticesMap[vtx.getIdxInList().toString()] = vtx;
		}
	}

	// finally make the unique vertices array.
	var vertex;
	for (var key in verticesMap)
	{
		if (Object.prototype.hasOwnProperty.call(verticesMap, key))
		{
			vertex = verticesMap[key];
			result.push(vertex);
		}
	}

	return result;
};

/**
 * 전체 Face 에 대해 삼각형을 생성하고 배열로 제공한다.
 * - To call this method, the faces must be convex.
 *
 * @param {Triangle[]} result  Face 배열로부터 생성한 삼각형 배열
 * @return {Triangle[]} Face 배열로부터 생성한 삼각형 배열
 */
Surface.prototype.getTrianglesConvex = function(result)
{
	result = result || [];

	var face;
	for (var i=0, len=this.getFacesCount(); i<len; i++)
	{
		face = this.getFace(i);
		result = face.getTrianglesConvex(result);
	}

	return result;
};

/**
 * 전체 Face 에 대해 테슬레이트된 삼각형을 생성하고 배열로 제공한다.
 *
 * @param {Triangle[]} result  Face 배열로부터 생성한 삼각형 배열
 * @return {Triangle[]} Face 배열로부터 생성한 삼각형 배열
 */
Surface.prototype.getTriangles = function(result)
{
	result = result || [];

	var face;
	for (var i=0, len=this.getFacesCount(); i<len; i++)
	{
		face = this.getFace(i);
		result = face.getTessellatedTriangles(result);
	}

	return result;
};

/**
 * 전체 Face 에 대해 버텍스 노말을 계산한다.
 * 
 * @param {Boolean} bForceRecalculatePlaneNormal Plane 노말의 계산 적용 여부
 * 					<code>true</code> Plane 노말을 사용한다.
 *					<code>false</code> Plane 노말을 사용하지 않는다.
 */
Surface.prototype.calculateVerticesNormals = function(bForceRecalculatePlaneNormal)
{
	var face;
	var facesCount = this.getFacesCount();
	for (var i=0; i<facesCount; i++)
	{
		face = this.getFace(i);
		face.calculateVerticesNormals(bForceRecalculatePlaneNormal);
	}
};

/**
 *
 * 전체 Face 에 대해 각 Face 가 가진 버텍스값을 뒤바꾼다
 */
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
