'use strict';
/**
 * point2d 데이터 cluster
 *
 * @param {Point3DList} point2DList 
 * @param {number} depth
 * @param {MagoManager} magoMangaer
 * @param {function} customRenderFunc optional
 */
var Cluster = function(point2DList, depth, magoMangaer, customRenderFunc) 
{
    
	if (!point2DList || !point2DList instanceof Point2DList) 
	{
		throw new Error('point2DList is required');
	}
	this.point2DList = point2DList;
	this.depth = defaultValue(depth, 8);

	this.quatTree;
	this.magoMangaer = magoMangaer;

	this.renderFunction = (customRenderFunc && typeof customRenderFunc === 'function') ? customRenderFunc : this.defaultRenderFunc;

	this.initQuatTree();
};

Cluster.prototype.initQuatTree = function() 
{
	var treeOption = this.getTreeOption();
	this.quatTree = new QuatTree(treeOption);
	this.quatTree.data = this.point2DList.pointsArray;

	this.makeTreeByDepth();
};

Cluster.prototype.getTreeOption = function() 
{
	var br = this.point2DList.getBoundingRectangle();

	var xLength = br.getXLength();
	var yLength = br.getYLength();
	var center = br.getCenterPoint();
	
	if (xLength < 0.03) { xLength = 0.03; }
	if (yLength < 0.03) { yLength = 0.03; }
	return {
		halfWidth  : xLength/2,
		halfHeight : yLength/2,
		center     : center
	};
};

Cluster.prototype.addPoint = function(point) 
{
	this.point2DList.addPoint(point);
	this.initQuatTree();
};

Cluster.prototype.deletePointByCondition = function(condition)
{
	this.point2DList.deletePointByCondition(condition);

	if (this.point2DList.getPointsCount() > 0 ) 
	{
		this.initQuatTree();
	}
	else 
	{
		this.quatTree = undefined;

		this.magoMangaer.objMarkerManager.setMarkerByCondition(function(om)
		{
			return !om.tree;
		});
	}
	
};

Cluster.prototype.updatePoint = function(point, findOption)
{
	var findPoint = this.point2DList.findPointArray(findOption)[0];
	findPoint.set(point.getX(), point.getY());
	var keys = Object.keys(findPoint);

	for (var i=0, len=keys.length;i<len;i++) 
	{
		var key = keys[i];
		findPoint[key] = point[key];
	}

	this.initQuatTree();
};

Cluster.prototype.makeTreeByDepth = function() 
{
	this.quatTree.makeTreeByDepth(this.depth);
};

Cluster.prototype.defaultRenderFunc = function(trees, magoManager) 
{
	magoManager.objMarkerManager.loadDefaultImages(magoManager);
	magoManager.objMarkerManager.objectMarkerArray = [];

	var treeLength = trees.length;
	for (var i=0;i<treeLength;i++) 
	{
		var tree = trees[i];
		if (tree.hasChildren()) 
		{
			var points = tree.displayPointsArray;

			var pointLength = points.length;
			for (var j=0;j<pointLength;j++) 
			{
				var point = points[j];
				var mass = point.mass;

				if (mass > 50) { mass=50; }
				if (mass < 15) { mass = 15; }
				var options = {
					positionWC    : point,
					imageFilePath : "defaultRed",
					sizeX         : mass,
					sizeY         : mass
				};
				magoManager.objMarkerManager.newObjectMarker(options, magoManager);
			}
		}
		else 
		{
			var points = tree.data;
			if (points) 
			{
				var pointLength = points.length;
				for (var j=0;j<pointLength;j++) 
				{
					var point = points[j];
					
					var options = {
						positionWC    : ManagerUtils.geographicCoordToWorldPoint(point.x, point.y, 0),
						imageFilePath : "defaultBlue",
						sizeX         : 8,
						sizeY         : 8
					};
					magoManager.objMarkerManager.newObjectMarker(options, magoManager);
				}
			}
		}
	}
};