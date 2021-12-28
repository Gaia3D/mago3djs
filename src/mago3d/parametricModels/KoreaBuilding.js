'use strict';

/**
 * 건물통합정보 마스터 데이터의 각 건물 객체
 * @class KoreaBuilding
 * @param {object} geojson
 */
var KoreaBuilding = function (geojson) 
{
	if (!(this instanceof KoreaBuilding)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this._scheme = {
		type: function(value) 
		{
			return "Feature" === value;
		}, 
		geometry: function(value) 
		{
			return ;                    
		},
		properties: function(value) 
		{
			return value.HEIGHT;
		}
	};
    
	if (!geojson) 
	{
		throw new Error(Messages.REQUIRED_EMPTY_ERROR('geojson'));
	}

	MagoRenderable.call(this);

	this.centerGeographicCoords;
	this.geographicCoordListsArray = [];
	this.height = 3;

	var options = {};
	this.color4 = defaultValue(options.color, new Color(1, 0.98823529, 0.8, 1));

	this.attributes.isMovable = defaultValue(options.isMovable, true);
	this.attributes.isSelectable = defaultValue(options.isSelectable, true);
	this.attributes.selectedColor4 = defaultValue(options.selectedColor, new Color(1, 1, 0, 1));
	this.attributes.heightReference = defaultValue(options.heightReference, HeightReference.CLAMP_TO_GROUND);

	this.initialize(geojson);
};
KoreaBuilding.prototype = Object.create(MagoRenderable.prototype);
KoreaBuilding.prototype.constructor = KoreaBuilding;

KoreaBuilding.prototype.initialize = function(feature) 
{
	var geographicCoordsList = KoreaBuilding.geometryToGeographicCoordsList(feature.geometry);
	this.geographicCoordListsArray.push(geographicCoordsList);
    
	var centerGeographicCoords = geographicCoordsList.getMiddleGeographicCoords(); 
	this.setGeographicPosition(centerGeographicCoords);
	this.centerGeographicCoords = centerGeographicCoords;

	var height = feature.properties.HEIGHT || feature.properties.BLDH_BV;
	if (height !== 0) { this.height = height; }
};

KoreaBuilding.prototype.makeMesh = function() 
{
	if (!this.dirty) { return; }
	
	if (!this.geoLocDataManager) 
	{
		return;
	}
	var geoLocData = this.geoLocDataManager.getCurrentGeoLocationData();
    
	if (!geoLocData) 
	{
		return;
	}
	if (this.attributes.heightReference !== HeightReference.NONE) 
	{
		geoLocData = ManagerUtils.calculateGeoLocationData(undefined, undefined, 0, undefined, undefined, undefined, geoLocData);
	}
	// Try to solve degeneratedPoints.***
	var error = 1E-8;

	this.objectsArray = [];
	var geoCoordsListsCount = this.geographicCoordListsArray.length;
	for (var i=0; i<geoCoordsListsCount; i++)
	{
		var geographicCoordList = this.geographicCoordListsArray[i];
        
		GeographicCoordsList.solveDegeneratedPoints(geographicCoordList.geographicCoordsArray, error);
        
		// Make the topGeoCoordsList.
		var topGeoCoordsList = geographicCoordList.getCopy();
		// Reassign the altitude on the geoCoordsListCopy.
		geographicCoordList.setAltitude(0);
		topGeoCoordsList.setAltitude(this.height);
        
		var basePoints3dArray = GeographicCoordsList.getPointsRelativeToGeoLocation(geoLocData, geographicCoordList.geographicCoordsArray, undefined);
		var topPoints3dArray = GeographicCoordsList.getPointsRelativeToGeoLocation(geoLocData, topGeoCoordsList.geographicCoordsArray, undefined);
        
		// Now, with basePoints3dArray & topPoints3dArray make a mesh.
		// Create a VtxProfilesList.
		var vtxProfilesList = new VtxProfilesList();
		var baseVtxProfile = vtxProfilesList.newVtxProfile();
		baseVtxProfile.makeByPoints3DArray(basePoints3dArray, undefined); 
		var topVtxProfile = vtxProfilesList.newVtxProfile();
		topVtxProfile.makeByPoints3DArray(topPoints3dArray, undefined); 
        
		var bIncludeBottomCap = true;
		var bIncludeTopCap = true;
		var solidMesh = vtxProfilesList.getMesh(undefined, bIncludeBottomCap, bIncludeTopCap);
		var surfIndepMesh = solidMesh.getCopySurfaceIndependentMesh();
		surfIndepMesh.calculateVerticesNormals();
        
		this.objectsArray.push(surfIndepMesh);
	}
	this.setDirty(false);

	if (this.attributes.heightReference !== HeightReference.NONE) 
	{
		if (this.terrainHeight) { this.setTerrainHeight(this.terrainHeight); }
	}
};

KoreaBuilding.geometryToGeographicCoordsList = function(geometryObject) 
{
	var geographicCoordsList = new GeographicCoordsList();
	if (geometryObject.type === 'MultiPolygon') 
	{
		var coordinates = geometryObject.coordinates[0][0];
		var loopCnt = coordinates.length - 1;
		for (var i=loopCnt;i>0;i--) 
		{
			var coord = coordinates[i];
			var lon = coord[0];
			var lat = coord[1];

			geographicCoordsList.newGeoCoord(lon, lat, 0);
		}
	}
	GeographicCoordsList.solveDegeneratedPoints(geographicCoordsList.geographicCoordsArray, 1E-8);
	return geographicCoordsList;
};