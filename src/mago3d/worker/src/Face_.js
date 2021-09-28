'use strict';

/**
 * The minimum elementary object that constitutes the surface.
 * 표면, Surface의 하위 개념.
 * 실린더를 예를 들면
 * 위 아래 뚜껑은 각각 하나의 Surface이자 face.
 * 옆면은 하나의 Surface에 수십개의 face가 모여있는 구조.
 * 
 * @exception {Error} Messages.CONSTRUCT_ERROR
 * 
 * @class Face
 * @constructor
 */
var Face_ = function() 
{

	this._guid = Utils_.createGuid();
	/**
	 * 페이스의 버텍스 리스트
	 * @type {Array.<Vertex>}
	 */
	this.vertexArray;

	/**
	 * 페이스의 임의의 버텍스의 hEdge.
	 * @type {HalfEdge}
	 */
	this.hEdge;

	/**
	 * 페이스의 플레인 노말 포인트.
	 * @type {Point3D}
	 */
	this.planeNormal;

	/**
	 * @deprecated not used
	 */
	this.surfaceOwner;
};

Face_.prototype.getVerticesCount = function()
{
	if (this.vertexArray === undefined)
	{ return 0; }

	return this.vertexArray.length;
};

Face_.prototype.getVertex = function(idx)
{
	if (this.vertexArray === undefined)
	{ return undefined; }

	return this.vertexArray[idx];
};

Face_.getBestFacePlaneToProject = function(normal)
{
	var best_plane = -1; //"unknown";

	var nx = Math.abs(normal.x);
	var ny = Math.abs(normal.y);
	var nz = Math.abs(normal.z);

	if ( nz > nx && nz >= ny )
 	{
 		best_plane = 0; //"xy";
 	}
 	else if ( nx >= ny && nx >= nz )
 	{
 		best_plane = 1; //"yz";
 	}
 	else if ( ny > nx && ny >= nz )
 	{
 		best_plane = 2; //"xz";
	}

	return best_plane;
};

Face_.prototype.calculatePlaneNormal = function()
{
	// Note: face must be planar.
	this.planeNormal = Face_.calculatePlaneNormal(this.vertexArray, this.planeNormal);
	return this.planeNormal;
};

Face_.prototype.getPlaneNormal = function()
{
	if (this.planeNormal === undefined || this.planeNormal.isNAN())
	{ 
		//this.calculateVerticesNormals(); 
		this.calculatePlaneNormal();
	} 
	
	return this.planeNormal;
};

Face_.getProjectedPolygon2D = function(vertexArray, normal, resultProjectedPolygon2d)
{
	// Create a temp polygon2d.
	if (resultProjectedPolygon2d === undefined)
	{ resultProjectedPolygon2d = new Polygon2D_(); }
	
	if (resultProjectedPolygon2d.point2dList === undefined)
	{ resultProjectedPolygon2d.point2dList = new Point2DList_(); }

	var point2dList = resultProjectedPolygon2d.point2dList;
	point2dList.pointsArray =  VertexList_.getProjectedPoints2DArray(vertexArray, normal, point2dList.pointsArray);

	return resultProjectedPolygon2d;
};

/**
 * Note: to call this function, this-face must be CONVEX face.
 * 버텍스 배열의 첫번째 배열을 기준으로 삼각형 convex(Triangle)을 생성 후 배열에 담아 반환
 * @param {Array.<Triangle>} resultTrianglesArray undefined일 때, 배열로 초기화.
 * @returns {Array.<Triangle>|undefined} 기존 버텍스 배열이 undefined거나 비어있으면 매개변수 resultTrianglesArray 상태 그대로 반환.
 */
Face_.prototype.getTrianglesConvex = function(resultTrianglesArray)
{
	// To call this method, the face MUST be convex.
	// To call this method, the face MUST be convex.
	if (this.vertexArray === undefined || this.vertexArray.length === 0)
	{ return resultTrianglesArray; }
     
	if (resultTrianglesArray === undefined)
	{ resultTrianglesArray = []; }
     
	var vertex0, vertex1, vertex2;
	var triangle;
	vertex0 = this.getVertex(0);
	var verticesCount = this.getVerticesCount();
	for (var i=1; i<verticesCount-1; i++)
	{
		vertex1 = this.getVertex(i);
		vertex2 = this.getVertex(i+1);
		triangle = new Triangle_(vertex0, vertex1, vertex2);
		resultTrianglesArray.push(triangle);
	}
     
	return resultTrianglesArray;
};

