'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class Face
 */
var Face = function() 
{
	if (!(this instanceof Face)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.vertexArray;
	this.hEdge;
	this.planeNormal;
	this.surfaceOwner;
};

Face.prototype.deleteObjects = function()
{
	// Note: "Face" is NO-Owner of vertices, so, don't delete vertices. Only set as "undefined".***
	this.vertexArray = undefined;

	// Note: "Face" is NO-Owner of hEdge, so, don't delete hEdge. Only set as "undefined".***
	this.hEdge = undefined;
	
	if (this.planeNormal !== undefined)
	{
		this.planeNormal.deleteObjects();
		this.planeNormal = undefined;
	}
	
	this.surfaceOwner = undefined;
};

Face.prototype.getVerticesCount = function()
{
	if (this.vertexArray === undefined)
	{ return 0; }

	return this.vertexArray.length;
};

Face.prototype.addVertex = function(vertex)
{
	if (this.vertexArray === undefined)
	{ this.vertexArray = []; }
	
	this.vertexArray.push(vertex);
};

Face.prototype.addVerticesArray = function(verticesArray)
{
	if (this.vertexArray === undefined)
	{ this.vertexArray = []; }
	
	Array.prototype.push.apply(this.vertexArray, verticesArray);
};

Face.prototype.getVertex = function(idx)
{
	if (this.vertexArray === undefined)
	{ return undefined; }

	return this.vertexArray[idx];
};

Face.prototype.reverseSense = function()
{
	this.vertexArray.reverse();
};

Face.prototype.setColor = function(r, g, b, a)
{
	var vertex;
	var verticesCount = this.getVerticesCount();
	for (var i=0; i<verticesCount; i++)
	{
		vertex = this.getVertex(i);
		vertex.setColorRGBA(r, g, b, a);
	}
};

Face.prototype.getPlaneNormal = function()
{
	if (this.planeNormal === undefined || this.planeNormal.isNAN())
	{ 
		//this.calculateVerticesNormals(); 
		this.calculatePlaneNormal();
	} 
	
	return this.planeNormal;
};

Face.calculatePlaneNormal = function(vertexArray, resultPlaneNormal)
{
	// Note: the vertexArray must be planar.***
	if (resultPlaneNormal === undefined)
	{ resultPlaneNormal = new Point3D(); }

	resultPlaneNormal.set(0, 0, 0);
	var verticesCount = vertexArray.length;
	for (var i=0; i<verticesCount; i++)
	{
		var prevIdx = VertexList.getPrevIdx(i, vertexArray);
		var startVec = VertexList.getVector(prevIdx, vertexArray, undefined);
		var endVec = VertexList.getVector(i, vertexArray, undefined);
		
		startVec.unitary();
		endVec.unitary();
		
		if (startVec.isNAN() || endVec.isNAN())
		{ continue; }
		
		var crossProd = startVec.crossProduct(endVec, undefined); // Point3D.
		crossProd.unitary(); 
		if (crossProd.isNAN())
		{ continue; }
	
		var scalarProd = startVec.scalarProduct(endVec);
		
		var cosAlfa = scalarProd; // Bcos startVec & endVec are unitaries.***
		var alfa = Math.acos(cosAlfa);
		
		resultPlaneNormal.add(crossProd.x*alfa, crossProd.y*alfa, crossProd.z*alfa);
	}
	resultPlaneNormal.unitary();
	
	return resultPlaneNormal;
};

Face.prototype.calculatePlaneNormal = function()
{
	// Note: face must be planar.***
	this.planeNormal = Face.calculatePlaneNormal(this.vertexArray, this.planeNormal);
	return this.planeNormal;
};

Face.prototype.calculateVerticesNormals = function(bForceRecalculatePlaneNormal)
{
	// This function calculates normals for concave faces.***
	// Provisionally calculate the plane normal and assign to the vertices.***
	var verticesCount = this.vertexArray.length;

	if (bForceRecalculatePlaneNormal !== undefined && bForceRecalculatePlaneNormal)
	{ this.calculatePlaneNormal(); }
	
	if (this.planeNormal === undefined)
	{ this.calculatePlaneNormal(); }
	
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

Face.prototype.solveUroborus = function()
{
	// "Uroborus" is an archaic motif of a snake biting its own tail.***
	// This function checks if the 1rst vertex & the last vertex are coincident. If are coincident then remove last one.***
	var verticesCount = this.getVerticesCount();
	if (verticesCount < 3)
	{ return; }
	
	var vertex_str = this.getVertex(0);
	var vertex_end = this.getVertex(verticesCount - 1);
	
	var pos_str = vertex_str.point3d;
	var pos_end = vertex_end.point3d;
	var distError = 0.0001; // 0.1mm of error.***
	
	if (pos_str.isCoincidentToPoint(pos_end, distError))
	{
		// remove the last vertex.***
		this.vertexArray.pop();
	}
};

Face.getBestFacePlaneToProject = function(normal)
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

Face.getProjectedPolygon2D = function(vertexArray, normal, resultProjectedPolygon2d)
{
	// Create a temp polygon2d.***
	if (resultProjectedPolygon2d === undefined)
	{ resultProjectedPolygon2d = new Polygon2D(); }
	
	if (resultProjectedPolygon2d.point2dList === undefined)
	{ resultProjectedPolygon2d.point2dList = new Point2DList(); }

	var point2dList = resultProjectedPolygon2d.point2dList;
	point2dList.pointsArray =  VertexList.getProjectedPoints2DArray(vertexArray, normal, point2dList.pointsArray);

	return resultProjectedPolygon2d;
};

Face.prototype.getTessellatedTriangles = function(resultTrianglesArray)
{
	if (resultTrianglesArray === undefined)
	{ resultTrianglesArray = []; }

	var verticesCount = this.getVerticesCount();
	if (verticesCount <= 3)
	{
		// This is a triangle, so no need to tessellate.***
		resultTrianglesArray = this.getTrianglesConvex(resultTrianglesArray);
		return resultTrianglesArray;
	}
	

	// 1rst, must project the face to a plane and process to tessellate in 2d.***
	var normal = this.getPlaneNormal();
	var bestPlaneToProject = Face.getBestFacePlaneToProject(normal);
	
	// Create a temp polygon2d.***
	var polygon2d = Face.getProjectedPolygon2D(this.vertexArray, normal, undefined);
	
	// Now, tessellate the polygon2D.***
	// Before tessellate, we must know if there are concavePoints.***
	var resultConcavePointsIdxArray;
	resultConcavePointsIdxArray = polygon2d.calculateNormal(resultConcavePointsIdxArray);
	
	var convexPolygonsArray = [];
	polygon2d.tessellate(resultConcavePointsIdxArray, convexPolygonsArray);
	
	// inside of "convexPolygonsArray" there are 1 or more convexPolygons result of tessellation of the polygon2d.***

	this.calculateVerticesNormals();
	var convexPolygonsCount = convexPolygonsArray.length;
	for (var i=0; i<convexPolygonsCount; i++)
	{
		var convexPolygon = convexPolygonsArray[i];
		
		var vertex0, vertex1, vertex2;
		var triangle;
		var point2d_0, point2d_1, point2d_2;
		var point2d_0 = convexPolygon.point2dList.getPoint(0);
		
		if (point2d_0 === undefined)
		{ var hola = 0; }
		
		vertex0 = point2d_0.ownerVertex3d;
		var point2dCount = convexPolygon.point2dList.getPointsCount();
		for (var j=1; j<point2dCount-1; j++)
		{
			point2d_1 = convexPolygon.point2dList.getPoint(j);
			point2d_2 = convexPolygon.point2dList.getPoint(j+1);
			vertex1 = point2d_1.ownerVertex3d;
			vertex2 = point2d_2.ownerVertex3d;
			triangle = new Triangle(vertex0, vertex1, vertex2);
			
			resultTrianglesArray.push(triangle);
		}
	}
	this.calculateVerticesNormals();
	return resultTrianglesArray;
};

Face.prototype.getTrianglesConvex = function(resultTrianglesArray)
{
	// To call this method, the face must be convex.***
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
		triangle = new Triangle(vertex0, vertex1, vertex2);
		resultTrianglesArray.push(triangle);
	}
	
	return resultTrianglesArray;
};

Face.prototype.setTwinHalfEdge = function(hedge)
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

Face.prototype.getFrontierHalfEdges = function(resultHedgesArray)
{
	var hedgesArray = this.getHalfEdgesLoop(undefined);
	if (hedgesArray === undefined)
	{ return resultHedgesArray; }
	
	if (resultHedgesArray === undefined)
	{ resultHedgesArray = []; }

	var hedgesCount = hedgesArray.length;
	var hedge;
	for (var i=0; i<hedgesCount; i++)
	{
		hedge = hedgesArray[i];
		if (hedge.isFrontier())
		{
			resultHedgesArray.push(hedge);
		}
	}
	return resultHedgesArray;
};

Face.prototype.getHalfEdgesLoop = function(resultHedgesArray)
{
	if (this.hEdge === undefined)
	{ return resultHedgesArray; }
	
	resultHedgesArray = HalfEdge.getHalfEdgesLoop(this.hEdge, resultHedgesArray);
	return resultHedgesArray;
};

Face.prototype.setTwinFace = function(face)
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

Face.prototype.createHalfEdges = function(resultHalfEdgesArray)
{
	if (this.vertexArray === undefined || this.vertexArray.length === 0)
	{ return resultHalfEdgesArray; }
	
	if (resultHalfEdgesArray === undefined)
	{ resultHalfEdgesArray = []; }
	
	var vertex;
	var hedge;
	var verticesCount = this.getVerticesCount();
	
	// 1rst, create the half edges.***
	for (var i=0; i<verticesCount; i++)
	{
		vertex = this.getVertex(i);
		hedge = new HalfEdge();
		hedge.setStartVertex(vertex);
		hedge.setFace(this);
		resultHalfEdgesArray.push(hedge);
	}
	
	// now, for all half edges, set the nextHalfEdge.***
	var nextHedge;
	var nextIdx;
	for (var i=0; i<verticesCount; i++)
	{
		hedge = resultHalfEdgesArray[i];
		nextIdx = VertexList.getNextIdx(i, this.vertexArray);
		nextHedge = resultHalfEdgesArray[nextIdx];
		hedge.setNext(nextHedge);
	}
	
	// set a hedge for this face.***
	this.hEdge = resultHalfEdgesArray[0];
	
	return resultHalfEdgesArray;
};




















































