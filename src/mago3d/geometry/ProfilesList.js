
'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class ProfilesList
 */
var ProfilesList = function() 
{
	if (!(this instanceof ProfilesList)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.profilesArray;
	this.auxiliarAxis;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
ProfilesList.prototype.newProfile = function() 
{
	if (this.profilesArray === undefined)
	{ this.profilesArray = []; }
	
	var profile = new Profile();
	this.profilesArray.push(profile);
	return profile;
};


/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
ProfilesList.prototype.deleteObjects = function() 
{
	if (this.profilesArray)
	{
		var profilesCount = this.profilesArray.length;
		for (var i=0; i<profilesCount; i++)
		{
			this.profilesArray[i].deleteObjects();
			this.profilesArray = undefined;
		}
		this.profilesArray = undefined;
	}
};

ProfilesList.prototype.extrude = function(profileReference, extrusionVector, extrusionDist, extrudeSegmentsCount) 
{
	if (this.profilesArray === undefined)
	{ this.profilesArray = []; }
	
	if (extrudeSegmentsCount === undefined)
	{ extrudeSegmentsCount = 1; }

	// 1rst, copy the profileReference to this first profile.
	var firstProfile = this.newProfile();
	firstProfile.copyFrom(profileReference);
	
	// now make the extrusion.
	var nextProfile;
	var nextOuter;
	var firstOuter = firstProfile.getOuter();
	var outerVertexCount;
	var nextVertex;
	var firstVertex;
	var currentSegExtDist;
	for (var i=0; i<extrudeSegmentsCount; i++)
	{
		nextProfile = this.newProfile();
		
		// outer vertex list.
		nextOuter = nextProfile.getOuter();
		currentSegExtDist = (extrusionDist/extrudeSegmentsCount)*(i+1);
		outerVertexCount = firstOuter.getVertexCount();
		for (var j=0; j<outerVertexCount; j++)
		{
			firstVertex = firstOuter.getVertex(j);
			nextVertex = nextOuter.newVertex();
			nextVertex.setPosition(firstVertex.point3d.x + extrusionVector.x * currentSegExtDist, firstVertex.point3d.y + extrusionVector.y * currentSegExtDist, firstVertex.point3d.z + extrusionVector.z * currentSegExtDist);
		}
		
		// inner vertices list.
		if (firstProfile.inners && firstProfile.inners.length > 0)
		{
			// todo:
		}
	}
	
};

ProfilesList.prototype.getMesh = function(resultMesh) 
{
	// a mesh made by a bottomCap + lateralSides + topCap.
	
	// provisionally get only lateral side surface.
	
};


























