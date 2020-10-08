'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class VisibleObjectsController
 */
var VisibleObjectsController = function() 
{
	if (!(this instanceof VisibleObjectsController)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	// This object works with FrustumVolumeControl.
	this.currentVisibles0 = []; 
	this.currentVisibles1 = []; 
	this.currentVisibles2 = []; 
	this.currentVisibles3 = []; 
	//use with point cloud
	this.currentVisiblesAux = [];
	//use with projectType 10
	this.currentVisiblesPT10 = [];
	this.currentVisibleNativeObjects = {
		opaquesArray      : [],
		transparentsArray : [],
		excavationsArray  : [],
		vectorTypeArray   : [],
		pointTypeArray    : []
	};
	this.currentVisiblesToPrepare = [];
	
	this.bSphere;
	this.bFrustumNear;
	this.bFrustumFar;
};
VisibleObjectsController.prototype.initArrays = function() 
{
	this.currentVisibles0 = [];
	this.currentVisibles1 = [];
	this.currentVisibles2 = [];
	this.currentVisibles3 = [];
	this.currentVisiblesAux = [];
	this.currentVisiblesPT10 = [];
	this.currentVisibleNativeObjects = {
		opaquesArray      : [],
		transparentsArray : [],
		excavationsArray  : [],
		vectorTypeArray   : [],
		pointTypeArray    : []
	};
	this.currentVisiblesToPrepare = [];
	
	this.bSphere = undefined;
	this.bFrustumNear = undefined;
	this.bFrustumFar = undefined;
};
/**Clear all of the volumn's data */

VisibleObjectsController.prototype.clear = function() 
{
	this.currentVisibles0.length = 0;
	this.currentVisibles1.length = 0;
	this.currentVisibles2.length = 0;
	this.currentVisibles3.length = 0;
	this.currentVisiblesAux.length = 0;
	this.currentVisiblesPT10.length = 0;
	this.currentVisibleNativeObjects.opaquesArray.length = 0;
	this.currentVisibleNativeObjects.transparentsArray.length = 0;
	this.currentVisibleNativeObjects.excavationsArray.length = 0;
	this.currentVisibleNativeObjects.vectorTypeArray.length = 0;
	this.currentVisibleNativeObjects.pointTypeArray.length = 0;
	this.currentVisiblesToPrepare.length = 0;
	
	
	this.bSphere = undefined;
	this.bFrustumNear = undefined;
	this.bFrustumFar = undefined;
};

/**
 * Make all volumns visible
 */
VisibleObjectsController.prototype.getAllVisibles = function() 
{
	var resultVisiblesArray = [].concat(this.currentVisibles0, this.currentVisibles1, this.currentVisibles2, this.currentVisibles3, this.currentVisiblesAux, this.currentVisiblesPT10);
	return resultVisiblesArray;
};

/**
 * Make two volumns : 0, 1
 */
VisibleObjectsController.prototype.get01Visibles = function() 
{
	var resultVisiblesArray = [].concat(this.currentVisibles0, this.currentVisibles1);
	return resultVisiblesArray;
};

/**
 * Make two volumns : 0, 1
 */
VisibleObjectsController.prototype.hasRenderables = function() 
{
	if (this.currentVisibles0.length > 0 || 
		this.currentVisibles1.length > 0 || 
		this.currentVisibles2.length > 0 || 
		this.currentVisibles3.length > 0 || 
		this.currentVisiblesAux.length > 0 ||
		this.currentVisiblesPT10.length > 0 ||
		this.currentVisibleNativeObjects.opaquesArray.length > 0 ||
		this.currentVisibleNativeObjects.transparentsArray.length > 0 ||
		this.currentVisibleNativeObjects.excavationsArray.length > 0 ||
		this.currentVisibleNativeObjects.vectorTypeArray.length > 0||
		this.currentVisibleNativeObjects.pointTypeArray.length > 0)
	{ return true; }
	else
	{ return false; }

};

/**
 * Put the node to given node array
 * @param nodesArray
 * @param node
 */
VisibleObjectsController.prototype.putNativeObject = function(object) 
{
	// check if the object if opaque or transparent.
	if (object instanceof MagoRenderable) 
	{
		var isOpaque = object.isOpaque();
		//var isOpaque = true;
		if (isOpaque)
		{
		  this.currentVisibleNativeObjects.opaquesArray.push(object);
		}
		else 
		{
		  this.currentVisibleNativeObjects.transparentsArray.push(object);
		}
	}
	else if (object instanceof Excavation) 
	{
		this.currentVisibleNativeObjects.excavationsArray.push(object);
	}
	else 
	{
		this.currentVisibleNativeObjects.opaquesArray.push(object);
	}
};

VisibleObjectsController.prototype.getAllNatives = function() 
{
	var result = [];
	var nativeObjects = this.currentVisibleNativeObjects;
	for (var i in nativeObjects) 
	{
		if (nativeObjects.hasOwnProperty(i)) 
		{
			var nativeArray = nativeObjects[i];
			for (var j=0, len=nativeArray.length;j<len;j++) 
			{
				result.push(nativeArray[j]);
			}
		}
	}

	return result;
};

/**
 * 
 */
VisibleObjectsController.prototype.getObjectIdxSortedByDist = function(objectsArray, startIdx, endIdx, object) 
{
	// this do a dicotomic search of idx in a ordered table.
	// 1rst, check the range.
	var range = endIdx - startIdx;
	if (range < 6)
	{
		// in this case do a lineal search.
		var finished = false;
		var i = startIdx;
		var idx;

		while (!finished && i<=endIdx)
		{
			var anObject = objectsArray[i];
			if (object.distToCamera < anObject.distToCamera)
			{
				idx = i;
				finished = true;
			}
			i++;
		}
		
		if (finished)
		{ return idx; }
		else 
		{ return endIdx+1; }
	}
	else 
	{
		// in this case do the dicotomic search.
		var middleIdx = startIdx + Math.floor(range/2);
		var newStartIdx;
		var newEndIdx;
		var middleObject = objectsArray[middleIdx];
		if (middleObject.distToCamera > object.distToCamera)
		{
			newStartIdx = startIdx;
			newEndIdx = middleIdx;
		}
		else 
		{
			newStartIdx = middleIdx;
			newEndIdx = endIdx;
		}
		return this.getObjectIdxSortedByDist(objectsArray, newStartIdx, newEndIdx, object);
	}
};

/**
 * Put the object by distance from camera
 * @param {VisibleObjectsController}objectsArray
 * @param {Octree}object 
 */
VisibleObjectsController.prototype.putObjectToArraySortedByDist = function(objectsArray, object) 
{
	if (objectsArray.length > 0)
	{
		var startIdx = 0;
		var endIdx = objectsArray.length - 1;
		var idx = this.getObjectIdxSortedByDist(objectsArray, startIdx, endIdx, object);
		               
		
		objectsArray.splice(idx, 0, object);
	}
	else 
	{
		objectsArray.push(object);
	}
};

/**
 * Get the index of the node which is in nodesArray
 * @param nodesArray
 * @param {Number} startIdx
 * @param {Number} endIdx
 * @param node
 */
VisibleObjectsController.prototype.getNodeIdxSortedByDist = function(nodesArray, startIdx, endIdx, node) 
{
	// Note: Function exclusive to use with Node class objects.
	// this do a dicotomic search of idx in a ordered table.
	// 1rst, check the range.
	var neoBuilding = node.data.neoBuilding;
	var range = endIdx - startIdx;
	if (range < 6)
	{
		// in this case do a lineal search.
		var finished = false;
		var i = startIdx;
		var idx;

		while (!finished && i<=endIdx)
		{
			var aNode = nodesArray[i];
			if (node.data.distToCam < aNode.data.distToCam)
			{
				idx = i;
				finished = true;
			}
			i++;
		}
		
		if (finished)
		{ return idx; }
		else 
		{ return endIdx+1; }
	}
	else 
	{
		// in this case do the dicotomic search.
		var middleIdx = startIdx + Math.floor(range/2);
		var newStartIdx;
		var newEndIdx;
		var middleNode = nodesArray[middleIdx];
		if (middleNode.data.distToCam > node.data.distToCam)
		{
			newStartIdx = startIdx;
			newEndIdx = middleIdx;
		}
		else 
		{
			newStartIdx = middleIdx;
			newEndIdx = endIdx;
		}
		return this.getNodeIdxSortedByDist(nodesArray, newStartIdx, newEndIdx, node);
	}
};

/**
 * Calculates a boundingSphere for visibleArray.
 */
VisibleObjectsController.calculateBoundingSphereForArray = function(visiblesArray, resultBoundingSphere) 
{
	if (resultBoundingSphere === undefined)
	{ resultBoundingSphere = new BoundingSphere(); }
	
	var visiblesCount = visiblesArray.length;
	var bSphere;
	for (var i=0; i<visiblesCount; i++)
	{
		var visible = visiblesArray[i];
		if (visible === undefined)
		{ continue; }
		
		bSphere = visible.getBoundingSphereWC(bSphere);
		if (i === 0)
		{
			resultBoundingSphere.copyFrom(bSphere);
		}
		else 
		{
			resultBoundingSphere.addBSphere(bSphere);
		}
		
	}
	
	return resultBoundingSphere;
};

/**
 * Given a nodes array, this returns the nodes in the boundary of the nodes group.
 */
VisibleObjectsController.getBoundaryNodes = function(visiblesArray, resultBoundaryNodesArray) 
{
	if (resultBoundaryNodesArray === undefined)
	{ resultBoundaryNodesArray = []; }

	var minLonCandidate;
	var minLatCandidate;
	var maxLonCandidate;
	var maxLatCandidate;
	
	var minLonVisible;
	var maxLonVisible;
	var minLatVisible;
	var maxLatVisible;
	
	var visiblesCount = visiblesArray.length;
	for (var i=0; i<visiblesCount; i++)
	{
		var visible = visiblesArray[i];
		var geoCoord;
		if(visible instanceof Node)
		{
			geoCoord = visible.data.geographicCoord;
		}
		else if(visible instanceof MagoRenderable)
		{
			var geoLocationData = visible.getCurrentGeoLocationData();
			geoCoord = geoLocationData.geographicCoord;
		}

		if (i===0)
		{
			minLonCandidate = geoCoord.longitude;
			minLatCandidate = geoCoord.latitude;
			maxLonCandidate = geoCoord.longitude;
			maxLatCandidate = geoCoord.latitudes;
			minLonVisible = visible;
			maxLonVisible = visible;
			minLatVisible = visible;
			maxLatVisible = visible;
		}
		else
		{
			if (geoCoord.longitude < minLonCandidate)
			{ 
				minLonCandidate = geoCoord.longitude; 
				minLonVisible = visible;
			}
			else if (geoCoord.longitude > maxLonCandidate)
			{ 
				maxLonCandidate = geoCoord.longitude; 
				maxLonVisible = visible;
			}
			
			if (geoCoord.latitude < minLatCandidate)
			{ 
				minLatCandidate = geoCoord.latitude; 
				minLatVisible = visible;
			}
			else if (geoCoord.latitude > maxLatCandidate)
			{ 
				maxLatCandidate = geoCoord.latitude; 
				maxLatVisible = visible;
			}
		}
	}
	
	resultBoundaryNodesArray.push.apply(resultBoundaryNodesArray, [minLonVisible, maxLonVisible, minLatVisible, maxLatVisible]);
	return resultBoundaryNodesArray;
};

/**
 * Calculates a boundingFrustum for all visibles array, in other words, calculates the nearDist & farDist of the visibleNodes.
 */
VisibleObjectsController.prototype.calculateBoundingFrustum = function(camera) 
{
	var visiblesArray = this.currentVisibles0.concat(this.currentVisibles1, this.currentVisibles2, this.currentVisibles3);//, this.currentVisibleNativeObjects);
	var visibleNativesArray = this.getAllNatives();

	[].push.apply(visiblesArray, visibleNativesArray);
	
	if (visiblesArray.length === 0)
	{ return; }

	var camPos = camera.getPosition();
	var camDir = camera.getDirection();
	var camPosCopy = new Point3D(camPos.x, camPos.y, camPos.z);
	var camDirCopy = new Point3D(camDir.x, camDir.y, camDir.z);
	var camDirLine = new Line(camPosCopy, camDirCopy);

	var filteredVisiblesArray = [];
	filteredVisiblesArray = VisibleObjectsController.getBoundaryNodes(visiblesArray, filteredVisiblesArray);
	
	var nearSquareDistCandidate = 10E10;
	var farSquareDistCandidate = 0.0;
	var vecAux = new Point3D();
	
	var nodesCount = filteredVisiblesArray.length;
	for (var i=0; i<nodesCount; i++)
	{
		var visible = filteredVisiblesArray[i];
		var bSphere = visible.getBoundingSphereWC(bSphere);
		if (!bSphere)
		{ continue; }
		
		var centerPoint = bSphere.getCenterPoint();
		var radius = bSphere.getRadius();
		var projectedPoint = camDirLine.getProjectedPoint(centerPoint, undefined);
		var nearPoint = new Point3D(projectedPoint.x - camDir.x * radius, projectedPoint.y - camDir.y * radius, projectedPoint.z - camDir.z * radius);
		var farPoint = new Point3D(projectedPoint.x + camDir.x * radius, projectedPoint.y + camDir.y * radius, projectedPoint.z + camDir.z * radius);
		
		var currNearSquareDist = camPos.squareDistTo(nearPoint.x, nearPoint.y, nearPoint.z);
		var currFarSquareDist = camPos.squareDistTo(farPoint.x, farPoint.y, farPoint.z);
		
		// must check if the nearPoint is rear of the camera.
		if (nearSquareDistCandidate > 0.0)
		{
			vecAux.set(nearPoint.x - camPos.x, nearPoint.y - camPos.y, nearPoint.z - camPos.z);
			var dotProd = camDir.scalarProduct(vecAux);
			if (dotProd < 0.0)
			{
				// the nearPoint is rear of the camera.
				currNearSquareDist = 0.0;
			}
		}
		else
		{ currNearSquareDist = 0.0; }
		
		
		if (i === 0)
		{
			nearSquareDistCandidate = currNearSquareDist;
			farSquareDistCandidate = currFarSquareDist;
		}
		else
		{
			if (currNearSquareDist < nearSquareDistCandidate)
			{ nearSquareDistCandidate = currNearSquareDist; }
			
			if (currFarSquareDist > farSquareDistCandidate)
			{ farSquareDistCandidate = currFarSquareDist; }
		}
	}
	
	this.bFrustumNear = Math.sqrt(nearSquareDistCandidate);
	this.bFrustumFar = Math.sqrt(farSquareDistCandidate);
};

/**
 * Calculates a boundingSphere for all visibles array.
 */
VisibleObjectsController.prototype.calculateBoundingSpheres = function() 
{
	//this.currentVisibles0; 
	//this.currentVisibles1; 
	//this.currentVisibles2; 
	//this.currentVisibles3; 
	//this.currentVisiblesAux; // todo:
	//this.currentVisibleNativeObjects;  // todo:
	
	// check currentVisibles & make a boundingSphere for each visibles array.
	if (this.bSphere === undefined)
	{ this.bSphere = new BoundingSphere(); }

	var visiblesArray = this.currentVisibles0.concat(this.currentVisibles1, this.currentVisibles2, this.currentVisibles3);
	
	if (visiblesArray.length === 0)
	{ return; }

	var filteredVisiblesArray = [];
	filteredVisiblesArray = VisibleObjectsController.getBoundaryNodes(visiblesArray, filteredVisiblesArray);
	this.bSphere = VisibleObjectsController.calculateBoundingSphereForArray(filteredVisiblesArray, this.bSphere);
};

/**
 * Put the node to given node array
 * @param nodesArray
 * @param node
 */
VisibleObjectsController.prototype.putNodeToArraySortedByDist = function(nodesArray, node) 
{
	// Note: Function exclusive to use with Node class objects.
	if (nodesArray.length > 0)
	{
		var startIdx = 0;
		var endIdx = nodesArray.length - 1;
		var idx = this.getNodeIdxSortedByDist(nodesArray, startIdx, endIdx, node);
		
		nodesArray.splice(idx, 0, node);
	}
	else 
	{
		nodesArray.push(node);
	}
};

/**
 * Put the node to given node array
 * @param nodesArray
 * @param node
 */
VisibleObjectsController.prototype.putNodeByLod = function(node, lod) 
{
	if (lod === 0 || lod === 1) 
	{
		this.putNodeToArraySortedByDist(this.currentVisibles0, node);
	}
	else if (lod === 2) 
	{
		this.putNodeToArraySortedByDist(this.currentVisibles2, node);
	}
	else if (lod > 2) 
	{
		this.putNodeToArraySortedByDist(this.currentVisibles3, node);
	}
};

/**
 * Put the node to given node array
 * @param nodesArray
 * @param node
 */
VisibleObjectsController.prototype.putNodeByProjectType = function(node) 
{
	this.putNodeToArraySortedByDist(this.currentVisiblesPT10, node);
};















