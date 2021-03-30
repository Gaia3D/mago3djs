'use strict';
/**
 * 줌 컨트롤
 * @exception {Error} Messages.CONSTRUCT_ERROR
 * 
 * @constructor
 * @class Zoom
 * @param {Zoom~Options} options position info. coordinate. required.
 *  
 * @extends AbsControl
 * 
 */
var OverviewMap = function(options) 
{
	if (!(this instanceof OverviewMap)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	var element = document.createElement('div');
	options = options ? options : {};
	options.element = element;
	
	AbsControl.call(this, options);
    
	var id = 'mago3dOlMap';
	element.id = id;
	element.style.position = 'absolute';
	element.style.pointerEvents = 'auto';
	element.style.borderRadius = '4px';
	element.style.padding = '2px';
	element.style.bottom = '.5em';
	element.style.right = '.5em';
	element.style.width = '135px';
	element.style.height = '135px';
	element.style.borderRadius = '4px';
	element.style.border = '2px solid #CCE5EC';
};

OverviewMap.prototype = Object.create(AbsControl.prototype);
OverviewMap.prototype.constructor = OverviewMap;

OverviewMap.prototype.setControl = function(magoManager)
{
	this.magoManager = magoManager;

	if(!this.magoManager.scene)
	{
		return;
	}

	var target = this.target ? this.target : this.magoManager.defaultControlContainer;
	target.appendChild(this.element);
    

	var vectorlayer = new OlMago3d.layer.VectorLayer({
		source: new OlMago3d.source.VectorSource()
	});

	var imageryLayers = this.magoManager.scene.globe.imageryLayers;
	var baseLayerIndex = imageryLayers._layers.findIndex(function(l){return l.isBaseLayer()});
	var baseLayer = imageryLayers.get(baseLayerIndex);
	var provider = baseLayer.imageryProvider;

	var source;
	var minZoom = 0;
	if(provider instanceof Cesium.WebMapServiceImageryProvider) {
		var resource = provider._resource;
		//var queryParam = JSON.parse(JSON.stringify(resource.queryParameters));
		var queryParam = {};
		queryParam['TILED'] = true;
		for(var key in resource.queryParameters) {
			if(key !== 'bbox' && key !== 'height' && key !== 'width') {
				queryParam[key.toUpperCase()] = resource.queryParameters[key]; 
			}
		}

		source = new OlMago3d.source.TileWMS({
			url : provider.url,
			serverType : 'geoserver',
			params : queryParam
		});
		minZoom = 1;
	} else if(provider instanceof Cesium.ArcGisMapServerImageryProvider) {
		source = new OlMago3d.source.XYZ({
			url : 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
		});
	} else if(provider instanceof Cesium.UrlTemplateImageryProvider) {
		source = new OlMago3d.source.XYZ({
			url : provider.url
		});
	}
    
	var tilelayer = new OlMago3d.layer.TileLayer({
		source: source,
		minZoom : minZoom
	});
    
	this.overviewMap = new OlMago3d.Map({
		target : 'mago3dOlMap',
		view   : new OlMago3d.View({
			zoom       : 3,
			center     : [0, 0],
			projection : 'EPSG:4326'
		}),
		layers   : [tilelayer, vectorlayer],
		controls : OlMago3d.control.defaults({
			attribution : true,
			zoom        : false,
			rotate      : false,
		}),
		interactions: OlMago3d.interaction.defaults({
			altShiftDragRotate : false,
			onFocusOnly        : false,
			doubleClickZoom    : false,
			keyboard           : false,
			mouseWheelZoom     : false,
			shiftDragZoom      : false,
			dragPan            : false,
			pinchRotate        : false,
			pinchZoom          : false
		})
	});
    
	this.overviewMap.overlayContainerStopEvent_.style.pointerEvents = 'none';

	if (this.magoManager.isCesiumGlobe())
	{
		var scene = this.magoManager.scene;
		var feature = null;

		var map = this.overviewMap;
		var view = map.getView();
		var toLonLat = OlMago3d.proj.getTransform(view.getProjection(), 'EPSG:4326');
		var fromLonLat = OlMago3d.proj.getTransform('EPSG:4326', view.getProjection());
        
		syncByMago();
		view.on('change:resolution', function()
		{
			//syncByOl();
		});
		view.on('change:center', function()
		{
			//syncByOl();
		});
    
		view.on('change:rotation', function()
		{
			//syncByOl();
		});
    
		this.magoManager.on('isCameraMoved', function()
		{
			syncByMago();
		});

		function syncByMago()
		{
			var viewRectangle = scene.camera.computeViewRectangle(scene.globe.ellipsoid);
            
			var minx = (viewRectangle.west < viewRectangle.east) ? viewRectangle.west : viewRectangle.east;
			var miny = (viewRectangle.south < viewRectangle.north) ? viewRectangle.south : viewRectangle.north;
			var maxx = (viewRectangle.west > viewRectangle.east) ? viewRectangle.west : viewRectangle.east;
			var maxy = (viewRectangle.south > viewRectangle.north) ? viewRectangle.south : viewRectangle.north;

			var extent = [Cesium.Math.toDegrees(minx), Cesium.Math.toDegrees(miny), Cesium.Math.toDegrees(maxx), Cesium.Math.toDegrees(maxy)];
			var geomPolygon = OlMago3d.geom.Polygon.fromExtent(extent);
			
			if (!feature)
			{
				feature = new OlMago3d.Feature({
					geometry: geomPolygon
				});
				vectorlayer.getSource().addFeature(feature);
			}
			else 
			{
				feature.setGeometry(geomPolygon);
			}
            
			var ellipsoid = Cesium.Ellipsoid.WGS84;
			var canvas = scene.canvas;
			var canvasCenter = new Cesium.Cartesian2(canvas.clientWidth / 2, canvas.clientHeight / 2);
			var ray = scene.camera.getPickRay(canvasCenter);
			var targetCenter = scene.globe.pick(ray, scene) || scene.camera.pickEllipsoid(canvasCenter);

			var bestTarget = targetCenter;
			if (!bestTarget) 
			{
				//TODO: how to handle this properly ?
				var globe = scene.globe;
				var carto = scene.camera.positionCartographic.clone();
				var height = globe.getHeight(carto);
				carto.height = height || 0;
				bestTarget = Cesium.Ellipsoid.WGS84.cartographicToCartesian(carto);
			}

			var distance = Cesium.Cartesian3.distance(bestTarget, scene.camera.position);
			view.fit(extent, {size: getSizeByDistance(distance)});
			return;
			var ellipsoid = Cesium.Ellipsoid.WGS84;
			var canvas = scene.canvas;
			var canvasCenter = new Cesium.Cartesian2(canvas.clientWidth / 2, canvas.clientHeight / 2);
			var ray = scene.camera.getPickRay(canvasCenter);
			var targetCenter = scene.globe.pick(ray, scene) || scene.camera.pickEllipsoid(canvasCenter);

			var bestTarget = targetCenter;
			if (!bestTarget) 
			{
				//TODO: how to handle this properly ?
				var globe = scene.globe;
				var carto = scene.camera.positionCartographic.clone();
				var height = globe.getHeight(carto);
				carto.height = height || 0;
				bestTarget = Cesium.Ellipsoid.WGS84.cartographicToCartesian(carto);
			}

			var distance = Cesium.Cartesian3.distance(bestTarget, scene.camera.position);
			var bestTargetCartographic = ellipsoid.cartesianToCartographic(bestTarget);
            
			var properties = {};
			//var c = fromLonLat(toDegree(bestTargetCartographic.longitude), toDegree(bestTargetCartographic.latitude));
			properties.center = [toDegree(bestTargetCartographic.longitude), toDegree(bestTargetCartographic.latitude)];
			properties.resolution = calcResolutionForDistance(canvas, distance, bestTargetCartographic ? bestTargetCartographic.latitude : 0);

			view.setProperties(properties, true);
			view.changed();

			function calcResolutionForDistance(cv, dis, lat)
			{
				var fovy = scene.camera.frustum.fovy;
				var metersPerUnit = view.getProjection().getMetersPerUnit();

				var visibleMeters = 2 * dis * Math.tan(fovy / 2);
				var relativeCircumference = Math.cos(Math.abs(lat));
				var visibleMapUnits = visibleMeters / metersPerUnit / relativeCircumference;
				var resolution = visibleMapUnits / cv.clientHeight;

				return resolution;
			}
		}

		function syncByOl()
		{     
			var center = view.getCenter();
			if (!center)
			{
				return;
			}

			var ll = toLonLat(center);
			var carto = new Cesium.Cartographic(toRadian(ll[0]), toRadian(ll[1]));
			if (scene.globe)
			{
				carto.height = scene.globe.getHeight(carto) || 0;
			}

			var destination = Cesium.Ellipsoid.WGS84.cartographicToCartesian(carto);
			var oritentation = {
				pitch   : 0 - Cesium.Math.PI_OVER_TWO,
				heading : -view.getRotation(),
				roll    : undefined
			};

			scene.camera.setView({
				destination,
				oritentation
			});

			scene.camera.moveBackward(calcDistanceForResolution(view.getResolution(), toRadian(ll[1])));
            
			function calcDistanceForResolution(res, lat)
			{
				var canvas = scene.canvas;
				var fovy = scene.camera.frustum.fovy;

				var metersPerUnit = view.getProjection().getMetersPerUnit();
				var visibleMapUnits = res * canvas.clientHeight;
				var relativeCircumference = Math.cos(Math.abs(lat));

				var visibleMeters = visibleMapUnits * metersPerUnit * relativeCircumference;
				var requiredDistance = (visibleMeters / 2) / Math.tan(fovy / 2);

				return requiredDistance;
			}
		}
		function getSizeByDistance(d)
		{
			var num = 0;
			if (d < 5000)
			{
				num = 90;
			}
			else if (d < 20000)
			{
				num = 70;
			}
			else if (d < 70000)
			{
				num = 50;
			}
			else 
			{
				num = 30;
			}

			return [num, num];
		}

		function toRadian(deg)
		{
			return deg * Math.PI / 180;
		}

		function toDegree(rad)
		{
			return rad * 180 /Math.PI;
		}
	}
};