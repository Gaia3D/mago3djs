
'use strict';


/**
 * 어떤 일을 하고 있습니까?
 * @class Tunnel
 */
var Tunnel = function() 
{
	if (!(this instanceof Tunnel)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	// This is a loft object, so need a path & a profile.***
	
	this.geoCoordsListPath; // class : GeographicCoordsList.***
	this.geoCoordsListProfile; // class : GeographicCoordsList.***
	this.geoLocDataManager;
	
	this.vtxProfilesList;
	this.vboKeysContainer;
	this.vboKeysContainerEdges;
};

/**
 * 어떤 일을 하고 있습니까?
 */
Tunnel.prototype.getGeoLocationData = function() 
{
	if (this.geoLocDataManager === undefined)
	{ this.geoLocDataManager = new GeoLocationDataManager(); }
	
	var geoLoc = this.geoLocDataManager.getCurrentGeoLocationData();
	if (geoLoc === undefined)
	{
		geoLoc = this.geoLocDataManager.newGeoLocationData("default");
	}
	
	return geoLoc;
};

/**
 * 어떤 일을 하고 있습니까?
 */
Tunnel.prototype.getPathGeographicCoordsList = function() 
{
	if (this.geoCoordsListPath === undefined)
	{
		this.geoCoordsListPath = new GeographicCoordsList();
		this.geoCoordsListPath.owner = this;
	}
	return this.geoCoordsListPath;
};

/**
 * 어떤 일을 하고 있습니까?
 */
Tunnel.prototype.getProfileGeographicCoordsList = function() 
{
	if (this.geoCoordsListProfile === undefined)
	{
		this.geoCoordsListProfile = new GeographicCoordsList();
		this.geoCoordsListProfile.owner = this;
	}

	return this.geoCoordsListProfile;
};

/**
 * 어떤 일을 하고 있습니까?
 */
Tunnel.prototype.renderPoints = function(magoManager, shader, renderType) 
{
	if (this.geoCoordsListPath === undefined)
	{ return false; }

	//if(this.meshPositive !== undefined)
	//{
	//	this.renderExcavation(magoManager, shader, renderType);
	//}
	
	this.geoCoordsListPath.renderPoints(magoManager, shader, renderType, false);
	this.geoCoordsListPath.renderLines(magoManager, shader, renderType, false, false);
	
	if (this.points3dListAux !== undefined)
	{
		var shader = magoManager.postFxShadersManager.getShader("pointsCloud");
		shader.useProgram();
		shader.disableVertexAttribArrayAll();
		shader.resetLastBuffersBinded();
		shader.enableVertexAttribArray(shader.position3_loc);
		shader.bindUniformGenerals();

		var bLoop = false;
		var bEnableDepth = false;
		this.points3dListAux.renderLines(magoManager, shader, renderType, bLoop, bEnableDepth);
		
		shader.disableVertexAttribArrayAll();
	}
};

/**
 * 어떤 일을 하고 있습니까?
 */
Tunnel.prototype.makeMesh = function(magoManager) 
{
	if (this.geoCoordsListPath === undefined || this.geoCoordsListProfile === undefined)
	{ return false; }
	
	// 1rst, set position of this extrude object. Take as position the 1rst geoCoord absolute position.***
	// Another possibility is calculate the average point of geoCoords.***
	var geoLoc = this.getGeoLocationData();

	// Take the 1rst geographicCoord's geoLocation of the path.***
	var geoCoord = this.geoCoordsListPath.getGeoCoord(0);
	var geoLocDataManagerFirst = geoCoord.getGeoLocationDataManager();
	var geoLocFirst = geoLocDataManagerFirst.getCurrentGeoLocationData();
	geoLoc.copyFrom(geoLocFirst);

	// Now, make the profiles ( 1 vtxProfile for each point of the path).***
	if (this.vtxProfilesList === undefined)
	{ this.vtxProfilesList = new VtxProfilesList(); }
	
	// Transform pathGeoCoordsList to cartesianPath(points3DList).***
	var wgs84Point3DArray = this.geoCoordsListPath.getWgs84Points3D(undefined);
	var relativePoints3dArray = geoLoc.getTransformedRelativePositionsArray(wgs84Point3DArray, undefined);
	
	var pathPoints3dList = new Point3DList(relativePoints3dArray);
	var bLoop = false; // this is a stringTypePath, no loopTypePath.***
	
	// Provisionally make an circular profile in the 1rst point3d-plane.***
	var bisectionPlane = pathPoints3dList.getBisectionPlane(0, undefined, bLoop);
	// Note: "bisectionPlane" is in local coordinate "geoLoc".***
			
	var profile2d = new Profile2D();
	var ring = profile2d.newOuterRing();
	var circle = ring.newElement("CIRCLE");
	circle.setCenterPosition(0, 0);
	circle.setRadius(30);
	var resultPoints2dArray = [];
	var pointsCountFor360Deg = 36;
	ring.getPoints(resultPoints2dArray, pointsCountFor360Deg);
			
	// Now, calculate the rotMatrix of the bisectionPlane, & calculate points3ds of the circle points2d.***
	var rotMat4 = bisectionPlane.getRotationMatrix(undefined);
	var firstPoint3d = pathPoints3dList.getPoint(0);
	rotMat4.setTranslation(firstPoint3d.x, firstPoint3d.y, firstPoint3d.z);
	var points3dOnPlaneArray = [];
	var points2dCount = resultPoints2dArray.length;
	for (var i=0; i<points2dCount; i++)
	{
		var point2d = resultPoints2dArray[i];
		var point3dProfile = new Point3D(point2d.x, point2d.y, 0.0);
				
		var point3dOnPlane = rotMat4.transformPoint3D(point3dProfile, undefined);
		points3dOnPlaneArray.push(point3dOnPlane);
	}
			
	// Provisionally make vbo of the profilePoints3d.***
	if (this.points3dListAux === undefined)
	{ this.points3dListAux = new Point3DList(); }
			
	this.points3dListAux.deleteVboKeysContainer(magoManager);
	this.points3dListAux.deletePoints3d();
	this.points3dListAux.addPoint3dArray(points3dOnPlaneArray);
	var pointsAuxGeoLoc = this.points3dListAux.getGeographicLocation();
	pointsAuxGeoLoc.copyFrom(geoLocFirst);

	
	// Path.***
	var point3d;
	var points3dCount = pathPoints3dList.getPointsCount();
	for (var i=0; i<points3dCount; i++)
	{
		point3d = pathPoints3dList.getPoint(i);
		var bisectionPlane = pathPoints3dList.getBisectionPlane(i, undefined, bLoop);
		
		// Now, project the point3d into the plane.***
		
	}
	
};














































