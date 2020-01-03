'use strict';
/**
 * point3d 데이터 cluster
 *
 * @param {Point3DList} point3DList 
 * @param {number} pixelRange cluster 범위, 사각형의 한변의 길이, default 20m
 * @param {number} minSize cluster 표현의 최소 크기, 기본값은 2
 */
var Cluster = function(point3DList, range, minSize) 
{
	MagoRenderable.call(this);
    
	if (point3DList && point3DList instanceof Point3DList) 
	{
		this.point3DList = point3DList;
		this.bush = rbush();
		for (var i=0, len=point3DList.getPointsCount();i<len;i++) 
		{
			var p3d = point3DList.getPoint(i);
			p3d.id = i;
			var geoCoord = ManagerUtils.pointToGeographicCoord(p3d);
			geoCoord.id = i;
			var item = {
				minX  : geoCoord.longitude,
				minY  : geoCoord.latitude,
				maxX  : geoCoord.longitude,
				maxY  : geoCoord.latitude,
				value : geoCoord
			};
			this.bush.insert(item);
		}
	}
	else 
	{
		throw new Error('point3DList is required');
	}
    
	this.range = defaultValue(range, 10);
	this.minSize = defaultValue(minSize, 2);
	this.isMaking = false;
};
Cluster.prototype = Object.create(MagoRenderable.prototype);
Cluster.prototype.constructor = Cluster;

Cluster.prototype.setRange = function(range) 
{
	if (isNaN(range))
	{
		throw new Error('range must number.');
	}

	this.range = range;
	this.setDirty(true);
};

Cluster.prototype.render = function(magoManager, shader, renderType, glPrimitive, bIsSelected) 
{
	if (this.attributes && this.attributes.isVisible !== undefined && this.attributes.isVisible === false) 
	{
		return;
	}
    
	if (this.dirty)
	{ this.makeCluster(magoManager); }
	
	if (this.objectsArray.length === 0)
	{ return false; }

	var objectsCount = this.objectsArray.length;
	for (var i=0; i<objectsCount; i++)
	{
		this.objectsArray[i].render(magoManager, shader, renderType, glPrimitive, bIsSelected);
	}
};

Cluster.prototype.makeCluster = function(magoManager) 
{
	this.objectsArray = [];
	var pointCnt = this.point3DList.getPointsCount();
	if (pointCnt < 1) { return false; }
	
	this.isMaking = true;
	var gl = magoManager.getGl();

	var clusterObj = {};
	
	for (var i = 0;i<pointCnt;i++) 
	{
		if (!clusterObj[i]) 
		{
			var point3D = this.point3DList.getPoint(i);
        
			var pixel = ManagerUtils.calculateWorldPositionToScreenCoord(gl, point3D.x, point3D.y, point3D.z, undefined, magoManager);

			var screenExtent = BoundingBox.getBBoxByPonintAndSize(pixel, this.range);
			//ManagerUtils.screenCoordToWorldCoord = function(gl, pixelX, pixelY, resultWCPos, depthFbo, frustumNear, frustumFar, magoManager) 
			var leftBottom = ManagerUtils.screenCoordToWorldCoord(gl, screenExtent.minX, screenExtent.minY, leftBottom, undefined, undefined, undefined, magoManager);
			var rightTop = ManagerUtils.screenCoordToWorldCoord(gl, screenExtent.maxX, screenExtent.maxY, rightTop, undefined, undefined, undefined, magoManager);

			
			if (!leftBottom || !rightTop) 
			{
				continue;
			}

			var leftBottomGeoCoord = ManagerUtils.pointToGeographicCoord(leftBottom);
			var rightTopGeoCoord = ManagerUtils.pointToGeographicCoord(rightTop);

			var searchObj = {
				minX : leftBottomGeoCoord.longitude,
				minY : rightTopGeoCoord.latitude,
				maxX : rightTopGeoCoord.longitude,
				maxY : leftBottomGeoCoord.latitude
			};

			var clusterPoint3D;
			var clusterCnt = 0;
			
			var searched = this.bush.search(searchObj);
			if (searched.length > 0 )
			{
				var auxP3d = new Point3D(0, 0, 0);
				for (var j=0, searchedLen=searched.length;j<searchedLen;j++) 
				{
					var searchedValue = searched[j].value;
					var id = searchedValue.id;

					if (!clusterObj[id]) 
					{
						clusterObj[id] = true;

						var auxPoint3D = this.point3DList.getPoint(id);
						auxP3d.add(auxPoint3D.x, auxPoint3D.y, auxPoint3D.z);
						
						clusterCnt++;
					}
				}
				clusterPoint3D = auxP3d.scale(1/clusterCnt);
			}
			else 
			{
				clusterCnt = 1;
				clusterObj[point3D.id] = true;
				clusterPoint3D = new Point3D(point3D.x, point3D.y, point3D.z);
			}

			var sphereOptions = {};
			var color = new Color();
			color.setRGB(0.99, 0.1, 0.1);
			sphereOptions.color = color;
			
			var s = new Sphere(sphereOptions);
			s.setRadius(clusterCnt * 100);

			var geoCoord = ManagerUtils.pointToGeographicCoord(clusterPoint3D);
			var geoLocDataManager = new GeoLocationDataManager();
			var geoLocData = geoLocDataManager.newGeoLocationData('noName');
			geoLocData = ManagerUtils.calculateGeoLocationData(geoCoord.longitude, geoCoord.latitude, 0, 0, 0, 0, geoLocData);
			s.geoLocDataManager = geoLocDataManager;

			this.objectsArray.push(s);
		}
	}
	
	this.dirty = false;
	this.isMaking = false;
};