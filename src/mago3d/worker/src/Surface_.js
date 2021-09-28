'use strict';

/**
 * 서피스
 * 
 * @class
 */
var Surface_ = function(options) 
{
	this._guid = Utils_.createGuid();
	this.id;
	this.name;

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
	
	if (options !== undefined)
	{
		if (options.id !== undefined)
		{ this.id = options.id; }
		
		if (options.name !== undefined)
		{ this.name = options.name; }
	}
};

Surface_.prototype.getFacesCount = function()
{
	return this.facesArray.length;
};

Surface_.prototype.getFace = function(index)
{
	return this.facesArray[index];
};

Surface_.prototype.setColor = function(r, g, b, a)
{
	var face;
	for (var i=0, len=this.getFacesCount(); i<len; i++)
	{
		face = this.getFace(i);
		face.setColor(r, g, b, a);
	}
};

Surface_.prototype.newFace = function()
{
	var face = new Face_();
	this.facesArray.push(face);
	return face;
};

Surface_.prototype.addFacesArray = function(faces)
{
	if (faces !== undefined)
	{
		Array.prototype.push.apply(this.facesArray, faces);
	}
};

Surface_.prototype.reverseSense = function()
{
	var face;
	var facesCount = this.getFacesCount();
	for (var i=0; i<facesCount; i++)
	{
		face = this.getFace(i);
		face.reverseSense();
	}
};

Surface_.prototype.getNoRepeatedVerticesArray = function(result)
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

Surface_.prototype.getTriangles = function(result)
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

Surface_.prototype.calculateVerticesNormals = function(bForceRecalculatePlaneNormal)
{
	var face;
	var facesCount = this.getFacesCount();
	for (var i=0; i<facesCount; i++)
	{
		face = this.getFace(i);
		face.calculateVerticesNormals(bForceRecalculatePlaneNormal);
	}
};

Surface_.prototype.setTwinsFaces = function()
{
	var face, face2;
	
	var facesCount = this.facesArray.length;
	for (var i=0; i<facesCount; i++)
	{
		face = this.getFace(i);
		for (var j=i+1; j<facesCount; j++)
		{
			if (i !== j)
			{
				face2 = this.getFace(j);
				face.setTwinFace(face2);
			}
		}
	}
};

Surface_.prototype.getCopyIndependentSurface = function(result)
{
	if (result === undefined)
	{
		result = new Surface_();
	}

	if (result.localVertexList === undefined)
	{
		result.localVertexList = new VertexList_();
	}

	var resultLocalvertexList = result.localVertexList;
	result.id = this.id;
	result.name = this.name;

	// copy the localVertexList.
	var vertex;
	var vertexCopy;
	var verticesArray = this.getNoRepeatedVerticesArray();
	var vertexCount = verticesArray.length;
	for (var i=0; i<vertexCount; i++)
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

	var faceCount = this.getFacesCount();
	for (var i=0; i<faceCount; i++)
	{
		face = this.getFace(i);
		faceCopy = result.newFace();
		// TODO : 생성과 관련된 코드는 클래스 외부에서 하지 않도록 변경해야함
		faceCopy.vertexArray = [];

		vertexCount = face.getVerticesCount();
		for (var j=0; j<vertexCount; j++)
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