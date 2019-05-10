'use strict';
/**
* 어떤 일을 하고 있습니까?
* @class VtxProfilesList
*/
var VtxProfilesList = function(x, y) 
{
	if (!(this instanceof VtxProfilesList)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.vtxProfilesArray;
	this.convexFacesIndicesData;
};

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

VtxProfilesList.getLateralFaces = function(bottomVtxRing, topVtxRing, resultFacesArray, resultMesh, elemIndexRange)
{
	// This returns a lateral surface between "bottomVtxRing" & "topVtxRing" limited by "elemIndexRange".***
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
		
		// now create hedges of the face.***
		hedgesArray.length = 0;
		hedgesArray = face.createHalfEdges(hedgesArray);
		hedgesList.addHalfEdgesArray(hedgesArray);
		
		if (prevFace !== undefined)
		{
			// set twins between face and prevFace.***
			face.setTwinFace(prevFace);
		}
		prevFace = face;

		currIdx = nextIdx;
	}
	
	return resultFacesArray;
};

VtxProfilesList.prototype.addVtxProfile = function(vtxProfile)
{
	if (this.vtxProfilesArray === undefined)
	{ this.vtxProfilesArray = []; }
	
	this.vtxProfilesArray.push(vtxProfile);
};

VtxProfilesList.prototype.newVtxProfile = function()
{
	if (this.vtxProfilesArray === undefined)
	{ this.vtxProfilesArray = []; }
	
	var vtxProfile = new VtxProfile();
	this.vtxProfilesArray.push(vtxProfile);
	return vtxProfile;
};

VtxProfilesList.prototype.getVtxProfilesCount = function()
{
	if (this.vtxProfilesArray === undefined)
	{ return 0; }
	
	return this.vtxProfilesArray.length;
};

VtxProfilesList.prototype.getVtxProfile = function(idx)
{
	if (this.vtxProfilesArray === undefined)
	{ return undefined; }
	
	return this.vtxProfilesArray[idx];
};

VtxProfilesList.prototype.getAllVertices = function(resultVerticesArray)
{
	// collect all vertices of all vtxProfiles.***
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

VtxProfilesList.prototype.getMesh = function(resultMesh, bIncludeBottomCap, bIncludeTopCap, bLoop)
{
	// face's vertex order.***
	// 3-------2
	// |       |
	// |       |
	// |       |
	// 0-------1
	
	if (this.vtxProfilesArray === undefined)
	{ return resultTriangleMatrix; }

	if (bLoop === undefined)
	{ bLoop = false; }
	
	if (bLoop === true)
	{
		// To make a safe mesh, if loop, then there are no caps in the extrems.***
		bIncludeBottomCap = false;
		bIncludeTopCap = false;
	}
	
	// outerLateral.***************************************************
	var vtxProfilesCount = this.getVtxProfilesCount();
	
	if (vtxProfilesCount < 2)
	{ return resultTriangleMatrix; }
	
	if (resultMesh === undefined)
	{ resultMesh = new Mesh(); }
	
	if (resultMesh.vertexList === undefined)
	{ resultMesh.vertexList = new VertexList(); }
	
	// 1rst, get all vertices and put it into the resultMesh.***
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
	
	for (var i=0; i<elemsCount; i++)
	{
		surface = resultMesh.newSurface();
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
				// set twins between "prevFacesArray" & "facesArray".***
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
	
	// Inner laterals.************************************************************************
	var innerVtxRing;
	var innerRinsCount = bottomVtxProfile.getInnerVtxRingsCount();
	for (var k=0; k<innerRinsCount; k++)
	{
		innerVtxRing = bottomVtxProfile.getInnerVtxRing(k);
		elemsCount = innerVtxRing.elemsIndexRangesArray.length;
		for (var i=0; i<elemsCount; i++)
		{
			surface = resultMesh.newSurface();
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
					// set twins between "prevFacesArray" & "facesArray".***
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
	
	// Caps (bottom and top).***
	if (this.convexFacesIndicesData === undefined)
	{ 
		// Calculate the convexFacesIndicesData.***
		var vtxProfileFirst = this.getVtxProfile(0);
		var profile2d = vtxProfileFirst.getProjectedProfile2D(profile2d);
		this.convexFacesIndicesData = profile2d.getConvexFacesIndicesData(this.convexFacesIndicesData);
	}
	
	var resultSurface;
	
	// Top profile.***********************************************************************
	// in this case, there are a surface with multiple convex faces.***
	if (bIncludeTopCap === undefined || bIncludeTopCap === true)
	{
		topVtxProfile = this.getVtxProfile(vtxProfilesCount-1);
		resultSurface = resultMesh.newSurface();
		resultSurface = VtxProfilesList.getTransversalSurface(topVtxProfile, this.convexFacesIndicesData, resultSurface);
	}

	// Bottom profile.***********************************************************************
	if (bIncludeBottomCap === undefined || bIncludeBottomCap === true)
	{
		bottomVtxProfile = this.getVtxProfile(0);
		resultSurface = resultMesh.newSurface();
		resultSurface = VtxProfilesList.getTransversalSurface(bottomVtxProfile, this.convexFacesIndicesData, resultSurface);
		
		// in bottomSurface inverse sense of faces.***
		resultSurface.reverseSense();
	}
	
	return resultMesh;
};

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
				// is the outerRing.***
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
 * @method VtxProfilesList.makeLoft
 * @param {Profile2D} profile2d
 * @param {Points3DList} pathPoints3dList
 * @param {boolean} bLoop
 * @returns none
 * @description 설명
 * @example
 * ` ``js
 * 
 * ` ``
 */
VtxProfilesList.prototype.makeLoft = function(profile2d, pathPoints3dList, bLoop)
{
	// 1rst, make the base vtxProfile.***
	// if want caps in the extruded mesh, must calculate "ConvexFacesIndicesData" of the profile2d before creating vtxProfiles.***
	this.convexFacesIndicesData = profile2d.getConvexFacesIndicesData(undefined);
	
	// create vtxProfiles.***
	// make the base-vtxProfile.***
	var baseVtxProfile = new VtxProfile();
	baseVtxProfile.makeByProfile2D(profile2d);
	
	// Now, transform the baseVtxProfile to coplanar into the 1rstPlane.***
	if (bLoop === undefined) { bLoop = false; } // Is important to set "bLoop" = false to obtain a perpendicular plane respect to the segment.***
	var bisectionPlane1rst = pathPoints3dList.getBisectionPlane(0, undefined, bLoop);
	var point3d1rst = pathPoints3dList.getPoint(0);
	var tMatrix = bisectionPlane1rst.getRotationMatrix(undefined);
	tMatrix.setTranslation(point3d1rst.x, point3d1rst.y, point3d1rst.z);
	
	// Now rotate&translate vtxProfile onto the bisectionPlane1rst.***
	baseVtxProfile.transformPointsByMatrix4(tMatrix);
	
	// Now, project the vtxProfile onto the bisectionPlanes of each vertex.***
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
		// finally update the baseVtxProfile.***
		baseVtxProfile = projectedVtxProfile;
	}
};
























































