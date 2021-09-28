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
var VtxProfilesList_ = function(x, y) 
{
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

VtxProfilesList_.prototype.newVtxProfile = function()
{
	if (this.vtxProfilesArray === undefined) 
	{ 
		this.vtxProfilesArray = []; 
	}
	
	var vtxProfile = new VtxProfile_();
	this.vtxProfilesArray.push(vtxProfile);
	return vtxProfile;
};

VtxProfilesList_.prototype.getVtxProfilesCount = function()
{
	if (this.vtxProfilesArray === undefined)
	{ return 0; }
	
	return this.vtxProfilesArray.length;
};

/**
 * 인덱스에 해당하는 vtxProfile 반환
 * @returns {VtxProfile}
 */
VtxProfilesList_.prototype.getVtxProfile = function(idx)
{
	if (this.vtxProfilesArray === undefined)
	{ return undefined; }
	
	return this.vtxProfilesArray[idx];
};

VtxProfilesList_.prototype.getAllVertices = function(resultVerticesArray)
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

VtxProfilesList_.getLateralFaces = function(bottomVtxRing, topVtxRing, resultFacesArray, resultMesh, elemIndexRange)
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
	var error = 1E-6;
	while (currIdx !== elemIndexRange.endIdx)
	{
		nextIdx = bottomVtxRing.vertexList.getNextIdx(currIdx);
		
		face = new Face_();
		resultFacesArray.push(face);
		face.vertexArray = [];
		
		vtx0 = bottomVtxRing.vertexList.getVertex(currIdx);
		vtx1 = bottomVtxRing.vertexList.getVertex(nextIdx);
		vtx2 = topVtxRing.vertexList.getVertex(nextIdx);
		vtx3 = topVtxRing.vertexList.getVertex(currIdx);

		// Here, must check if any adjacent vertices are coincidents.
		face.vertexArray = VertexList_.eliminateCoincidentVerticesOfArray([vtx0, vtx1, vtx2, vtx3], face.vertexArray, error);
		
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

VtxProfilesList_.prototype.getMesh = function (resultMesh, bIncludeBottomCap, bIncludeTopCap, bLoop) 
{
	// face's vertex order.
	// 3-------2
	// |       |
	// |       |
	// 0-------1
	
	if (this.vtxProfilesArray === undefined)
	{ return resultMesh; }

	if (bLoop === undefined)
	{ bLoop = false; }
	
	if (bLoop === true)
	{
		// To make a safe mesh, if loop, then there are no caps in the extrems.
		bIncludeBottomCap = false;
		bIncludeTopCap = false;
	}
	
	if (resultMesh === undefined)
	{ resultMesh = new Mesh_(); }

	if (resultMesh.vertexList === undefined)
	{ resultMesh.vertexList = new VertexList_(); }
	
	var options = {};

	// outerLateral.
	var vtxProfilesCount = this.getVtxProfilesCount();
	if (vtxProfilesCount < 2)
	{ 
		// Only exist 1 vtxProfile, so, create a surfaceMesh.
		options.name = "surface";
		topVtxProfile = this.getVtxProfile(0);
		resultSurface = resultMesh.newSurface(options);
		resultSurface = VtxProfilesList_.getTransversalSurface(topVtxProfile, this.convexFacesIndicesData, resultSurface);
		return resultMesh; // process finished.***
	}
	
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
			facesArray = VtxProfilesList_.getLateralFaces(bottomVtxRing, topVtxRing, facesArray, resultMesh, elemIndexRange);
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
				facesArray = VtxProfilesList_.getLateralFaces(bottomVtxRing, topVtxRing, facesArray, resultMesh, elemIndexRange);
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
		this.convexFacesIndicesData = vtxProfileFirst.calculateConvexFacesIndicesData(this.convexFacesIndicesData);
	}
	
	var resultSurface;
	
	// Top profile.**
	// in this case, there are a surface with multiple convex faces.
	if (bIncludeTopCap === undefined || bIncludeTopCap === true)
	{
		options.name = "top";
		topVtxProfile = this.getVtxProfile(vtxProfilesCount-1);
		resultSurface = resultMesh.newSurface(options);
		resultSurface = VtxProfilesList_.getTransversalSurface(topVtxProfile, this.convexFacesIndicesData, resultSurface);
	}

	// Bottom profile.**
	if (bIncludeBottomCap === undefined || bIncludeBottomCap === true)
	{
		options.name = "bottom";
		bottomVtxProfile = this.getVtxProfile(0);
		resultSurface = resultMesh.newSurface(options);
		resultSurface = VtxProfilesList_.getTransversalSurface(bottomVtxProfile, this.convexFacesIndicesData, resultSurface);
		
		// in bottomSurface inverse sense of faces.
		resultSurface.reverseSense();
	}

	return resultMesh;
};

VtxProfilesList_.getTransversalSurface = function(vtxProfile, convexFacesIndicesData, resultSurface)
{
	if (resultSurface === undefined) 
	{ 
		resultSurface = new Surface_(); 
	}

	if (convexFacesIndicesData === undefined) 
	{ 
		// Calculate the convexFacesIndicesData.
		var profile2d = vtxProfile.getProjectedProfile2D(undefined);
		convexFacesIndicesData = profile2d.getConvexFacesIndicesData(convexFacesIndicesData);
	}

	//************************************************************************************************
	// TODO: must create halfEdges of faces and add into "hedgesList" = resultMesh.getHalfEdgesList();
	// this is necessary in the future when develop boolean operations between meshes.***
	//************************************************************************************************
	 
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
			var hedgesArray = [];
			face.createHalfEdges(hedgesArray);
		}

		// TODO: set twin between faces.***
	}
	
	return resultSurface;
};