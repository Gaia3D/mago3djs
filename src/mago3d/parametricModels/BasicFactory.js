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
	 * This front wall door width.
	 * @type {Number}
	 * @default undefined
	 */
	this.frontDoorWidth;
	
	/**
	 * This front wall door height.
	 * @type {Number}
	 * @default undefined
	 */
	this.frontDoorHeight;
	
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
	
	if (options)
	{
		if (options.hasGround)
		{ this.bHasGround = options.hasGround; }
	
		if (options.roofMinHeight)
		{ this.roofMinHeight = options.roofMinHeight; }
		
		if (options.frontDoorWidth)
		{ this.frontDoorWidth = options.frontDoorWidth; }
	
		if (options.frontDoorHeight)
		{ this.frontDoorHeight = options.frontDoorHeight; }
	}
	
	// After check the option values, set the boundingBox.***
	this.bbox = new BoundingBox();
	this.bbox.set(-this.width/2, -this.length/2, 0, this.width/2, this.length/2, this.height);
	
	this.attributes = {isVisible: true};
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
 * Makes the geometry mesh.
 */
BasicFactory.prototype.makeMesh = function()
{	
	if (this.width === undefined || this.length === undefined || this.height === undefined)
	{ return; }
	
	if (this.objectsArray === undefined)
	{ this.objectsArray = []; }
	
	if (this.bHasGround)
	{
		// Make the ground.***
		var groundWidth = this.width;
		var groundLength = this.length;
		var groundHeight = this.height * 0.02;
		
		var groundMesh = new Box(groundWidth, groundLength, groundHeight);
		groundMesh.setOneColor(0.4, 0.4, 0.4, 1.0);
		this.objectsArray.push(groundMesh);
	}
	
	// Walls.***
	// Front wall with opening.******************************************************************************************************
	//
	//                   Y
	//                   ^
	//                   |
	//                  /7\             <-- height
	//                /  |  \
	//              /    |    \
	//            /      |      \
	//          8        |        6     <-- roofMinHeigh
	//          |        |         |
	//          |  2------------3  |    <-- openingHeight
	//          |  |     |      |  |
	//          |  |     |      |  |
	//          0--1     +      4--5-------> X
	//
	
	var roofMinHeigh = this.height * 0.75;
	if (this.roofMinHeight)
	{ roofMinHeigh = this.roofMinHeight; }
	
	var openingHeight = this.height * 0.6;
	if (this.frontDoorHeight)
	{ openingHeight = this.frontDoorHeight; }
	
	var openingLeftWidth = this.width * 0.5 * 0.8;
	var openingRightWidth = this.width * 0.5 * 0.8;
	if (this.frontDoorWidth)
	{
		openingLeftWidth = this.frontDoorWidth*0.5;
		openingRightWidth = this.frontDoorWidth*0.5;
	}
	
	var halfWidth = this.width * 0.5;
	var wallWidth = 0.4;
	
	var profileAux = new Profile2D();
	
	// Create a outer ring in the Profile2d.
	var outerRing = profileAux.newOuterRing();
	var polyline = outerRing.newElement("POLYLINE");
	polyline.newPoint2d(-halfWidth, 0);                          // 0
	polyline.newPoint2d(-openingLeftWidth, 0);                   // 1
	polyline.newPoint2d(-openingLeftWidth, openingHeight);       // 2
	polyline.newPoint2d(openingRightWidth, openingHeight);       // 3
	polyline.newPoint2d(openingRightWidth, 0);                   // 4
	polyline.newPoint2d(halfWidth, 0);                           // 5
	polyline.newPoint2d(halfWidth, roofMinHeigh);                // 6
	polyline.newPoint2d(0, this.height);                         // 7
	polyline.newPoint2d(-halfWidth, roofMinHeigh);               // 8
	
	// Extrude the Profile.
	var extrudeSegmentsCount = 1;
	var extrusionVector = undefined;
	var extrusionDist = wallWidth;
	var bIncludeBottomCap = true;
	var bIncludeTopCap = true;
	var mesh = Modeler.getExtrudedMesh(profileAux, extrusionDist, extrudeSegmentsCount, extrusionVector, bIncludeBottomCap, bIncludeTopCap, undefined);
	this.objectsArray.push(mesh);
	
	// Now rotate the front wall.***
	mesh.rotate(90, 1, 0, 0);
	
	// Now translate the front wall to front.***
	mesh.translate(0, -this.length*0.5+wallWidth, 0);
	mesh.setOneColor(0.9, 0.9, 0.9, 1.0);
	
	// Rear wall without opening.******************************************************************************************************
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
	
	profileAux = new Profile2D();
	
	// Create a outer ring in the Profile2d.
	var outerRing = profileAux.newOuterRing();
	var polyline = outerRing.newElement("POLYLINE");
	polyline.newPoint2d(-halfWidth, 0);                          // 0
	polyline.newPoint2d(halfWidth, 0);                           // 1
	polyline.newPoint2d(halfWidth, roofMinHeigh);                // 2
	polyline.newPoint2d(0, this.height);                         // 3
	polyline.newPoint2d(-halfWidth, roofMinHeigh);               // 4
	
	// Extrude the Profile.
	var mesh = Modeler.getExtrudedMesh(profileAux, extrusionDist, extrudeSegmentsCount, extrusionVector, bIncludeBottomCap, bIncludeTopCap, undefined);
	this.objectsArray.push(mesh);
	
	// Now rotate the front wall.***
	mesh.rotate(90, 1, 0, 0);
	
	// Now translate the front wall to front.***
	mesh.translate(0, this.length*0.5, 0);
	mesh.setOneColor(0.9, 0.9, 0.9, 1.0);
	
	// Lateral walls.***
	// Left lateral wall.*****************************************************************************************************************
	var lateralWallWidth = 0.4;
	var lateralWallLength = this.length - 2*wallWidth;
	var lateralWallHeight = roofMinHeigh;
	
	var lateralWallBox = new Box(lateralWallWidth, lateralWallLength, lateralWallHeight);
	this.objectsArray.push(lateralWallBox);
	
	// Now, translate the left lateral wall.***
	var leftWallMesh = lateralWallBox.getMesh();
	leftWallMesh.translate(-halfWidth+0.5*lateralWallWidth, 0, 0);
	leftWallMesh.setOneColor(0.9, 0.9, 0.9, 1.0);
	
	// Right lateral wall.*****************************************************************************************************************
	var lateralWallBox = new Box(lateralWallWidth, lateralWallLength, lateralWallHeight);
	this.objectsArray.push(lateralWallBox);
	
	// Now, translate the left lateral wall.***
	var rightWallMesh = lateralWallBox.getMesh();
	rightWallMesh.translate(halfWidth-0.5*lateralWallWidth, 0, 0);
	rightWallMesh.setOneColor(0.9, 0.9, 0.9, 1.0);
	
	// Roof.*******************************************************************************************************************************
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
	this.objectsArray.push(mesh);
	
	// Now rotate the roof.***
	mesh.rotate(90, 1, 0, 0);
	
	// Now translate the roof to front.***
	mesh.translate(0, this.length*0.5, 0);
	mesh.setOneColor(98/256, 233/256, 134/256, 0.3);
	
	this.dirty = false;
};

