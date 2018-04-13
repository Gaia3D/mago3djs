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

VtxProfilesList.getLateralSurface = function(bottomVtxRing, topVtxRing, resultSurface, elemIndexRange)
{
	// This returns a lateral surface between "bottomVtxRing" & "topVtxRing" limited by "elemIndexRange".***
	if(resultSurface === undefined)
		resultSurface = new Surface();
	
	var strIdx, currIdx, endIdx, nextIdx;
	var vtx0, vtx1, vtx2, vtx3;
	var face;
	currIdx = elemIndexRange.strIdx;
	while(currIdx !== elemIndexRange.endIdx)
	{
		nextIdx = bottomVtxRing.vertexList.getNextIdx(currIdx);
		face = resultSurface.newFace();
		face.vertexArray = [];
		
		vtx0 = bottomVtxRing.vertexList.getVertex(currIdx);
		vtx1 = bottomVtxRing.vertexList.getVertex(nextIdx);
		vtx2 = topVtxRing.vertexList.getVertex(nextIdx);
		vtx3 = topVtxRing.vertexList.getVertex(currIdx);
		Array.prototype.push.apply(face.vertexArray, [vtx0, vtx1, vtx2, vtx3]);

		currIdx = nextIdx;
	}
	
	return resultSurface;
};

VtxProfilesList.prototype.newVtxProfile = function()
{
	if(this.vtxProfilesArray === undefined)
		this.vtxProfilesArray = [];
	
	var vtxProfile = new VtxProfile();
	this.vtxProfilesArray.push(vtxProfile);
	return vtxProfile;
};

VtxProfilesList.prototype.getVtxProfilesCount = function()
{
	if(this.vtxProfilesArray === undefined)
		return 0;
	
	return this.vtxProfilesArray.length;
};

VtxProfilesList.prototype.getVtxProfile = function(idx)
{
	if(this.vtxProfilesArray === undefined)
		return undefined;
	
	return this.vtxProfilesArray[idx];
};

VtxProfilesList.prototype.getAllVertices = function(resultVerticesArray)
{
	// collect all vertices of all vtxProfiles.***
	if(resultVerticesArray === undefined)
		resultVerticesArray = [];
	
	var vtxProfile;
	var vtxProfilesCount = this.getVtxProfilesCount();
	for(var i=0; i<vtxProfilesCount; i++)
	{
		vtxProfile = this.getVtxProfile(i);
		resultVerticesArray = vtxProfile.getAllVertices(resultVerticesArray);
	}
	
	return resultVerticesArray;
};

VtxProfilesList.prototype.getMesh = function(resultMesh, bIncludeBottomCap, bIncludeTopCap)
{
	// face's vertex order.***
	// 3-------2
	// |       |
	// |       |
	// |       |
	// 0-------1
	
	if(this.vtxProfilesArray === undefined)
		return resultTriangleMatrix;
	
	// outerLateral.***************************************************
	var vtxProfilesCount = this.getVtxProfilesCount();
	
	if(vtxProfilesCount < 2)
		return resultTriangleMatrix;
	
	if(resultMesh === undefined)
		resultMesh = new Mesh();
	
	if(resultMesh.vertexList === undefined)
		resultMesh.vertexList = new VertexList();
	
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
	var elemsCount = outerVtxRing.elemsIndexRangesArray.length;
	
	for(var i=0; i<elemsCount; i++)
	{
		surface = resultMesh.newSurface();
		elemIndexRange = outerVtxRing.getElementIndexRange(i);
		for(var j=0; j<vtxProfilesCount-1; j++)
		{
			bottomVtxProfile = this.getVtxProfile(j);
			topVtxProfile = this.getVtxProfile(j+1);
			
			bottomVtxRing = bottomVtxProfile.outerVtxRing;
			topVtxRing = topVtxProfile.outerVtxRing;
			
			surface = VtxProfilesList.getLateralSurface(bottomVtxRing, topVtxRing, surface, elemIndexRange);
		}
	}
	
	// Inner laterals.************************************************************************
	var innerVtxRing;
	var innerRinsCount = bottomVtxProfile.getInnerVtxRingsCount();
	for(var k=0; k<innerRinsCount; k++)
	{
		innerVtxRing = bottomVtxProfile.getInnerVtxRing(k);
		elemsCount = innerVtxRing.elemsIndexRangesArray.length;
		for(var i=0; i<elemsCount; i++)
		{
			surface = resultMesh.newSurface();
			elemIndexRange = innerVtxRing.getElementIndexRange(i);
			for(var j=0; j<vtxProfilesCount-1; j++)
			{
				bottomVtxProfile = this.getVtxProfile(j);
				topVtxProfile = this.getVtxProfile(j+1);
				
				bottomVtxRing = bottomVtxProfile.getInnerVtxRing(k);
				topVtxRing = topVtxProfile.getInnerVtxRing(k);
				
				surface = VtxProfilesList.getLateralSurface(bottomVtxRing, topVtxRing, surface, elemIndexRange);
			}
		}
	}
	
	// Caps (bottom and top).***
	if(this.convexFacesIndicesData === undefined)
		return resultMesh;
	
	var resultSurface;
	
	// Top profile.***********************************************************************
	// in this case, there are a surface with multiple convex faces.***
	if(bIncludeTopCap === undefined || bIncludeTopCap === true)
	{
		topVtxProfile = this.getVtxProfile(vtxProfilesCount-1);
		resultSurface = resultMesh.newSurface();
		resultSurface = VtxProfilesList.getTransversalSurface(topVtxProfile, this.convexFacesIndicesData, resultSurface);
	}

	// Bottom profile.***********************************************************************
	if(bIncludeBottomCap === undefined || bIncludeBottomCap === true)
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
	if(resultSurface === undefined)
		resultSurface = new Surface();
	 
	var currRing;
	var currVtxRing;
	var faceIndicesData;
	var indexData;
	var ringIdx, vertexIdx;
	var indicesCount;
	var face;
	var vertex;
	var convexFacesCount = convexFacesIndicesData.length;
	for(var i=0; i<convexFacesCount; i++)
	{
		face = resultSurface.newFace();
		face.vertexArray = [];
			
		faceIndicesData = convexFacesIndicesData[i];
		indicesCount = faceIndicesData.length;
		for(var j=0; j<indicesCount; j++)
		{
			indexData = faceIndicesData[j];
			ringIdx = indexData.ownerIdx;
			vertexIdx = indexData.idxInList;
			
			if(ringIdx === -1)
			{
				// is the outerRing.***
				currVtxRing = vtxProfile.outerVtxRing;
			}
			else{
				currVtxRing = vtxProfile.innerVtxRingsList.getVtxRing(ringIdx);
			}
			
			vertex = currVtxRing.vertexList.getVertex(vertexIdx);
			face.vertexArray.push(vertex);
		}
	}
	
	return resultSurface;
};























































