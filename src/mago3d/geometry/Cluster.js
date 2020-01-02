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
	
	var gl = magoManager.getGl();

	var clusterObj = {};
	
	for (var i = 0;i<pointCnt;i++) 
	{
		if (!clusterObj[i]) 
		{
			var point3D = this.point3DList.getPoint(i);
        
			var pixel = ManagerUtils.calculateWorldPositionToScreenCoord(gl, point3D.x, point3D.y, point3D.z, undefined, magoManager);

			var screenExtent = BoundingBox.getBBoxByPonintAndSize(pixel, this.range);

			var leftBottom = ManagerUtils.cameraCoordPositionToWorldCoord(new Point3D(screenExtent.minX, screenExtent.minY, screenExtent.minZ), leftBottom, magoManager);
			var rightTop = ManagerUtils.cameraCoordPositionToWorldCoord(new Point3D(screenExtent.maxX, screenExtent.maxY, screenExtent.maxZ), rightTop, magoManager);

			var leftBottomGeoCoord = ManagerUtils.pointToGeographicCoord(leftBottom);
			var rightTopGeoCoord = ManagerUtils.pointToGeographicCoord(rightTop);

			var searchObj = {
				minX : leftBottomGeoCoord.longitude,
				minY : leftBottomGeoCoord.latitude,
				maxX : rightTopGeoCoord.longitude,
				maxY : rightTopGeoCoord.latitude
			};

			var searched = this.bush.search(searchObj);
			if (searched.length > 0 )
			{
				console.info(searched);
			}
			
			/*var clusterCnt = 0;
			var auxX = 0;
			var auxY = 0;
			var auxZ = 0;
			// this code fuck
			for (var j = 0;j<pointCnt;j++) 
			{
				if (!clusterObj[j]) 
				{
					var auxPoint3D = this.point3DList.getPoint(j);
        
					var auxPixel = ManagerUtils.calculateWorldPositionToScreenCoord(gl, auxPoint3D.x, auxPoint3D.y, auxPoint3D.z, undefined, magoManager);
					if (extent.intersectWithPoint(auxPixel)) 
					{
						clusterObj[j] = true;

						auxX += auxPoint3D.x;
						auxY += auxPoint3D.y;
						auxZ += auxPoint3D.z;
						clusterCnt++;
					}
				}
			}

			var clusterPoint3D = new Point3D(auxX/clusterCnt, auxY/clusterCnt, auxZ/clusterCnt);

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

			this.objectsArray.push(s);*/
		}
	}
	
	this.dirty = false;
};