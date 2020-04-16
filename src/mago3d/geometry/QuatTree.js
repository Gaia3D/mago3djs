'use strict';

var QuatTree = function(options, magoManager) 
{

	//TODO : center width height required
	// QuatTree index
	// +-----+-----+ 
	// |  3  |  2  | 
	// +-----+-----+ 
	// |  0  |  1  | 
	// +-----+-----+ 
	var that = this;
	that.center = options.center || undefined;
	that.halfWidth = options.halfWidth || undefined;
	that.halfHeight = options.halfHeight || undefined;

	that.quatOwner = options.quatOwner || undefined;
	
	that.renderFunc = options.renderFunc || that.defaultRender;

	that.numberName;

	that.depth = 0;
	that.children;
	that.data;
	that.dirty = true;
    
	var camPos;
	var camDir;
	this.magoManager = magoManager;	

	// testtest
	this.displayPointsArray; // provisionally there are only one.
	this.realDatasCount;
	this.numberName;
	if (!this.quatOwner)
	{
		this.numberName = 1;
	}
};
QuatTree.CHILDREN_CNT = 4;
QuatTree.getLimitDistByRadius = function(radius) 
{
	return radius*1.5;
};
QuatTree.prototype.init = function() 
{
	this.children = undefined;
	this.data = undefined;
	this.dirty = true;
	this.displayPointsArray = undefined; // provisionally there are only one.
	this.realDatasCount = undefined;
};

QuatTree.prototype.hasChildren = function() 
{
	return this.children && Array.isArray(this.children) && this.children.length > 0;
};

QuatTree.prototype.hasData = function() 
{
	return this.data && Array.isArray(this.data) && this.data.length > 0;
};

QuatTree.prototype.getDisplayPoints = function(result) 
{
	if (!result) 
	{
		result = [];
	}
	if (!this.displayPointsArray || this.displayPointsArray.length === 0)
	{
		if (this.hasChildren())
		{
			var childCount = this.children.length;
			var displayPoints = [];
			var myDispPoint = new Point3D(0, 0, 0);
			
			for (var i=0; i<childCount; i++)
			{
				displayPoints = this.children[i].getDisplayPoints(displayPoints);
			}
			var displPointsCount = displayPoints.length;
			var totalMass = 0;
			for (var i=0; i<displPointsCount; i++)
			{
				var dataPoint = displayPoints[i];
				var mass = dataPoint.mass;

				var dataPointCopy = new Point3D(dataPoint.x, dataPoint.y, dataPoint.z);
				dataPointCopy.scale(mass);
				myDispPoint.addPoint(dataPointCopy);
				totalMass += mass;
			}
			myDispPoint.scale(1.0/totalMass);
			myDispPoint.mass = totalMass;

			this.displayPointsArray = [];
			this.displayPointsArray.push(myDispPoint);
		}
		else
		{
			// This is leaf quatree.
			// Calculate center of mass.
			if (this.hasData()) 
			{
				var datasCount = this.data.length;
				var displayDataPoint = new Point3D(0, 0, 0);
				for (var i=0; i<datasCount; i++)
				{
					var dataPoint = this.data[i];
					displayDataPoint.addPoint(ManagerUtils.geographicCoordToWorldPoint(dataPoint.x, dataPoint.y, 0));
				}
				displayDataPoint.scale(1.0/datasCount);
				displayDataPoint.mass = datasCount;

				this.displayPointsArray = [];
				this.displayPointsArray.push(displayDataPoint);
			}
		}
		
	}
	if (this.displayPointsArray) 
	{
		result.push.apply(result, this.displayPointsArray);
	}
	
	
	return result;
};

QuatTree.prototype.getQuatTreeByCamDistance = function(result, camPosWc) 
{
	if (!result) 
	{
		result = [];
	}

	if (!this.bSphereWC) 
	{
		this.makeBSphereWC();
	}
	var bSphereWC = this.bSphereWC;
	var distance = camPosWc.distToSphere(bSphereWC);
	
	var limitDist = QuatTree.getLimitDistByRadius(bSphereWC.getRadius());
	
	//find children
	if (distance < limitDist) 
	{
		if (this.children) 
		{
			var childCnt = this.children.length;
			for (var i =0;i<childCnt;i++) 
			{
				var child = this.children[i];
				child.getQuatTreeByCamDistance(result, camPosWc);
			}
		}
		else 
		{
			if (this.data) 
			{
				result.push(this);
			}
		}
	}
	else 
	{
		if (this.displayPointsArray) 
		{
			result.push(this);
		}
	}

	return result;
};
QuatTree.prototype.makeBSphereWC = function() 
{
	//ManagerUtils.geographicCoordToWorldPoint = function(longitude, latitude, altitude
	var pos1 = this.center;
	var pos2x = this.center.x + this.halfWidth;
	var pos2y = this.center.y + this.halfHeight;
	var pos2 = new Point2D(pos2x, pos2y);

	var posWC1 = ManagerUtils.geographicCoordToWorldPoint(pos1.x, pos1.y, 0);
	var posWC2 = ManagerUtils.geographicCoordToWorldPoint(pos2.x, pos2.y, 0);

	var radius = posWC1.distToPoint(posWC2);

	this.bSphereWC = new BoundingSphere(posWC1.x, posWC1.y, posWC1.z, radius);
};
QuatTree.prototype.setData = function(point2DArray)
{
	if (!this.data) 
	{
		this.data = [];
	}
	var length = point2DArray.length;
	for (var i=0;i<length;i++) 
	{
		var point2D = point2DArray[i];
		this.pushData(point2D);
	}
};
QuatTree.prototype.pushData = function(point2D)
{
	var mvm = this.magoManager.sceneState.modelViewProjMatrix;
	var testcc = mvm.transformPoint4D__test([point2D.x, point2D.y, point2D.z, 1.0]);
	var testccw = testcc[3];
	var px = testcc[0]/testccw;
	var py = testcc[1]/testccw;
	
	if (px < 1 && px > -1 && py < 1 && py > -1) 
	{
		var p = new Point2D(px, py);
		p.orgPos = point2D;
		this.data.push(p);
	}
};
QuatTree.prototype.addPoint2DToChild = function(point2D) 
{
	var x = point2D.x;
	var y = point2D.y;
	var center = this.center;
	var idx;
	if (x < center.x) 
	{
		if (y < center.y) 
		{
			idx = 0;
		}
		else 
		{
			idx = 3;
		}
	}
	else 
	{
		if (y < center.y) 
		{
			idx = 1;
		}
		else 
		{
			idx = 2;
		}
	}
    
	if (!this.children) 
	{
		this.createChildren();
	}

	if (!this.children[idx].data) 
	{
		this.children[idx].data = [];
	}
	this.children[idx].data.push(point2D);
};