/**
 * Renders the factory.
 */
BasicFactory.prototype.render = function(magoManager, shader, renderType, glPrimitive)
{
	if (this.attributes && this.attributes.isVisible !== undefined && this.attributes.isVisible === false) 
	{
		return;
	}
	
	if (this.dirty)
	{ this.makeMesh(); }
	
	if (this.objectsArray === undefined)
	{ return false; }

	// Set geoLocation uniforms.***
	var gl = magoManager.getGl();
	var buildingGeoLocation = this.geoLocDataManager.getCurrentGeoLocationData();
	buildingGeoLocation.bindGeoLocationUniforms(gl, shader); // rotMatrix, positionHIGH, positionLOW.
	
	
	gl.uniform1i(shader.refMatrixType_loc, 0); // in magoManager case, there are not referencesMatrix.***
	
	if (renderType === 0)
	{
		// Depth render.***
	}
	else if (renderType === 1)
	{
		// Color render.***
		//gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );
		gl.enable(gl.BLEND);
		gl.uniform1i(shader.bApplySsao_loc, true); // apply ssao.***
		gl.uniform1i(shader.colorType_loc, 0); // 0= oneColor, 1= attribColor, 2= texture.***
	}
	else if (renderType === 2)
	{
		// Selection render.***
		var selectionColor = magoManager.selectionColor;
		var colorAux = magoManager.selectionColor.getAvailableColor(undefined);
		var idxKey = magoManager.selectionColor.decodeColor3(colorAux.r, colorAux.g, colorAux.b);
		magoManager.selectionManager.setCandidateGeneral(idxKey, this);
		
		gl.uniform4fv(shader.oneColor4_loc, [colorAux.r/255.0, colorAux.g/255.0, colorAux.b/255.0, 1.0]);
		gl.disable(gl.BLEND);
	}
	
	var objectsCount = this.objectsArray.length;
	for (var i=0; i<objectsCount; i++)
	{
		this.objectsArray[i].render(magoManager, shader, renderType, glPrimitive);
	}
	gl.disable(gl.BLEND);
};









