Face_.prototype.getTessellatedTriangles = function(resultTrianglesArray)
{
	if (resultTrianglesArray === undefined)
	{ resultTrianglesArray = []; }

	var verticesCount = this.getVerticesCount();
	if (verticesCount <= 3)
	{
		// This is a triangle, so no need to tessellate.
		resultTrianglesArray = this.getTrianglesConvex(resultTrianglesArray);
		return resultTrianglesArray;
	}

	// 1rst, must project the face to a plane and process to tessellate in 2d.
	var normal = this.getPlaneNormal();

	// Create a temp polygon2d.
	var polygon2d = Face_.getProjectedPolygon2D(this.vertexArray, normal, undefined);
	
	// Now, tessellate the polygon2D.
	// Before tessellate, we must know if there are concavePoints.
	var resultConcavePointsIdxArray;
	resultConcavePointsIdxArray = polygon2d.calculateNormal(resultConcavePointsIdxArray);
	
	var convexPolygonsArray = [];
	polygon2d.tessellate(resultConcavePointsIdxArray, convexPolygonsArray);
	
	// inside of "convexPolygonsArray" there are 1 or more convexPolygons result of tessellation of the polygon2d.

	this.calculateVerticesNormals();
	var convexPolygonsCount = convexPolygonsArray.length;
	for (var i=0; i<convexPolygonsCount; i++)
	{
		var convexPolygon = convexPolygonsArray[i];
		
		if (convexPolygon.point2dList.getPointsCount() === 0)
		{ continue; }
		
		var vertex0, vertex1, vertex2;
		var triangle;
		var point2d_0, point2d_1, point2d_2;
		var point2d_0 = convexPolygon.point2dList.getPoint(0);
		
		vertex0 = point2d_0.ownerVertex3d;
		var point2dCount = convexPolygon.point2dList.getPointsCount();
		for (var j=1; j<point2dCount-1; j++)
		{
			point2d_1 = convexPolygon.point2dList.getPoint(j);
			point2d_2 = convexPolygon.point2dList.getPoint(j+1);
			vertex1 = point2d_1.ownerVertex3d;
			vertex2 = point2d_2.ownerVertex3d;
			triangle = new Triangle_(vertex0, vertex1, vertex2);
			
			resultTrianglesArray.push(triangle);
		}
	}
	//this.calculateVerticesNormals();
	return resultTrianglesArray;
};

Face_.calculatePlaneNormal = function(vertexArray, resultPlaneNormal)
{
	// Note: the vertexArray must be planar.
	if (resultPlaneNormal === undefined)
	{ resultPlaneNormal = new Point3D_(); }

	resultPlaneNormal.set(0, 0, 0);
	var verticesCount = vertexArray.length;
	for (var i=0; i<verticesCount; i++)
	{
		var prevIdx = VertexList_.getPrevIdx(i, vertexArray);
		var startVec = VertexList_.getVector(prevIdx, vertexArray, undefined);
		var endVec = VertexList_.getVector(i, vertexArray, undefined);
		
		startVec.unitary();
		endVec.unitary();
		
		if (startVec.isNAN() || endVec.isNAN())
		{ 
			continue; 
		}
		
		var crossProd = startVec.crossProduct(endVec, undefined); // Point3D.
		crossProd.unitary(); 
		if (crossProd.isNAN())
		{ continue; }
	
		var scalarProd = startVec.scalarProduct(endVec);
		
		var cosAlfa = scalarProd; // Bcos startVec & endVec are unitaries.
		if (cosAlfa > 1.0)
		{ cosAlfa = 1.0; }
		else if (cosAlfa < -1.0)
		{ cosAlfa = -1.0; }
		var alfa = Math.acos(cosAlfa);
		
		resultPlaneNormal.add(crossProd.x*alfa, crossProd.y*alfa, crossProd.z*alfa);
	}
	resultPlaneNormal.unitary();
	
	return resultPlaneNormal;
};

