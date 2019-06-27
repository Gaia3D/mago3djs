'use strict';

/**
 * Factory shaped object.
 * @class BasicFactory
 */
var BasicFactory = function(factoryWidth, factoryLength, factoryHeight) 
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
	 * The geographic location of the factory.
	 * @type {GeoLocationDataManager}
	 * @default undefined
	 */
	this.geoLocDataManager;
	
	/**
	 * Array of the objects that configures de fatory.
	 * @type {Array}
	 * @default undefined
	 */
	this.objectsArray;
	
	/**
	 * Boolean variable that indicates that the geometry is dirty.
	 * @type {Boolean}
	 * @default true
	 */
	this.dirty = true;
};

/**
 * Makes the geometry mesh.
 */
BasicFactory.prototype.makeMesh = function()
{	
	if (this.objectsArray === undefined)
	{ this.objectsArray = []; }
	
	if (this.bHasGround)
	{
		// Make the ground.***
		var groundWidth = this.width;
		var groundLength = this.length;
		var groundHeight = this.height * 0.02;
		
		var groundMesh = new Box(groundWidth, groundLength, groundHeight);
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
	
	var roofMinHeigh = this.height * 0.7;
	var openingHeight = this.height * 0.6;
	var openingLeftWidth = this.width * 0.5 * 0.8;
	var openingRightWidth = this.width * 0.5 * 0.8;
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
	
	// Right lateral wall.*****************************************************************************************************************
	var lateralWallBox = new Box(lateralWallWidth, lateralWallLength, lateralWallHeight);
	this.objectsArray.push(lateralWallBox);
	
	// Now, translate the left lateral wall.***
	var rightWallMesh = lateralWallBox.getMesh();
	rightWallMesh.translate(halfWidth-0.5*lateralWallWidth, 0, 0);
	
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
	
	mesh.setColor(0.2, 0.8, 0.5, 1.0);
	
	this.dirty = false;
};

/**
 * Renders the factory.
 */
BasicFactory.prototype.render = function(magoManager, shader, renderType, glPrimitive)
{
	if (this.dirty)
	{ this.makeMesh(); }
	
	if (this.objectsArray === undefined)
	{ return false; }

	// Set geoLocation uniforms.***
	var gl = magoManager.getGl();
	var buildingGeoLocation = this.geoLocDataManager.getCurrentGeoLocationData();
	buildingGeoLocation.bindGeoLocationUniforms(gl, shader); // rotMatrix, positionHIGH, positionLOW.
	
	var objectsCount = this.objectsArray.length;
	for (var i=0; i<objectsCount; i++)
	{
		this.objectsArray[i].render(magoManager, shader, renderType, glPrimitive);
	}
};









































