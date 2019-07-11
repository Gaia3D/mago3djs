'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class Path3D
 */
var Path3D = function(geographicCoordsArray) 
{
	if (!(this instanceof Path3D)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.geoCoordsList;
	
	if (geographicCoordsArray !== undefined)
	{
		this.geoCoordsList = new GeographicCoordsList(geographicCoordsArray);
	}
	
	this.controlPointArmLength = 0.2;
	this.curvesArray;
	this.dirty = true;
	
};

/**
 * Returns the tangent line at "linearPosition" of the path. 
 */
Path3D.prototype.getTangent = function(linearPosition, resultTangentLine, magoManager)
{
	if (this.dirty)
	{
		if (this.curvesArray === undefined)
		{ this.curvesArray = []; }
	
		// Check segments length.***
		var maxLengthDegree = 0.001;
		Path3D.insertPointsOnLargeSegments(this.geoCoordsList.geographicCoordsArray, maxLengthDegree, magoManager);
		
		var coordsCount = this.geoCoordsList.geographicCoordsArray.length;
		for (var i=0; i<coordsCount; i++)
		{
			var geoCoord = this.geoCoordsList.geographicCoordsArray[i];
			var geoLocDataManager = geoCoord.getGeoLocationDataManager();
			var geoLocData = geoLocDataManager.newGeoLocationData("noName");
			geoLocData = ManagerUtils.calculateGeoLocationData(geoCoord.longitude, geoCoord.latitude, geoCoord.altitude, undefined, undefined, undefined, geoLocData, magoManager);
		}
		
		// Make bSpline.***
		var bSplineCubic3d = new BSplineCubic3D();
		this.curvesArray.push(bSplineCubic3d);
		
		bSplineCubic3d.geoCoordsList = this.geoCoordsList;
		bSplineCubic3d.geoCoordsList.makeLines(magoManager);
		
		// Make control points automatically.***
		var controlPointArmLength = this.controlPointArmLength; 
		bSplineCubic3d.makeControlPoints(controlPointArmLength, magoManager);
		
		this.dirty = false;
	}
	
	var bSplineCubic3d = this.curvesArray[0];
	var resultTangentLine = BSplineCubic3D.getTangent(bSplineCubic3d, linearPosition, resultTangentLine);
	return resultTangentLine;
};


/**
 * Returns the geoLocDataManager 
 */
Path3D.prototype.getGeoLocationDataManager = function() 
{
	// Provisionally return the "geoLocDataManager" on the 1rst curve, that is a bSpline.***
	if (this.curvesArray === undefined || this.curvesArray.length === 0)
	{ return; }
	
	var bSplineCubic3d = this.curvesArray[0];
	if (bSplineCubic3d === undefined)
	{ return; }
	
	return bSplineCubic3d.knotPoints3dList.geoLocDataManager;
};

/**
 * Inserts points in large segments.
 */
Path3D.insertPointsOnLargeSegments = function(geographicCoordsArray, maxLengthDegree, magoManager)
{
	if (geographicCoordsArray === undefined)
	{ return; }
	
	var geoCoordsCount = geographicCoordsArray.length;
	for (var i=0; i<geoCoordsCount-1; i++)
	{
		var geoCoordA = geographicCoordsArray[i];
		var geoCoordB = geographicCoordsArray[i+1];
		var ang = GeographicCoord.getAngleBetweenCoords(geoCoordA, geoCoordB);
		if (ang > maxLengthDegree)
		{
			var midGeoCoord = GeographicCoord.getMidPoint(geoCoordA, geoCoordB, undefined);
			
			//var geoLocDataManager = midGeoCoord.getGeoLocationDataManager();
			//var geoLocData = geoLocDataManager.newGeoLocationData("noName");
			//geoLocData = ManagerUtils.calculateGeoLocationData(midGeoCoord.longitude, midGeoCoord.latitude, midGeoCoord.altitude, undefined, undefined, undefined, geoLocData, magoManager);
			
			geographicCoordsArray.splice(i+1, 0, midGeoCoord);
			geoCoordsCount = geographicCoordsArray.length;
			i--;
		}
	}
	
};





















