Face_.prototype.createHalfEdges = function(resultHalfEdgesArray)
{
	if (this.vertexArray === undefined || this.vertexArray.length === 0)
	{ return resultHalfEdgesArray; }
	
	if (resultHalfEdgesArray === undefined)
	{ resultHalfEdgesArray = []; }
	
	var vertex;
	var hedge;
	var verticesCount = this.getVerticesCount();
	
	// 1rst, create the half edges.
	for (var i=0; i<verticesCount; i++)
	{
		vertex = this.getVertex(i);
		hedge = new HalfEdge_();
		hedge.setStartVertex(vertex);
		hedge.setFace(this);
		resultHalfEdgesArray.push(hedge);
	}
	
	// now, for all half edges, set the nextHalfEdge.
	var nextHedge;
	var nextIdx;
	for (var i=0; i<verticesCount; i++)
	{
		hedge = resultHalfEdgesArray[i];
		nextIdx = VertexList_.getNextIdx(i, this.vertexArray);
		nextHedge = resultHalfEdgesArray[nextIdx];
		hedge.setNext(nextHedge);
	}
	
	// set a hedge for this face.
	this.hEdge = resultHalfEdgesArray[0];
	
	return resultHalfEdgesArray;
};

Face_.prototype.reverseSense = function()
{
	this.vertexArray.reverse();
};

Face_.prototype.setColor = function(r, g, b, a)
{
	var vertex;
	var verticesCount = this.getVerticesCount();
	for (var i=0; i<verticesCount; i++)
	{
		vertex = this.getVertex(i);
		vertex.setColorRGBA(r, g, b, a);
	}
};

Face_.prototype.calculateVerticesNormals = function(bForceRecalculatePlaneNormal)
{
	// This function calculates normals for concave faces.
	// Provisionally calculate the plane normal and assign to the vertices.
	var verticesCount = this.vertexArray.length;

	if (bForceRecalculatePlaneNormal !== undefined && bForceRecalculatePlaneNormal)
	{ this.calculatePlaneNormal(); }
	
	if (this.planeNormal === undefined)
	{ this.calculatePlaneNormal(); }
	//@TODO: Add dirty-flag not to copy the normal vector twice.
	
	var normal;
	var verticesCount = this.getVerticesCount();
	for (var i=0; i<verticesCount; i++)
	{
		//normal = this.vertexArray[i].getNormal();
		//normal.addPoint(this.planeNormal);
		//normal.unitary();
		this.vertexArray[i].setNormal(this.planeNormal.x, this.planeNormal.y, this.planeNormal.z);
	}
};

Face_.prototype.getHalfEdgesLoop = function(resultHedgesArray)
{
	if (this.hEdge === undefined)
	{ return resultHedgesArray; }
	
	resultHedgesArray = HalfEdge_.getHalfEdgesLoop(this.hEdge, resultHedgesArray);
	return resultHedgesArray;
};

Face_.prototype.setTwinHalfEdge = function(hedge)
{
	var twined = false;
	var finished = false;
	var startHEdge = this.hEdge;
	var currHEdge = this.hEdge;
	while (!finished)
	{
		if (currHEdge.setTwin(hedge))
		{ return true; }

		currHEdge = currHEdge.next;
		if (currHEdge === startHEdge)
		{ finished = true; }
	}
	return twined;
};

Face_.prototype.setTwinFace = function(face)
{
	if (face === undefined)
	{ return false; }
	
	if (this.hEdge === undefined || face.hEdge === undefined)
	{ return false; }
	
	var hedgesArray = face.getHalfEdgesLoop(undefined);
	var hedgesCount = hedgesArray.length;
	var hedge;
	var twined = false;
	for (var i=0; i<hedgesCount; i++)
	{
		hedge = hedgesArray[i];
		if (this.setTwinHalfEdge(hedge))
		{ twined = true; }
	}
	
	return twined;
};