'use strict';

/**
 * Factory shaped object.
 * @class BasicFactory
 */
var BasicFactory = function(factoryWidth, factoryLength, factoryHeight, options) 
{
	if (!(this instanceof BasicFactory)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	MagoRenderable.call(this);
	/**
	 * The name of the factory.
	 * @type {String}
	 * @default undefined
	 */
	this.name;
	
	/**
	 * The entire width of the factory.
	 * @type {Number}
	 * @default undefined
	 */
	this.width = factoryWidth;
	
	/**
	 * The entire length of the factory.
	 * @type {Number}
	 * @default undefined
	 */
	this.length = factoryLength;
	
	/**
	 * The entire height of the factory.
	 * @type {Number}
	 * @default undefined
	 */
	this.height = factoryHeight;
	
	/**
	 * This boolean variable indicates if the factory has his own ground.
	 * @type {Boolean}
	 * @default false
	 */
	this.bHasGround = false;
	
	/**
	 * This minimum height of the roof.
	 * @type {Number}
	 * @default undefined
	 */
	this.roofMinHeight;
	
	
	/**
	 * The geographic location of the factory.
	 * @type {GeoLocationDataManager}
	 * @default undefined
	 */
	this.geoLocDataManager;
	
	/**
	 * Array of the objects that configures the fatory.
	 * @type {Array}
	 * @default undefined
	 */
	this.objectsArray;
	
	this.objectsMap;
	
	/**
	 * The bounding box of the fatory.
	 * @type {BoundingBox}
	 * @default undefined
	 */
	this.bbox;
	
	/**
	 * Boolean variable that indicates that the geometry is dirty.
	 * @type {Boolean}
	 * @default true
	 */
	this.dirty = true;
	
	this.roofColor4 = new Color();
	this.roofColor4.setRGBA(98/256, 233/256, 134/256, 0.3);
	
	this.options = options;

	// After check the option values, set the boundingBox.***
	this.bbox = new BoundingBox();
	this.bbox.set(-this.width/2, -this.length/2, 0, this.width/2, this.length/2, this.height);
	
	this.attributes = {isVisible: true};
};

BasicFactory.prototype = Object.create(MagoRenderable.prototype);
BasicFactory.prototype.constructor = BasicFactory;

/**
 * BasicFactory wallType.
 */
BasicFactory.wallType = {
	'FRONT' : 'front',
	'REAR'  : 'rear',
	'LEFT'  : 'left',
	'RIGHT' : 'right'
};
/**
 * Returns the bbox.
 */
BasicFactory.prototype.getBoundingBox = function()
{
	return this.bbox;
};

/**
 * Returns the bbox.
 */
BasicFactory.getFactoryDimensionsByGeoCoordsArray = function(geoCoordsArray, edgeIdxOfDoor, magoManager)
{
	if (geoCoordsArray === undefined || geoCoordsArray.length < 4)
	{ return undefined; }
	
	var geoCoord_0 = geoCoordsArray[0];
	var geoCoord_1 = geoCoordsArray[1];
	var geoCoord_2 = geoCoordsArray[2];
	var geoCoord_3 = geoCoordsArray[3];
	var fWidth, fLength, headingAngDeg;
	if (edgeIdxOfDoor === 0)
	{
		var geoCoordSegment = new GeographicCoordSegment(geoCoord_0, geoCoord_1);
		var geoCoordSegment2 = new GeographicCoordSegment(geoCoord_1, geoCoord_2);
	}
	else if (edgeIdxOfDoor === 1)
	{
		var geoCoordSegment = new GeographicCoordSegment(geoCoord_1, geoCoord_2);
		var geoCoordSegment2 = new GeographicCoordSegment(geoCoord_2, geoCoord_3);
	}
	else if (edgeIdxOfDoor === 2)
	{
		var geoCoordSegment = new GeographicCoordSegment(geoCoord_2, geoCoord_3);
		var geoCoordSegment2 = new GeographicCoordSegment(geoCoord_3, geoCoord_0);
	}
	else if (edgeIdxOfDoor === 3)
	{
		var geoCoordSegment = new GeographicCoordSegment(geoCoord_3, geoCoord_0);
		var geoCoordSegment2 = new GeographicCoordSegment(geoCoord_0, geoCoord_1);
	}
	
	fWidth = GeographicCoordSegment.getLengthInMeters(geoCoordSegment, magoManager);
	fLength = GeographicCoordSegment.getLengthInMeters(geoCoordSegment2, magoManager);
	headingAngDeg = GeographicCoordSegment.calculateHeadingAngRadToNorthOfSegment(geoCoordSegment2, magoManager)*180/Math.PI;
	
	var lon = (geoCoord_0.longitude + geoCoord_0.longitude + geoCoord_0.longitude + geoCoord_0.longitude )/4;
	var lat = (geoCoord_0.latitude + geoCoord_0.latitude + geoCoord_0.latitude + geoCoord_0.latitude )/4;
	
	var result = {
		factoryWidth  : fWidth,
		factoryLength : fLength,
		headingDeg    : headingAngDeg,
		longitude     : lon,
		latitude      : lat
	};
	return result;
};

/**
 * Makes triangular wall profile.
 */
BasicFactory.getTriangularWallProfile2d = function(options, resultProfile2d)
{
	// Triangular wall with opening.****************************************
	//
	//                   Y
	//                   ^
	//                   |
	//                  /7\             <-- height
	//                /  |  \
	//              /    |    \
	//            /      |      \
	//          8        |        6     <-- roofMinHeight
	//          |        |         |
	//          |  2------------3  |    <-- openingHeight (if exist).
	//          |  |     |      |  |
	//          |  |     |      |  |
	//          0--1     +      4--5-------> X
	//
	
	// Triangular wall without opening.**************************************
	//
	//                   Y
	//                   ^
	//                   |
	//                  /3\             <-- height
	//                /  |  \
	//              /    |    \
	//            /      |      \
	//          4        |        2     <-- roofMinHeigh
	//          |        |         |
	//          |        |         |    
	//          |        |         |
	//          |        |         |
	//          0--------+---------1-------> X
	//
	
	if (options === undefined)
	{ return resultProfile2d; }
	
	if (resultProfile2d === undefined)
	{ resultProfile2d = new Profile2D(); }
	
	var hasOpening = options.hasOpening;
	if (hasOpening === undefined)
	{ hasOpening = false; }
	
	// factory width.
	var width = options.width;
	
	// factory height.
	var height = options.height;
	
	// factory roof min height.
	var roofMinHeight = options.roofMinHeight;
	if (roofMinHeight === undefined)
	{ roofMinHeight = height * 0.75; }
	
	var halfWidth = width * 0.5;
	
	if (hasOpening)
	{
		// opening dimensions.
		var openingHeight = options.openingHeight;
		if (openingHeight === undefined)
		{ openingHeight = height * 0.6; }
		
		var openingWidth = options.openingWidth;
		if (openingWidth === undefined)
		{ openingWidth = width * 0.8; }
		
		var openingLeftWidth = openingWidth * 0.5;
		var openingRightWidth = openingWidth * 0.5;
	
		// Create a outer ring in the Profile2d.
		var outerRing = resultProfile2d.newOuterRing();
		var polyline = outerRing.newElement("POLYLINE");
		polyline.newPoint2d(-halfWidth, 0);                          // 0
		polyline.newPoint2d(-openingLeftWidth, 0);                   // 1
		polyline.newPoint2d(-openingLeftWidth, openingHeight);       // 2
		polyline.newPoint2d(openingRightWidth, openingHeight);       // 3
		polyline.newPoint2d(openingRightWidth, 0);                   // 4
		polyline.newPoint2d(halfWidth, 0);                           // 5
		polyline.newPoint2d(halfWidth, roofMinHeight);               // 6
		polyline.newPoint2d(0, height);                              // 7
		polyline.newPoint2d(-halfWidth, roofMinHeight);              // 8
	}
	else 
	{
		// wall without opening.
		// Create a outer ring in the Profile2d.
		var outerRing = resultProfile2d.newOuterRing();
		var polyline = outerRing.newElement("POLYLINE");
		polyline.newPoint2d(-halfWidth, 0);                          // 0
		polyline.newPoint2d(halfWidth, 0);                           // 1
		polyline.newPoint2d(halfWidth, roofMinHeight);               // 2
		polyline.newPoint2d(0, height);                              // 3
		polyline.newPoint2d(-halfWidth, roofMinHeight);              // 4
	}
	
	return resultProfile2d;
};

/**
 * Makes triangular wall profile.
 */
BasicFactory.getLateralWallProfile2d = function(options, resultProfile2d)
{
	//
	//   15-----------------------------------------------------------14      <-- height
	//   |                                                            |
	//   |                      6--------------7                      |               
	//   |   2-----------3      |              |                      |       <-- openingHeight
	//   |   |           |      |              |                      |
	//   |   |           |      |              |      10----------11  |       <-- openingHeight
	//   |   |           |      |              |      |           |   |
	//   0---1           4------5              8------9           12--13
	//
	//   offset,width,height    offset,width,height    offset,width,height ...
	
	if (resultProfile2d === undefined)
	{ resultProfile2d = new Profile2D(); }

	// wall height.
	var height = options.height;
	var length = options.length;
	
	// Create a outer ring in the Profile2d.
	var outerRing = resultProfile2d.newOuterRing();
	var polyline = outerRing.newElement("POLYLINE");
	
	// create the 1rst point2d.
	polyline.newPoint2d(0, 0);   
	var currOffSet = 0;
	
	// insert openings if exist.
	var openingsDataArray = options.openingsDataArray;
	var openingsCount = 0;
	if (openingsDataArray !== undefined)
	{ openingsCount = openingsDataArray.length; }
	
	for (var i=0; i<openingsCount; i++)
	{
		var openingData = options.openingsDataArray[i];
		var openingOffSet = openingData.offSet;
		var openingHeight = openingData.height;
		var openingWidth = openingData.width;
		
		// insert opening into profile.
		polyline.newPoint2d(currOffSet + openingOffSet, 0);
		polyline.newPoint2d(currOffSet + openingOffSet, openingHeight);
		polyline.newPoint2d(currOffSet + openingOffSet + openingWidth, openingHeight);
		polyline.newPoint2d(currOffSet + openingOffSet + openingWidth, 0);
		
		// update currentOffSet.
		currOffSet = currOffSet + openingOffSet + openingWidth;
	}
	
	// Now, finish the profile (13).
	polyline.newPoint2d(length, 0);
	polyline.newPoint2d(length, height);
	polyline.newPoint2d(0, height);
	
	return resultProfile2d;
};

/**
 * 공장 벽 프로파일
 * @param {string} wallType 벽 위치
 * @param {object} wallOption 벽 옵션, 존재하면 문을 그림.
 * @param {Profile2d}} resultProfile2d
 * @return {Profile2d}
 */
BasicFactory.prototype.getWallProfile2d = function(wallType, wallOption, resultProfile2d) 
{
	if (resultProfile2d === undefined)
	{ resultProfile2d = new Profile2D(); }

	// 앞뒤인지 여부
	var isFrontOrRear = (wallType === BasicFactory.wallType.FRONT || wallType === BasicFactory.wallType.REAR);
	// factory width.
	var width = isFrontOrRear ? this.width : this.length;
	// factory height.
	var height = this.height;
	// factory roof min height.
	var roofMinHeight = this.roofMinHeight;

	var outerRing = resultProfile2d.newOuterRing();
	var polyline = outerRing.newElement("POLYLINE");
	polyline.newPoint2d(0, 0);
	if (wallOption && wallOption.openingInfo) 
	{
		if (Array.isArray(wallOption.openingInfo)) 
		{
			var curOffset = 0;
			var openingInfos = wallOption.openingInfo;
			for (var i=0, len=openingInfos.length;i<len;i++) 
			{
				var openingInfo = openingInfos[i];

				if (!defined(openingInfo.offset)) { continue; }

				var doorOffset = openingInfo.offset;
				var doorHeight = openingInfo.height;
				var doorWidth = openingInfo.width;

				curOffset = curOffset + doorOffset;
				openingInfo.centerPropterties = this.calculateOpeningProperties(wallType, curOffset, doorWidth, doorHeight, openingInfo.thickness);

				polyline.newPoint2d(curOffset, 0);
				polyline.newPoint2d(curOffset, doorHeight);

				curOffset = curOffset + doorWidth;
				polyline.newPoint2d(curOffset, doorHeight);
				polyline.newPoint2d(curOffset, 0);
			}
		}
		else 
		{
			var openingInfo = wallOption.openingInfo;
			var offset = defined(openingInfo.offset) ? openingInfo.offset : (width - openingInfo.width) * 0.5;

			var doorHeight = openingInfo.height;
			var doorWidth = openingInfo.width;

			openingInfo.centerPropterties = this.calculateOpeningProperties(wallType, offset, doorWidth, doorHeight, openingInfo.thickness);
			polyline.newPoint2d(offset, 0);
			polyline.newPoint2d(offset, doorHeight);
			polyline.newPoint2d(offset + doorWidth, doorHeight);
			polyline.newPoint2d(offset + doorWidth, 0);
		}
	}

	polyline.newPoint2d(width, 0);
	polyline.newPoint2d(width, roofMinHeight);
	if (isFrontOrRear) 
	{
		polyline.newPoint2d(width*0.5, height);
	}
	polyline.newPoint2d(0, roofMinHeight);

	return resultProfile2d;
};
BasicFactory.prototype.calculateOpeningProperties = function(wallType, start, width, height) 
{
	var profile2d = new Profile2D();
	var outerRing = profile2d.newOuterRing();
	var polyline = outerRing.newElement("POLYLINE");

	/*polyline.newPoint2d(start, 0);
	polyline.newPoint2d(start, height);
	polyline.newPoint2d(start + width, height);
	polyline.newPoint2d(start + width, 0);*/

	polyline.newPoint2d(start, 0);
	polyline.newPoint2d(start + width, 0);
	polyline.newPoint2d(start + width, height);
	polyline.newPoint2d(start, height);
	
	var vp =  new VtxProfile();
	vp.makeByProfile2D(profile2d);

	this.validateWallGeom(wallType, vp);

	var outerRing = vp.outerVtxRing;
	var outerVertexList = outerRing.vertexList;
	var openingBbox = outerVertexList.getBoundingBox();

	var openingCenterPointLC = openingBbox.getCenterPoint();
	var openingNormalLC = outerRing.calculatePlaneNormal();

	var geoLocDataManager = this.geoLocDataManager;
	var geoLocData = geoLocDataManager.getCurrentGeoLocationData();
	var rotMatrix = geoLocData.rotMatrix;

	var openingCenterPointWC = geoLocData.localCoordToWorldCoord(openingCenterPointLC);
	var openingNormalWC = rotMatrix.transformPoint3D(openingNormalLC);

	return {
		openeingProfile2d : profile2d,
		centerLC          : openingCenterPointLC,
		normalLC          : openingNormalLC,
		centerWC          : openingCenterPointWC,
		normalWC          : openingNormalWC
	};
};

BasicFactory.prototype.getOpeningProperties = function(wallType, index) 
{
	var wallOptions = this.options.wallOptions;

	if (!defined(index)) { index = 0; }

	var wallOption;
	if (wallOptions) 
	{
		for (var j in wallOptions) 
		{
			if (wallOptions[j].type === wallType) 
			{
				wallOption = wallOptions[j];
			}
		}
	}

	if (Array.isArray(wallOption.openingInfo)) 
	{
		return wallOption.openingInfo[0].centerPropterties;
	}
	else 
	{
		return wallOption.openingInfo.centerPropterties;
	}
};
/**
 * Makes the geometry mesh.
 */
BasicFactory.prototype.makeMesh = function()
{	
	if (this.width === undefined || this.length === undefined || this.height === undefined)
	{ return; }
	
	if (this.objectsArray === undefined)
	{ this.objectsArray = []; }

	if (this.objectsMap === undefined)
	{ this.objectsMap = {}; }
	
	if (this.bHasGround)
	{
		// Make the ground.***
		var groundWidth = this.width;
		var groundLength = this.length;
		var groundHeight = this.height * 0.02;
		
		var groundMesh = new Box(groundWidth, groundLength, groundHeight, "ground");
		groundMesh.setOneColor(0.2, 0.3, 0.3, 1.0);
		groundMesh.owner = this;
		this.objectsArray.push(groundMesh);
		this.objectsMap[groundMesh.name] = groundMesh;
	}
	this.roofMinHeight = defaultValue(this.options.roofMinHeight, this.height*0.75);

	// Walls.***
	var wallOptions = this.options.wallOptions;
	var extrusionDist = 0.4;
	var extrudeSegmentsCount = 1;
	var extrusionVector = undefined;
	var bIncludeBottomCap = true;
	var bIncludeTopCap = true;

	for (var key in BasicFactory.wallType) 
	{
		if (!BasicFactory.wallType.hasOwnProperty(key)) { continue; }
		
		var wallType = BasicFactory.wallType[key];
		var wallOption;
		if (wallOptions) 
		{
			for (var j in wallOptions) 
			{
				if (wallOptions[j].type === wallType) 
				{
					wallOption = wallOptions[j];
					extrusionDist = defaultValue(wallOption.thickness, 0.4);
					break;
				}
				else 
				{
					wallOption = null;
				}
			}
			var meshName = wallType + "Wall";
      		if (!this.objectsMap[meshName]) 
			{
        		var profileAux = this.getWallProfile2d(wallType, wallOption, undefined);

        		var mesh = Modeler.getExtrudedMesh(profileAux, extrusionDist, extrudeSegmentsCount, extrusionVector, bIncludeBottomCap, bIncludeTopCap, undefined);
        		mesh.name = meshName;
        		this.objectsArray.push(mesh);
        		this.objectsMap[meshName] = mesh;

        		this.validateWallGeom(wallType, mesh);
      		}
		}
	}

	// Roof.*******************************************************************************************************************************
	var halfWidth = this.width * 0.5;
	var roofMinHeigh = this.roofMinHeight;
	var polylineAux = new PolyLine2D();
	polylineAux.newPoint2d(halfWidth, roofMinHeigh);                 // 0
	polylineAux.newPoint2d(0, this.height);                          // 1
	polylineAux.newPoint2d(-halfWidth, roofMinHeigh);                // 2
	var leftExpandDist = 0;
	var rightExpandDist = 0.2;
	var polyline = new PolyLine2D();
	polyline.point2dArray = Point2DList.getExpandedPoints(polylineAux.point2dArray, polyline.point2dArray, leftExpandDist, rightExpandDist);
	
	// Make roof profile.***
	profileAux = new Profile2D();
	var outerRing = profileAux.newOuterRing();
	outerRing.addElement(polyline);
	extrusionDist = this.length;
	var mesh = Modeler.getExtrudedMesh(profileAux, extrusionDist, extrudeSegmentsCount, extrusionVector, bIncludeBottomCap, bIncludeTopCap, undefined);
	mesh.name = "roof";
	mesh.owner = this;
	this.objectsArray.push(mesh);
	this.objectsMap[mesh.name] = mesh;
	
	// Now rotate the roof.***
	mesh.rotate(90, 1, 0, 0);
	
	// Now translate the roof to front.***
	mesh.translate(0, this.length*0.5, 0);
	mesh.setOneColor(98/256, 233/256, 134/256, 0.3);
	
	// Check if there are roof's material.
	var roofMaterial;
	var roofOptions = this.options.roofOptions;
	if (roofOptions !== undefined)
	{
		roofMaterial = roofOptions.material;
		if (roofMaterial !== undefined)
		{
			// check if there are texture. If exist texture then calculate texCoord for the roofMesh.
			if (roofMaterial.diffuseTexture !== undefined)
			{
				// Calculate texCoords for the roofMesh.
				// the difusse texture represents aprox 20x60 meters in the roofTexture.jpg image.
				var texCoordsBBox = new BoundingBox();
				var length = 60;
				var width = this.width;
				var height = 20;
				texCoordsBBox.set(-width, -length, -height, width, length, height);
				mesh.calculateTexCoordsBox(texCoordsBBox);
				mesh.material = roofMaterial;
			}
			
		}
	}
	
	this.dirty = false;
};

/**
 * Renders the factory.
 */
BasicFactory.prototype.getObjectByName = function(objectName)
{
	return this.objectsMap[objectName];
};

/**
 * delete mesh from this factory.
 * @param {string} name Mesh name
 */
BasicFactory.prototype.removeMesh = function(name) 
{
	if (this.objectsMap && this.objectsMap[name]) { this.objectsMap[name] = undefined; }

	if (this.objectsArray && Array.isArray(this.objectsArray)) 
	{
		this.objectsArray = this.objectsArray.filter(function(item) 
		{
			return item.name !== name;
		});
	}
};
/**
 * @param {string} wallType
 * @param {Object} geom must have rotate function and translate function
 */
BasicFactory.prototype.validateWallGeom = function(wallType, geom, extrusionDist) 
{
	if (typeof geom.rotate !== 'function' || typeof geom.translate !== 'function') 
	{
		throw new Error('invalid geometry type.');
	}

	if (!defined(extrusionDist)) { extrusionDist = 0.4; }

	switch (wallType) 
	{
	case 'front' : {
		// Now rotate the front wall
		geom.rotate(90, 1, 0, 0);

		// Now translate the front wall to front
		geom.translate(-this.width*0.5, -this.length*0.5+extrusionDist, 0);
		break;
	}
	case 'rear' : {
		// Now rotate the rear wall
		geom.rotate(90, 1, 0, 0);

		// Now translate the rear wall to rear
		geom.translate(-this.width*0.5, this.length*0.5, 0);
		break;
	}
	case 'left' : {
		// Now rotate the left wall
		geom.rotate(90, 1, 0, 0);
		geom.rotate(90, 0, 0, 1);

		// Now translate the left wall to left
		geom.translate(-this.width*0.5, -this.length*0.5, 0);
		break;
	}
	case 'right' : {
		// Now rotate the right wall.***
		geom.rotate(90, 1, 0, 0);
		geom.rotate(90, 0, 0, 1);

		// Now translate the right wall to right
		geom.translate(this.width*0.5 - extrusionDist, -this.length*0.5, 0);
		break;
	}
	}

	if (geom instanceof Mesh) 
	{
		geom.setOneColor(0.9, 0.9, 0.9, 1.0);
	}
};