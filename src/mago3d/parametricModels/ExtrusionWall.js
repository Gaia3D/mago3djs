'use strict';

/**
 * ExtrusionWall
 * @class ExtrusionWall
 * @param {GeographicCoordsList} geographicCoordList
 * @param {number} height
 * @param {object} options
 */
var ExtrusionWall = function(geographicCoordList, height, options) 
{
	if (!(this instanceof ExtrusionWall)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
    
	if (!geographicCoordList) 
	{
		throw new Error(Messages.REQUIRED_EMPTY_ERROR('geographicCoordList'));
	}

	if (height === undefined || height === null) 
	{
		throw new Error(Messages.REQUIRED_EMPTY_ERROR('height'));
	}

	if (height === 0) 
	{
		throw new Error('height must higher than 0');
	}

	MagoRenderable.call(this, options);

	this.geographicCoordList = geographicCoordList;
	this.height = height;
	this.setGeographicPosition(this.geographicCoordList.getMiddleGeographicCoords());
	this.localCoordListArray = makeLocalCooldList(this.geographicCoordList.geographicCoordsArray, this.geoLocDataManager.getCurrentGeoLocationData());
	options = options? options : {};

	this.color4 = defaultValue(options.color, new Color(1, 1, 1, 1));

	this.attributes.isMovable = defaultValue(options.isMovable, true);
	this.attributes.isSelectable = defaultValue(options.isSelectable, true);
	this.attributes.selectedColor4 = defaultValue(options.selectedColor, new Color(1, 1, 0, 1));
	this.attributes.heightReference = defaultValue(options.heightReference, HeightReference.NONE);
	this.attributes.doubleFace = defaultValue(options.doubleFace, true);

	if (!this.options)
	{ this.options = {}; }

	this.options.loop = defaultValue(options.loop, false);
	this.options.colorTop = defaultValue(options.colorTop, undefined);
	this.options.colorBottom = defaultValue(options.colorBottom, undefined);
	this.options.colorsArray = defaultValue(options.colorsArray, undefined);

	var defaultSegmentCount = (this.options.colorsArray instanceof Array && this.options.colorsArray.length > 2) ?
		this.options.colorsArray.length - 1 : 1;
	this.options.segmentCount = defaultValue(options.segmentCount, defaultSegmentCount);

	if (this.options.segmentCount > 1 && !this.options.colorsArray && this.options.colorTop && this.options.colorBottom) 
	{
		this.options.colorsArray = Color.getInterpolatedColorsArray(this.options.colorBottom, this.options.colorTop, this.options.segmentCount + 1, this.options.colorsArray );
	}

	function makeLocalCooldList ( gcArray, geoLocData) 
	{
		var tMatInv = geoLocData.getTMatrixInv();
		var error = 1E-7;
		GeographicCoordsList.solveDegeneratedPoints(gcArray, error);
        
		var lcList = [];
		for (var j=0, gcLen=gcArray.length; j < gcLen; j++) 
		{
			var gc = gcArray[j];
			var wc = ManagerUtils.geographicCoordToWorldPoint(gc.longitude, gc.latitude, gc.altitude);
			var lc = tMatInv.transformPoint3D(wc);
			lcList.push(lc);
		}
		
		return lcList;
	}
};

ExtrusionWall.prototype = Object.create(MagoRenderable.prototype);
ExtrusionWall.prototype.constructor = ExtrusionWall;

ExtrusionWall.prototype.makeMesh = function() 
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

	var vertexProfileOptions = {
		outerVtxRingOptions: {
			isOpen: !this.options.loop
		}
	};
    
	var vtxProfilesList = new VtxProfilesList();
	var incrementHeight = this.height/this.options.segmentCount;
    
	for (var i=0;i<this.options.segmentCount+1;i++) 
	{
		var geoCoordsList = this.geographicCoordList.getCopy();
		geoCoordsList.setAltitude(incrementHeight * i);

		var point3dArray = GeographicCoordsList.getPointsRelativeToGeoLocation(geoLocData, geoCoordsList.geographicCoordsArray, undefined);
		var vtxProfile = vtxProfilesList.newVtxProfile();
		vtxProfile.makeByPoints3DArray(point3dArray, undefined, vertexProfileOptions);

		if (this.options.colorsArray) 
		{
			var color = this.options.colorsArray[i];
			vtxProfile.setColorRGBAVertices(color.r, color.g, color.b, color.a);
		}
		else if (this.options.colorTop && this.options.colorBottom && this.options.segmentCount === 1)
		{
			var segmentColor = (i===0) ? this.options.colorBottom : this.options.colorTop;
			vtxProfile.setColorRGBAVertices(segmentColor.r, segmentColor.g, segmentColor.b, segmentColor.a);
		}
	}
    
	var bIncludeBottomCap = false;
	var bIncludeTopCap = false;
	var bLoop = false;
	var solidMesh = vtxProfilesList.getMesh(undefined, bIncludeBottomCap, bIncludeTopCap, bLoop);
	var surfIndepMesh = solidMesh.getCopySurfaceIndependentMesh();
	surfIndepMesh.calculateVerticesNormals();
    
	this.objectsArray.push(surfIndepMesh);

	this.setDirty(false);
    
	if (this.attributes.heightReference !== HeightReference.NONE) 
	{
		if (this.terrainHeight) { this.setTerrainHeight(this.terrainHeight); }
	}
};

/**
 * @param {Array<Cesium.Cartesian3>} cartesian3Array
 * @param {number} height
 * @param {object} options
 */
ExtrusionWall.makeExtrusionBuildingByCartesian3Array = function(cartesian3Array, height, options) 
{
	var geographicCoordList = GeographicCoordsList.fromCartesians(cartesian3Array);
	var eb = new ExtrusionWall(geographicCoordList, height, options);

	return eb;
};