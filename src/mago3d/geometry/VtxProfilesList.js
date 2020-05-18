'use strict';
/**
* Vertex Profile List
* @exception {Error} Messages.CONSTRUCT_ERROR
*
* @class VtxProfilesList
* @constructor
* @param {number} x not used
* @param {number} y not used
*
* @see VtxProfile
*/
var VtxProfilesList = function(x, y) 
{
	if (!(this instanceof VtxProfilesList)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	/**
	 * VtxProfile Array
	 * @type {Array.<VtxProfile>}
	 */
	this.vtxProfilesArray;

	
	/**
	 * convex index data array
	 * @type {Array.<Array.<IndexData>>}
	 */
	this.convexFacesIndicesData;
};


/**
 * delete vertex profile and convex array.
 */
VtxProfilesList.prototype.deleteObjects = function()
{
	if (this.vtxProfilesArray !== undefined)
	{
		var vtxProfilesCount = this.vtxProfilesArray.length;
		for (var i=0; i<vtxProfilesCount; i++)
		{
			this.vtxProfilesArray[i].deleteObjects();
			this.vtxProfilesArray[i] = undefined;
		}
		this.vtxProfilesArray = undefined;
	}
	
	if (this.convexFacesIndicesData !== undefined)
	{
		/*
		var idxDatasCount = this.convexFacesIndicesData.length;
		for(var i=0; i<idxDatasCount; i++)
		{
			for(var key in this.convexFacesIndicesData[i])
			{
				var value = this.convexFacesIndicesData[i][key];
				value.deleteObjects();
				value = undefined;
			}
			this.convexFacesIndicesData[i] = undefined;
		}
		*/
		this.convexFacesIndicesData = undefined;
	}
};

/**
 * 페이스 목록 생성 및 반환. 메쉬의 hedgelist 업데이트
 * 
 * @static
 * @param {VtxRing} bottomVtxRing
 * @param {VtxRing} topVtxRing
 * @param {Array.<Face>} resultFacesArray
 * @param {Mesh} resultMesh
 * @param {IndexRange} elemIndexRange
 * 
 * @see VtxProfilesList#getMesh
 * @see Mesh#getHalfEdgesList
 * @see Face#createHalfEdges
 * @see Face#setTwinFace
 * @see HalfEdgesList#addHalfEdgesArray
 */
VtxProfilesList.getLateralFaces = function(bottomVtxRing, topVtxRing, resultFacesArray, resultMesh, elemIndexRange)
{
	// This returns a lateral surface between "bottomVtxRing" & "topVtxRing" limited by "elemIndexRange".
	if (resultFacesArray === undefined)
	{ resultFacesArray = []; }
	
	var hedgesList = resultMesh.getHalfEdgesList();
	
	var strIdx, currIdx, endIdx, nextIdx;
	var vtx0, vtx1, vtx2, vtx3;
	var face, prevFace;
	var hedgesArray = [];
	currIdx = elemIndexRange.strIdx;
	while (currIdx !== elemIndexRange.endIdx)
	{
		nextIdx = bottomVtxRing.vertexList.getNextIdx(currIdx);
		
		face = new Face();
		resultFacesArray.push(face);
		face.vertexArray = [];
		
		vtx0 = bottomVtxRing.vertexList.getVertex(currIdx);
		vtx1 = bottomVtxRing.vertexList.getVertex(nextIdx);
		vtx2 = topVtxRing.vertexList.getVertex(nextIdx);
		vtx3 = topVtxRing.vertexList.getVertex(currIdx);
		Array.prototype.push.apply(face.vertexArray, [vtx0, vtx1, vtx2, vtx3]);
		
		// now create hedges of the face.
		hedgesArray.length = 0;
		hedgesArray = face.createHalfEdges(hedgesArray);
		hedgesList.addHalfEdgesArray(hedgesArray);
		
		if (prevFace !== undefined)
		{
			// set twins between face and prevFace.
			face.setTwinFace(prevFace);
		}
		prevFace = face;

		currIdx = nextIdx;
	}
	
	return resultFacesArray;
};

/**
 * VtxProfile 추가
 * @param {VtxProfile} vtxProfile
 */
VtxProfilesList.prototype.addVtxProfile = function(vtxProfile)
{
	if (this.vtxProfilesArray === undefined)
	{ this.vtxProfilesArray = []; }
	
	this.vtxProfilesArray.push(vtxProfile);
};

/**
 * VtxProfile 생성하여 vtxProfileArray에 추가 후 반환.
 * @returns {VtxProfile} vtxProfile
 */
VtxProfilesList.prototype.newVtxProfile = function()
{
	if (this.vtxProfilesArray === undefined)
	{ this.vtxProfilesArray = []; }
	
	var vtxProfile = new VtxProfile();
	this.vtxProfilesArray.push(vtxProfile);
	return vtxProfile;
};

/**
 * vtxProfileArray length 반환.
 * @returns {Number}
 */
VtxProfilesList.prototype.getVtxProfilesCount = function()
{
	if (this.vtxProfilesArray === undefined)
	{ return 0; }
	
	return this.vtxProfilesArray.length;
};

/**
 * 인덱스에 해당하는 vtxProfile 반환
 * @returns {VtxProfile}
 */
VtxProfilesList.prototype.getVtxProfile = function(idx)
{
	if (this.vtxProfilesArray === undefined)
	{ return undefined; }
	
	return this.vtxProfilesArray[idx];
};

/**
 * vtxProfileArray에 있는 모든 vertex를 배열에 담아 반환
 * @param {Array.<Vertex>|undefined} resultVerticesArray 비어있을 시 배열 초기화.
 * @returns {Array.<Vertex>}
 */
VtxProfilesList.prototype.getAllVertices = function(resultVerticesArray)
{
	// collect all vertices of all vtxProfiles.
	if (resultVerticesArray === undefined)
	{ resultVerticesArray = []; }
	
	var vtxProfile;
	var vtxProfilesCount = this.getVtxProfilesCount();
	for (var i=0; i<vtxProfilesCount; i++)
	{
		vtxProfile = this.getVtxProfile(i);
		resultVerticesArray = vtxProfile.getAllVertices(resultVerticesArray);
	}
	
	return resultVerticesArray;
};

/**
 * vtxProfileList로 부터 Mesh 생성 후 반환
 * @param {Mesh} resultMesh 비어있을 시 new Mesh 인스턴스 선언.
 * @param {Boolean} bIncludeBottomCap Mesh의 바닥 surface 추가 유무, true 일시 getTransversalSurface
 * @param {Boolean} bIncludeTopCap Mesh의 위쪽(뚜껑) surface 추가 유무, true 일시 getTransversalSurface
 * @param {Boolean} bLoop 기본값은 false. true로 선언 시, bIncludeBottomCap, bIncludeTopCap 는 false로 변경
 * @returns {Mesh}
 * 
 * @see VtxProfilesList#getTransversalSurface
 */
VtxProfilesList.prototype.getMesh = function(resultMesh, bIncludeBottomCap, bIncludeTopCap, bLoop)
{
	// face's vertex order.
	// 3-------2
	// |       |
	// |       |
	// 0-------1
	
	if (this.vtxProfilesArray === undefined)
	{ return resultTriangleMatrix; }

	if (bLoop === undefined)
	{ bLoop = false; }
	
	if (bLoop === true)
	{
		// To make a safe mesh, if loop, then there are no caps in the extrems.
		bIncludeBottomCap = false;
		bIncludeTopCap = false;
	}
	
	
	// outerLateral.
	var vtxProfilesCount = this.getVtxProfilesCount();
	
	if (vtxProfilesCount < 2)
	{ return resultTriangleMatrix; }
	
	if (resultMesh === undefined)
	{ resultMesh = new Mesh(); }
	
	if (resultMesh.vertexList === undefined)
	{ resultMesh.vertexList = new VertexList(); }
	
	// 1rst, get all vertices and put it into the resultMesh.
	resultMesh.vertexList.vertexArray = this.getAllVertices(resultMesh.vertexList.vertexArray);
		
	var bottomVtxProfile, topVtxProfile;

	bottomVtxProfile = this.getVtxProfile(0);
	var outerVtxRing = bottomVtxProfile.outerVtxRing;
	var elemIndexRange;
	var bottomVtxRing, topVtxRing;
	var elemIndicesCount;
	var strIdx, currIdx, endIdx, nextIdx;
	var vtx0, vtx1, vtx2, vtx3;
	var face, surface;
	var k;
	var facesArray = [];
	var prevFacesArray;
	var elemsCount = outerVtxRing.elemsIndexRangesArray.length;
	var options = {};
	options.name = "outerLateral";
	for (var i=0; i<elemsCount; i++)
	{
		surface = resultMesh.newSurface(options);
		prevFacesArray = undefined;
		elemIndexRange = outerVtxRing.getElementIndexRange(i);
		for (var j=0; j<vtxProfilesCount; j++)
		{
			if (j === vtxProfilesCount-1 )
			{
				if (bLoop)
				{
					bottomVtxProfile = this.getVtxProfile(j);
					topVtxProfile = this.getVtxProfile(0);
				}
				else { break; }
			}
			else 
			{
				bottomVtxProfile = this.getVtxProfile(j);
				topVtxProfile = this.getVtxProfile(j+1);
			}
			
			bottomVtxRing = bottomVtxProfile.outerVtxRing;
			topVtxRing = topVtxProfile.outerVtxRing;
			
			facesArray.length = 0;
			facesArray = VtxProfilesList.getLateralFaces(bottomVtxRing, topVtxRing, facesArray, resultMesh, elemIndexRange);
			surface.addFacesArray(facesArray);
			
			if (prevFacesArray !== undefined && prevFacesArray.length > 0)
			{
				// set twins between "prevFacesArray" & "facesArray".
				var currFace, prevFace;
				var facesCount = facesArray.length;
				for (var k=0; k<facesCount; k++)
				{
					currFace = facesArray[k];
					prevFace = prevFacesArray[k];
					currFace.setTwinFace(prevFace);
				}
			}
			
			prevFacesArray = [];
			Array.prototype.push.apply(prevFacesArray, facesArray);
		}
	}
	
	// Inner laterals.
	options.name = "innerLateral";
	var innerVtxRing;
	var innerRinsCount = bottomVtxProfile.getInnerVtxRingsCount();
	for (var k=0; k<innerRinsCount; k++)
	{
		innerVtxRing = bottomVtxProfile.getInnerVtxRing(k);
		elemsCount = innerVtxRing.elemsIndexRangesArray.length;
		for (var i=0; i<elemsCount; i++)
		{
			surface = resultMesh.newSurface(options);
			prevFacesArray = undefined;
			elemIndexRange = innerVtxRing.getElementIndexRange(i);
			for (var j=0; j<vtxProfilesCount; j++)
			{
				if (j === vtxProfilesCount-1 )
				{
					if (bLoop)
					{
						bottomVtxProfile = this.getVtxProfile(j);
						topVtxProfile = this.getVtxProfile(0);
					}
					else { break; }
				}
				else 
				{
					bottomVtxProfile = this.getVtxProfile(j);
					topVtxProfile = this.getVtxProfile(j+1);
				}

				bottomVtxRing = bottomVtxProfile.getInnerVtxRing(k);
				topVtxRing = topVtxProfile.getInnerVtxRing(k);
				
				facesArray.length = 0;
				facesArray = VtxProfilesList.getLateralFaces(bottomVtxRing, topVtxRing, facesArray, resultMesh, elemIndexRange);
				surface.addFacesArray(facesArray);
				
				if (prevFacesArray !== undefined && prevFacesArray.length>0)
				{
					// set twins between "prevFacesArray" & "facesArray".
					var currFace, prevFace;
					var facesCount = facesArray.length;
					for (var a=0; a<facesCount; a++)
					{
						currFace = facesArray[a];
						prevFace = prevFacesArray[a];
						currFace.setTwinFace(prevFace);
					}
				}
				
				prevFacesArray = [];
				Array.prototype.push.apply(prevFacesArray, facesArray);
				
			}
		}
	}
	
	// Caps (bottom and top).
	if (this.convexFacesIndicesData === undefined)
	{ 
		// Calculate the convexFacesIndicesData.
		var vtxProfileFirst = this.getVtxProfile(0);
		var profile2d = vtxProfileFirst.getProjectedProfile2D(profile2d);
		this.convexFacesIndicesData = profile2d.getConvexFacesIndicesData(this.convexFacesIndicesData);
	}
	
	var resultSurface;
	
	// Top profile.**
	// in this case, there are a surface with multiple convex faces.
	if (bIncludeTopCap === undefined || bIncludeTopCap === true)
	{
		options.name = "top";
		topVtxProfile = this.getVtxProfile(vtxProfilesCount-1);
		resultSurface = resultMesh.newSurface(options);
		resultSurface = VtxProfilesList.getTransversalSurface(topVtxProfile, this.convexFacesIndicesData, resultSurface);
	}

	// Bottom profile.**
	if (bIncludeBottomCap === undefined || bIncludeBottomCap === true)
	{
		options.name = "bottom";
		bottomVtxProfile = this.getVtxProfile(0);
		resultSurface = resultMesh.newSurface(options);
		resultSurface = VtxProfilesList.getTransversalSurface(bottomVtxProfile, this.convexFacesIndicesData, resultSurface);
		
		// in bottomSurface inverse sense of faces.
		resultSurface.reverseSense();
	}

	return resultMesh;
};

/**
 * 위쪽이나 아랫쪽 surface 생성.
 * @static
 * @param {VtxProfile} vtxProfile
 * @param {Array.<IndexData>} convexFacesIndicesData
 * @param {Surface} resultSurface 비어있을 시 Surface 인스턴스 선언.
 * @returns {Surface}
 */
VtxProfilesList.getTransversalSurface = function(vtxProfile, convexFacesIndicesData, resultSurface)
{
	if (resultSurface === undefined)
	{ resultSurface = new Surface(); }
	 
	var currRing;
	var currVtxRing;
	var faceIndicesData;
	var indexData;
	var ringIdx, vertexIdx;
	var indicesCount;
	var face;
	var vertex;
	var convexFacesCount = convexFacesIndicesData.length;
	for (var i=0; i<convexFacesCount; i++)
	{
		face = resultSurface.newFace();
		face.vertexArray = [];
			
		faceIndicesData = convexFacesIndicesData[i];
		indicesCount = faceIndicesData.length;
		for (var j=0; j<indicesCount; j++)
		{
			indexData = faceIndicesData[j];
			ringIdx = indexData.ownerIdx;
			vertexIdx = indexData.idxInList;
			
			if (ringIdx === -1)
			{
				// is the outerRing.
				currVtxRing = vtxProfile.outerVtxRing;
			}
			else 
			{
				currVtxRing = vtxProfile.innerVtxRingsList.getVtxRing(ringIdx);
			}
			
			vertex = currVtxRing.vertexList.getVertex(vertexIdx);
			face.vertexArray.push(vertex);
		}
	}
	
	return resultSurface;
};

/**
 * profile2d와 경로 point3d 리스트를 이용하여 vtxProfile 생성 후 vtxProfilesArray에 추가
 * @method VtxProfilesList.makeLoft
 * @param {Profile2D} profile2d
 * @param {Points3DList} pathPoints3dList
 * @param {Boolean} bLoop 기본값은 false.
 * 
 * @see Point3DList#getBisectionPlane
 * @see Point3DList#getSegment3D
 */
VtxProfilesList.prototype.makeLoft = function(profile2d, pathPoints3dList, bLoop)
{
	// 1rst, make the base vtxProfile.
	// if want caps in the extruded mesh, must calculate "ConvexFacesIndicesData" of the profile2d before creating vtxProfiles.
	this.convexFacesIndicesData = profile2d.getConvexFacesIndicesData(undefined);
	
	// create vtxProfiles.
	// make the base-vtxProfile.
	var baseVtxProfile = new VtxProfile();
	baseVtxProfile.makeByProfile2D(profile2d);
	
	// Now, transform the baseVtxProfile to coplanar into the 1rstPlane.
	if (bLoop === undefined) { bLoop = false; } // Is important to set "bLoop" = false to obtain a perpendicular plane respect to the segment.
	var bisectionPlane1rst = pathPoints3dList.getBisectionPlane(0, undefined, bLoop);
	var point3d1rst = pathPoints3dList.getPoint(0);
	var tMatrix = bisectionPlane1rst.getRotationMatrix(undefined);
	tMatrix.setTranslation(point3d1rst.x, point3d1rst.y, point3d1rst.z);
	
	// Now rotate&translate vtxProfile onto the bisectionPlane1rst.
	baseVtxProfile.transformPointsByMatrix4(tMatrix);
	
	// Now, project the vtxProfile onto the bisectionPlanes of each vertex.
	var pathPoint3d;
	var bisectionPlane;
	var segment3d;
	var projectionDirection;
	var pathPointsCount = pathPoints3dList.getPointsCount();
	for (var i=0; i<pathPointsCount; i++)
	{
		pathPoint3d = pathPoints3dList.getPoint(i);
		bisectionPlane = pathPoints3dList.getBisectionPlane(i, undefined, bLoop);
		if (i === 0)
		{
			segment3d = pathPoints3dList.getSegment3D(i, undefined, bLoop);
		}
		else
		{ segment3d = pathPoints3dList.getSegment3D(i-1, undefined, bLoop); }
		
		projectionDirection = segment3d.getDirection(undefined);
		
		var projectedVtxProfile = VtxProfile.getProjectedOntoPlane(baseVtxProfile, bisectionPlane, projectionDirection, undefined);
		this.addVtxProfile(projectedVtxProfile);
		// finally update the baseVtxProfile.
		baseVtxProfile = projectedVtxProfile;
	}
};
























































