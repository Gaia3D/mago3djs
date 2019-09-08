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
	// Usage example.
	// Front wall.**********************************************************************
	var frontWallOptions = {
		"hasOpening"    : true,
		"openingWidth"  : factoryWidth * 0.8,
		"openingHeight" : factoryHeight*0.65
	};
	
	// Rear wall.**********************************************************************
	var rearWallOptions = {
		"hasOpening"    : true,
		"openingWidth"  : factoryWidth * 0.8,
		"openingHeight" : factoryHeight*0.65
	};
	

	// Right wall.**********************************************************************
	var rightWallOptions = {};
	rightWallOptions.openingsDataArray = [];
	
	// opening 1.
	var openingData = {
		"offSet" : 2,
		"height" : roofMinHeight*0.8,
		"width"  : 8
	};
	rightWallOptions.openingsDataArray.push(openingData);
	
	// opening 2.
	var openingData = {
		"offSet" : 2,
		"height" : roofMinHeight*0.8,
		"width"  : 8
	};
	rightWallOptions.openingsDataArray.push(openingData);
	

	
	// Left wall.**********************************************************************
	var leftWallOptions = {};
	leftWallOptions.openingsDataArray = [];
	
	// opening 1.
	var openingData = {
		"offSet" : 2,
		"height" : roofMinHeight*0.8,
		"width"  : 8
	};
	leftWallOptions.openingsDataArray.push(openingData);
	
	// opening 2.
	var openingData = {
		"offSet" : 2,
		"height" : roofMinHeight*0.8,
		"width"  : 8
	};
	leftWallOptions.openingsDataArray.push(openingData);
	
	// Factory options.
	var options = {
		"hasGround"        : true,
		"roofMinHeight"    : factoryHeight*0.75,
		"frontWallOptions" : frontWallOptions,
		"rearWallOptions"  : rearWallOptions,
		"rightWallOptions" : rightWallOptions,
		"leftWallOptions"  : leftWallOptions
	};

	var geoLocDataManager = geoCoord.getGeoLocationDataManager();
	var geoLocData = geoLocDataManager.newGeoLocationData("noName");
	geoLocData = ManagerUtils.calculateGeoLocationData(geoCoord.longitude, geoCoord.latitude, geoCoord.altitude+10, testHeading, undefined, undefined, geoLocData, this);
	
	// set material for the roof of the factory.**********************************************************************
	var materialsManager = this.materialsManager;
	var materialName = "basicFactoryRoof";
	var material = materialsManager.getOrNewMaterial(materialName);
	if (material.diffuseTexture === undefined)
	{ 
		material.diffuseTexture = new Texture(); 
		material.diffuseTexture.textureTypeName = "diffuse";
		material.diffuseTexture.textureImageFileName = "mipoFactoryRoof.jpg"; // Gaia3dLogo.png
		var imagesPath = materialsManager.imagesPath + "//" + material.diffuseTexture.textureImageFileName;
		var flipYTexCoord = true;
		TexturesManager.loadTexture(imagesPath, material.diffuseTexture, this, flipYTexCoord);
	}
	
	// add options.
	options.roofOptions = {
		"material": material
	};
	*/	
	
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
		this.objectsArray.push(groundMesh);
		this.objectsMap[groundMesh.name] = groundMesh;
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
	
	this.roofMinHeight = this.options.roofMinHeight;
	var frontWallOptions = this.options.frontWallOptions;
	var options = {};
	options.width = this.width;
	options.height = this.height;
	options.roofMinHeight = this.roofMinHeight;
	if (frontWallOptions !== undefined)
	{
		options.hasOpening = frontWallOptions.hasOpening;
		if (options.hasOpening)
		{
			options.openingWidth = frontWallOptions.openingWidth;
			if (options.openingWidth === undefined)
			{ options.openingWidth = this.width * 0.8; }
			
			options.openingHeight = frontWallOptions.openingHeight;
			if (options.openingHeight === undefined)
			{ options.openingHeight = this.height * 0.6; }
		}
		
		this.frontWallThickness = frontWallOptions.frontWallThickness;
	}
	else
	{
		options.hasOpening = false;
	}
	
	if (this.frontWallThickness === undefined)
	{ this.frontWallThickness = 0.4; }

	var profileAux = BasicFactory.getTriangularWallProfile2d(options, undefined);
	
	// Extrude the Profile.
	var extrudeSegmentsCount = 1;
	var extrusionVector = undefined;
	var extrusionDist = this.frontWallThickness;
	var bIncludeBottomCap = true;
	var bIncludeTopCap = true;
	var mesh = Modeler.getExtrudedMesh(profileAux, extrusionDist, extrudeSegmentsCount, extrusionVector, bIncludeBottomCap, bIncludeTopCap, undefined);
	mesh.name = "frontWall";
	this.objectsArray.push(mesh);
	this.objectsMap[mesh.name] = mesh;
	
	// Now rotate the front wall.***
	mesh.rotate(90, 1, 0, 0);
	
	// Now translate the front wall to front.***
	mesh.translate(0, -this.length*0.5+this.frontWallThickness, 0);
	mesh.setOneColor(0.9, 0.9, 0.9, 1.0);

	// Rear wall without opening.******************************************************************************************************
	var rearWallOptions = this.options.rearWallOptions;
	var options = {};
	options.width = this.width;
	options.height = this.height;
	options.roofMinHeight = this.roofMinHeight;
	if (rearWallOptions !== undefined)
	{
		options.hasOpening = rearWallOptions.hasOpening;
		if (options.hasOpening)
		{
			options.openingWidth = rearWallOptions.openingWidth;
			if (options.openingWidth === undefined)
			{ options.openingWidth = this.width * 0.8; }
			
			options.openingHeight = rearWallOptions.openingHeight;
			if (options.openingHeight === undefined)
			{ options.openingHeight = this.height * 0.6; }
		}
		
		this.rearWallThickness = rearWallOptions.frontWallThickness;
	}
	else
	{
		options.hasOpening = false;
	}
	
	if (this.rearWallThickness === undefined)
	{ this.rearWallThickness = 0.4; }
	var profileAux = BasicFactory.getTriangularWallProfile2d(options, undefined);

	// Extrude the Profile.
	extrusionDist = this.rearWallThickness;
	var mesh = Modeler.getExtrudedMesh(profileAux, extrusionDist, extrudeSegmentsCount, extrusionVector, bIncludeBottomCap, bIncludeTopCap, undefined);
	mesh.name = "rearWall";
	this.objectsArray.push(mesh);
	this.objectsMap[mesh.name] = mesh;
	
	// Now rotate the front wall.***
	mesh.rotate(90, 1, 0, 0);
	
	// Now translate the front wall to front.***
	mesh.translate(0, this.length*0.5, 0);
	mesh.setOneColor(0.9, 0.9, 0.9, 1.0);
	
	// Lateral walls.***
	// Left lateral wall.*****************************************************************************************************************
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
	
	var leftWallOptions = this.options.leftWallOptions;
	if (leftWallOptions === undefined)
	{ leftWallOptions = {}; }

	leftWallOptions.length = this.length;
	leftWallOptions.height = this.roofMinHeight; // the lateral wall height is the factory minRoofHeight.
	
	var profileAux = BasicFactory.getLateralWallProfile2d(leftWallOptions, undefined);
	
	// Extrude the Profile.
	var mesh = Modeler.getExtrudedMesh(profileAux, extrusionDist, extrudeSegmentsCount, extrusionVector, bIncludeBottomCap, bIncludeTopCap, undefined);
	mesh.name = "leftWall";
	this.objectsArray.push(mesh);
	this.objectsMap[mesh.name] = mesh;
	
	// Now rotate the left wall.***
	mesh.rotate(90, 1, 0, 0);
	mesh.rotate(90, 0, 0, 1);
	mesh.translate(-this.width*0.5, -this.length*0.5, 0);
	mesh.setOneColor(0.9, 0.9, 0.9, 1.0);
	
	// Right lateral wall.*****************************************************************************************************************
	var rightWallOptions = this.options.rightWallOptions;
	if (rightWallOptions === undefined)
	{ rightWallOptions = {}; }

	rightWallOptions.length = this.length;
	rightWallOptions.height = this.roofMinHeight; // the lateral wall height is the factory minRoofHeight.
	
	var profileAux = BasicFactory.getLateralWallProfile2d(rightWallOptions, undefined);
	
	// Extrude the Profile.
	var mesh = Modeler.getExtrudedMesh(profileAux, extrusionDist, extrudeSegmentsCount, extrusionVector, bIncludeBottomCap, bIncludeTopCap, undefined);
	mesh.name = "rightWall";
	this.objectsArray.push(mesh);
	this.objectsMap[mesh.name] = mesh;
	
	// Now rotate the left wall.***
	mesh.rotate(90, 1, 0, 0);
	mesh.rotate(90, 0, 0, 1);
	mesh.translate(this.width*0.5 - extrusionDist, -this.length*0.5, 0);
	mesh.setOneColor(0.9, 0.9, 0.9, 1.0);

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
				//Mesh.prototype.calculateTexCoordsBox = function(texCoordsBoundingBox)
				// the difusse texture represents aprox 4x4 meters in the roofTexture.jpg image.
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
	var isSelected = false;
	
	if (renderType === 0)
	{
		// Depth render.***
	}
	else if (renderType === 1)
	{
		// Color render.***
		// Color render.***
		var selectionManager = magoManager.selectionManager;
		if (selectionManager.isObjectSelected(this))
		{ isSelected = true; }
	
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
	
	
	if (isSelected)
	{
		if (this.selColor4 === undefined)
		{
			this.selColor4 = new Color();
			this.selColor4.setRGBA(0.8, 0.4, 0.5, 1.0);
		}
		gl.uniform4fv(shader.oneColor4_loc, [this.selColor4.r, this.selColor4.g, this.selColor4.b, 1.0]); 
	}
	
	var objectsCount = this.objectsArray.length;
	for (var i=0; i<objectsCount; i++)
	{
		this.objectsArray[i].render(magoManager, shader, renderType, glPrimitive, isSelected);
	}
	
	gl.disable(gl.BLEND);
};









