QuatTree.prototype.createChildren = function() 
{
	this.children = [];
	var opt = {};
	opt.quatOwner = this;

	// +-----+-----+ 
	// |  3  |  2  | 
	// +-----+-----+ 
	// |  0  |  1  | 
	// +-----+-----+

	var minx = this.center.x - this.halfWidth;
	var miny = this.center.y - this.halfHeight;
	var maxx = this.center.x + this.halfWidth;
	var maxy = this.center.y + this.halfHeight;
	var midx = this.center.x;
	var midy = this.center.y;

	var child0 = new QuatTree(opt, this.magoManager);
	child0.depth = this.depth+1;
	child0.numberName = this.numberName*10 +1;
	child0.setSize(minx, miny, midx, midy);
	var child1 = new QuatTree(opt, this.magoManager);
	child1.depth = this.depth+1;
	child1.numberName = this.numberName*10 +2;
	child1.setSize(midx, miny, maxx, midy);
	var child2 = new QuatTree(opt, this.magoManager);
	child2.depth = this.depth+1;
	child2.numberName = this.numberName*10 +3;
	child2.setSize(midx, midy, maxx, maxy);
	var child3 = new QuatTree(opt, this.magoManager);
	child3.depth = this.depth+1;
	child3.numberName = this.numberName*10 +4;
	child3.setSize(minx, midy, midx, maxy);

	this.children.push(child0);
	this.children.push(child1);
	this.children.push(child2);
	this.children.push(child3);
};

QuatTree.prototype.setSize = function(minX, minY, maxX, maxY) 
{
	var centerX = (maxX + minX) / 2;
	var centerY = (maxY + minY) / 2;

	this.center = new Point2D(centerX, centerY);
	this.halfWidth = (maxX - minX)/2;
	this.halfHeight = (maxY - minY)/2;
};

QuatTree.prototype.makeTreeByDepth = function(targetDepth) 
{
	if (this.depth >= targetDepth) 
	{
		return;
	}

	if (this.data) 
	{
		var dataCnt = this.data.length;
		for (var i=0;i<dataCnt;i++) 
		{
			var point = this.data[i];
			this.addPoint2DToChild(point);
		}
		delete this.data;
	}

	
	if (this.children) 
	{
		var childLength = this.children.length;
		for (var i=0;i<childLength;i++) 
		{
			this.children[i].makeTreeByDepth(targetDepth);
		}
	}

	this.dirty = false;
};

QuatTree.prototype.extractLeaf = function(resultArray) 
{
	if (!resultArray || !Array.isArray(resultArray)) 
	{
		resultArray = [];
	}
	if (this.data && this.data.length > 0 ) 
	{
		resultArray.push(this);
	}
	
	if (this.children) 
	{
		var childLength = this.children.length;
		for (var i=0;i<childLength;i++) 
		{
			this.children[i].extractLeaf(resultArray);
		}
	}
	return resultArray;
};


QuatTree.prototype.defaultRender = function(leafArray) 
{
	if (!leafArray) 
	{
		return;
	}
	this.magoManager.objMarkerManager.objectMarkerArray = [];
	var leafArrayLength = leafArray.length;
	for (var i=0;i<leafArrayLength;i++) 
	{
		var leaf = leafArray[i];
		var leafData = leaf.data;
		var bbox = new BoundingBox();
		var cnt = leafData.length;
		for (var j=0;j<cnt;j++ ) 
		{
			var data = leafData[j];
			if (j === 0) 
			{
				bbox.init(data.orgPos);
			}
			else 
			{
				bbox.addPoint(data.orgPos);
			}
		}

		var bbcenter = bbox.getCenterPoint();
		if (cnt > 50) { cnt = 50; }
		var sizeX = cnt;
		var sizeY = cnt;

		if (sizeX < 5.0)
		{ sizeX = 5.0; }
		if (sizeY < 5.0)
		{ sizeY = 5.0; }

		var posWC = new Point3D(bbcenter.x, bbcenter.y, bbcenter.z);
		var options = {
			positionWC            : posWC,
			imageFilePath         : "defaultBlue",
			imageFilePathSelected : "defaultRed",
			sizeX                 : sizeX,
			sizeY                 : sizeY
		};
		this.magoManager.objMarkerManager.newObjectMarker(options, this.magoManager);
	}
};