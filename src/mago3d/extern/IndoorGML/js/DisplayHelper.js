/**
 * DisplayHelper draw simple building using geometry data of cellSpaceMember from IndoorGML file.</br>
 * The building that drawing by this module will be consist of simple polygon
 * and you can add some color or texture(image) on it.
 * @module DisplayHelper
 */
define([
  "./GMLDataContainer",
  "./Objects/PrimitiveOption"
], function(
  GMLDataContainer,
  PrimitiveOption
) {
  'use strict';


  /**
   * Create new DisplayHelper.
   * @alias module:DisplayHelper
   * @param {GMLDataContainer} GMLDataContainer
   */
  function DisplayHelper(GMLDataContainer) {

    /**
     * This value will from {@link GMLDataContainer} and this value contain geometry data for target building.
     */
    this.gmlDataContainer = GMLDataContainer;


    /**
     * Array of instances what expresses room except its ceiling.
     */
    this.roomInstances = [];

    /**
     * Array of instances what expresses door.
     */
    this.doorInstances = [];

    /**
     * Array of instances what didn't expresses certain thing.</br>
     * When one cellSpace have no usage data, it's geometry will visualize through this.</br>
     * This can be hallway, lobby, etc.
     */
    this.otherInstances = [];

    /**
     * Array of instances what expresses ceiling of space.
     */
    this.ceilingInstances = [];

    /**
     * Array of instances what expresses outline of door.
     */
    this.outlineInstances = [];

    this.setGeometryInstances();
  }



  /**
   * Set value of {@link module:roomInstances}, {@link module:doorInstances}, {@link module:doorInstances}, {@link module:ceilingInstances},
   * {@link module:otherInstances}, {@link module:outlineInstances} from {@link module:gmlDataContainer}
   */
  DisplayHelper.prototype.setGeometryInstances = function() {

    var cellSpaceMembersLen = this.gmlDataContainer.cellSpaceMembers.length;

    for (var i = 0; i < cellSpaceMembersLen; i++) {

      var surfaceMemberLen = this.gmlDataContainer.cellSpaceMembers[i].surfaceMember.length;

      for (var j = 0; j < surfaceMemberLen; j++) {

        var geometryInstance = new Cesium.GeometryInstance({
          geometry: new Cesium.PolygonGeometry({
            polygonHierarchy: new Cesium.PolygonHierarchy(Cesium.Cartesian3.unpackArray(this.gmlDataContainer.cellSpaceMembers[i].surfaceMember[j].coordinates)),
            perPositionHeight: true
          }),
        });


        /** checking for ceiling */
        var temp = Cesium.Cartesian3.unpackArray(this.gmlDataContainer.cellSpaceMembers[i].surfaceMember[j].coordinates);
        var pre = Math.floor(Cesium.Cartographic.fromCartesian(temp[0]).height);
        var escape = false;
        for (var k = 1; k < temp.length; k++) {
          var temp2 = Cesium.Cartographic.fromCartesian(temp[k]);
          if (pre != Math.floor(temp2.height)) {
            escape = true;
          }
        }

        if (this.gmlDataContainer.cellSpaceMembers[i].usage == "Door") {
          this.doorInstances.push(geometryInstance);

          this.outlineInstances.push(new Cesium.GeometryInstance({
            geometry: new Cesium.PolygonOutlineGeometry({
              polygonHierarchy: new Cesium.PolygonHierarchy(Cesium.Cartesian3.unpackArray(this.gmlDataContainer.cellSpaceMembers[i].surfaceMember[j].coordinates)),
              perPositionHeight: true,
            }),
            attributes: {
              color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.BLACK)
            }
          }));
        } else if (this.gmlDataContainer.cellSpaceMembers[i].usage == "Room" && escape) {
          this.roomInstances.push(geometryInstance);
        } else if (escape) {
          this.otherInstances.push(geometryInstance);
        } else {
          this.ceilingInstances.push(geometryInstance);
        }
      }
    }
  }



  /**
   * Display building on Cesuim viewer. You can add color or texture for each instances using parameter.
   * @param {Cesium.Viewer} viewer
   * @param {PrimitiveOption} doorOption
   * @param {PrimitiveOption} roomOption
   * @param {PrimitiveOption} ceilingOption
   * @param {PrimitiveOption} otherOption
   * @example
   * var displayHelper = new DisplayHelper(gmlDataContainer, viewer);
   * displayHelper.displayBuilding(
   *  viewer,
   *  new PrimitiveOption("Image", false, "./Texture/dark_blue.png", null),
   *  new PrimitiveOption("Image", false, "./Texture/light_gray.png", null),
   *  new PrimitiveOption("Image", false, "./Texture/dark_gray.png", null),
   *  new PrimitiveOption("Image", false, "./Texture/light_gray.png", null));
   */
  DisplayHelper.prototype.displayBuilding = function(viewer, doorOption, roomOption, ceilingOption, otherOption) {

    this.addDoorInstancesToPrimitives(viewer, doorOption);
    this.addRoomInstancesToPrimitives(viewer, roomOption);
    this.addOtherInstancesToPrimitives(viewer, otherOption);
    this.addCeilingInstancesToPrimitives(viewer, ceilingOption);
    this.addOutlineInstancesToPrimitives(viewer);

  }



  /**
   * Display door on Cesuim viewer by adding {@link module:DisplayHelper.doorInstances} to {@link https://cesiumjs.org/Cesium/Build/Documentation/Scene.html|Scene.primitives}.
   * @param {PrimitiveOption} doorOption
   */
  DisplayHelper.prototype.addDoorInstancesToPrimitives = function(viewer, doorOption) {
    var doorPrimitive = new Cesium.Primitive({
      geometryInstances: this.doorInstances,
      appearance: new Cesium.PerInstanceColorAppearance({
        faceForward: true,
        flat: true,
        translucent: doorOption.translucent,
        closed: false
      })
    });

    doorPrimitive.appearance = new Cesium.MaterialAppearance();
    doorPrimitive.appearance.material = doorOption.getMaterial();
    viewer.scene.primitives.add(doorPrimitive);

  }



  /**
   * Display room on Cesuim viewer by adding {@link module:DisplayHelper.roomInstances} to {@link https://cesiumjs.org/Cesium/Build/Documentation/Scene.html|Scene.primitives}.
   * @param {PrimitiveOption} roomOption
   */
  DisplayHelper.prototype.addRoomInstancesToPrimitives = function(viewer, roomOption) {

    var roomPrimitive = new Cesium.Primitive({
      geometryInstances: this.roomInstances,
      appearance: new Cesium.PerInstanceColorAppearance({
        faceForward: true,
        flat: true,
        translucent: roomOption.translucent,
        closed: false
      })
    });

    roomPrimitive.appearance = new Cesium.MaterialAppearance();
    roomPrimitive.appearance.material = roomOption.getMaterial();
    viewer.scene.primitives.add(roomPrimitive);

  }



  /**
   * Display ceiling on Cesuim viewer by adding {@link module:DisplayHelper.ceilingInstances} to {@link https://cesiumjs.org/Cesium/Build/Documentation/Scene.html|Scene.primitives}.
   * @param {PrimitiveOption} ceilingOption
   */
  DisplayHelper.prototype.addCeilingInstancesToPrimitives = function(viewer, ceilingOption) {

    var ceilingPrimitive = new Cesium.Primitive({
      geometryInstances: this.ceilingInstances,
      appearance: new Cesium.PerInstanceColorAppearance({
        faceForward: true,
        flat: true,
        translucent: ceilingOption.translucent,
        closed: false
      })
    });

    ceilingPrimitive.appearance = new Cesium.MaterialAppearance();
    ceilingPrimitive.appearance.material = ceilingOption.getMaterial();
    viewer.scene.primitives.add(ceilingPrimitive);

  }



  /**
   * Display space on Cesuim viewer by adding {@link module:DisplayHelper.otherInstances} to {@link https://cesiumjs.org/Cesium/Build/Documentation/Scene.html|Scene.primitives}.
   * @param {PrimitiveOption} otherOption
   */
  DisplayHelper.prototype.addOtherInstancesToPrimitives = function(viewer, otherOption) {

    var otherPrimitive = new Cesium.Primitive({
      geometryInstances: this.otherInstances,
      appearance: new Cesium.PerInstanceColorAppearance({
        faceForward: true,
        flat: true,
        translucent: otherOption.translucent,
        closed: false
      })
    });

    otherPrimitive.appearance = new Cesium.MaterialAppearance();
    otherPrimitive.appearance.material = otherOption.getMaterial();
    viewer.scene.primitives.add(otherPrimitive);

  }



  /**
   * Display outline of doors on Cesuim viewer by adding {@link module:DisplayHelper.outlineInstances} to {@link https://cesiumjs.org/Cesium/Build/Documentation/Scene.html|Scene.primitives}.
   */
  DisplayHelper.prototype.addOutlineInstancesToPrimitives = function(viewer) {
    viewer.scene.primitives.add(new Cesium.Primitive({
      geometryInstances: this.outlineInstances,
      appearance: new Cesium.PerInstanceColorAppearance({
        flat: true,
        renderState: {
          depthTest: {
            enabled: true,
            func: Cesium.DepthFunction.LESS
          },
          lineWidth: Math.min(3.0, viewer.scene.maximumAliasedLineWidth)
        }
      })
    }));
  }





  /**
   * Display paths using edges value of {@link module:DisplayHelper.gmlDataContainer}.</br>
   * With this function, path will draw by polyline.</br>
   * And if you using this for drawing path, you should using {@link module:IndoorNavigation.onClickPolylinePath} for onClick function.</br>
   * @param {Cesium.Viewer} viewer
   */
  DisplayHelper.prototype.displayPathAsPolyline = function(viewer) {
    var pathInstance = [];

    /** Displaying the edges. */
    for (var i = 0; i < this.gmlDataContainer.edges.length; i++) {

      var line = viewer.entities.add({
        name: 'line ' + this.gmlDataContainer.edges[i].connects,
        polyline: {
          positions: [
            new Cesium.Cartesian3(
              this.gmlDataContainer.edges[i].stateMembers[0].coordinates[0],
              this.gmlDataContainer.edges[i].stateMembers[0].coordinates[1],
              this.gmlDataContainer.edges[i].stateMembers[0].coordinates[2] + 0.2),
            new Cesium.Cartesian3(
              this.gmlDataContainer.edges[i].stateMembers[1].coordinates[0],
              this.gmlDataContainer.edges[i].stateMembers[1].coordinates[1],
              this.gmlDataContainer.edges[i].stateMembers[1].coordinates[2] + 0.2)
          ],
          followSurface: new Cesium.ConstantProperty(true),
          width: 50,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 10.0),
          material: Cesium.Color.WHITE.withAlpha(0.8),
          outline: true,
          /** height or extrudedHeight must be set for outlines to display */
          outlineColor: Cesium.Color.WHITE
        }
      });
    }
  }


  /**
   * Display paths using edges value of {@link module:DisplayHelper.gmlDataContainer}.</br>
   * With this function, path will draw by PolygonGeometry.</br>
   * And if you using this for drawing path, you should using {@link module:IndoorNavigation.onClickPolygonPath} for onClick function.</br>
   * @param {Cesium.Viewer} viewer
   * @example
   * var handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
   * handler.setInputAction(function(movement) {
   *  var feature = viewer.scene.pick(movement.position);
   *  if (Cesium.defined(feature)) {
   *    indoorNavigation.onClickPolygonPath(feature);
   *  }
   * }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
   */
  DisplayHelper.prototype.displayPathAsPolygon = function(viewer) {
    var pathInstance = [];

    /** Displaying the edges. */
    for (var i = 0; i < this.gmlDataContainer.edges.length; i++) {
      var leftUp = new Cesium.Cartesian3(
        this.gmlDataContainer.edges[i].stateMembers[0].coordinates[0] - 0.12,
        this.gmlDataContainer.edges[i].stateMembers[0].coordinates[1],
        this.gmlDataContainer.edges[i].stateMembers[0].coordinates[2] + 0.2);

      var rightUp = new Cesium.Cartesian3(
        this.gmlDataContainer.edges[i].stateMembers[0].coordinates[0] + 0.12,
        this.gmlDataContainer.edges[i].stateMembers[0].coordinates[1],
        this.gmlDataContainer.edges[i].stateMembers[0].coordinates[2] + 0.2);

      var leftDown = new Cesium.Cartesian3(
        this.gmlDataContainer.edges[i].stateMembers[1].coordinates[0] - 0.12,
        this.gmlDataContainer.edges[i].stateMembers[1].coordinates[1],
        this.gmlDataContainer.edges[i].stateMembers[1].coordinates[2] + 0.2);

      var rightDown = new Cesium.Cartesian3(
        this.gmlDataContainer.edges[i].stateMembers[1].coordinates[0] + 0.12,
        this.gmlDataContainer.edges[i].stateMembers[1].coordinates[1],
        this.gmlDataContainer.edges[i].stateMembers[1].coordinates[2] + 0.2);

      var position = [leftUp, rightUp, rightDown, leftDown];

      var geometryInstance = new Cesium.GeometryInstance({
        geometry: new Cesium.PolygonGeometry({
          polygonHierarchy: new Cesium.PolygonHierarchy(position),
          perPositionHeight: true
        }),
        id: 'line ' + this.gmlDataContainer.edges[i].connects,
      });
      pathInstance.push(geometryInstance);
    }

    var pathOption = new PrimitiveOption("Image", false, "./Texture/darkdark_gray.png", null);

    var pathPrimitive = new Cesium.Primitive({
      geometryInstances: pathInstance,
      appearance: new Cesium.PerInstanceColorAppearance({
        faceForward: true,
        flat: true,
        translucent: false,
        closed: false
      })
    });

    pathPrimitive.appearance = new Cesium.MaterialAppearance();
    pathPrimitive.appearance.material = pathOption.getMaterial();
    viewer.scene.primitives.add(pathPrimitive);
  }



  DisplayHelper.prototype.importGLBFile = function(viewer, position, uri) {
    viewer.entities.add({
      position: position,
      model: {
        uri: uri
      }
    });
  }




  return DisplayHelper;

});
