/**
  * A module containing Data from IndoorGML.</br>
  * This module contains the variables required to navigate in 3D buildings built in DisplayHelper and
  * the functions required for parsing that variables from json object.</br>
  * Unlike existing maps, the indoor space viewer is restricted due to the spatial factor of the wall.</br>
  * With this in mind, this module ensures that the user moves only on the network defined in the GML file
  * to limit unusual behavior such as user penetration through the wall.</br>
  * @module GMLDataContainer
  */

  'use strict';


  /**
   * Create new GMLDataContainer
   * @alias module:GMLDataContainer
   * @param {Object} jsonresponse JSON object parsed from inputed json data file
   */
  function GMLDataContainer(jsonresponse, gmlVersion) {

    /**
     * JSON object parsed from inputed json data file.</br>
     * Inputed json data file is converted from IndoorGML file.</br>
     * You can convert IndoorGML to json through 'gmlToJson' in our git hub project.
     */
    this.jsonresponse = jsonresponse;

    /**
     * This value appears in the IndoorGML document <State>.</br>
     * Within the topographic space layer, a state can be associated with a room, corridor, door, etc.</br>
     * And this may be an isolated node, i.e. not connected to another State.
     */
    this.nodes = [];

    /**
     * This value appears in the IndoorGML document <Transition>.</br>
     * And Transition is an edge that represents the adjacency or connectivity relationships among nodes representing space objects in primal space.</br>
     * Transition always connects two States.
     */
    this.edges = [];

    /**
     * In IndoorGML, CellSpaceis a base class for representing the indoor space.</br>
     * Each CellSpace is associated with a geometry object which can be represented as several geometry primitive types such as 2D and 3D.</br>
     * In short, <State> and <Transition> are responsible for the relationship between the spaces, and <CellSpace> is about the geometry that constitutes the space.
     */
    this.cellSpaceMembers = [];

    /**
     * CellSpaceBoundary is used to semantically describe the boundary of each geographical feature in space.</br>
     * You can notice that if you visualize geometry of this it look like door or something connecting one space to other.</br>
     * In this project we don't need to use this value because we can distinguish door from description of cellSpaceMembers.
     */
    this.cellSpaceBoundaryMembers = [];

    /**
     * The maximum x coordinate. This value will used for calculating center x coordinate of building.
     */
    this.max_X = 0;

    /**
     * The maximum y coordinate. This value will used for calculating center y coordinate of building.
     */
    this.max_Y = 0;

    /**
     * The maximum z coordinate. This value will used for calculating center z coordinate of building.
     */
    this.max_Z = 0;



    /**
     * The maximum x coordinate. This value will used for calculating center x coordinate of building.
     */
    this.min_X = 0;

    /**
     * The maximum y coordinate. This value will used for calculating center y coordinate of building.
     */
    this.min_Y = 0;

    /**
     * The maximum z coordinate. This value will used for calculating center z coordinate of building.
     */
    this.min_Z = 0;



    /**
     * The Center X coordinate of building.
     */
    this.center_X = 0;

    /**
     * The Center Y coordinate of building.
     */
    this.center_Y = 0;


    /** The object onto which to store the transformation result. */
    this.ENU = new Cesium.Matrix4();

    this.jsonParsor;

    this.parsingJson(jsonresponse, gmlVersion);
    this.setCenter();
  }



  /**
   * Parse the data(nodes, edges, cellSpace, cellSpaceBoundary ) required to produce the viewer in the JSON object.
   * @param {Object} jsonresponse JSON object parsed from inputed json data file
   */
  GMLDataContainer.prototype.parsingJson = function(jsonresponse, gmlVersion) {

    if(gmlVersion == "1.0.1"){
      this.jsonParsor = new JsonParsor_1_0_1(jsonresponse);
    }
    else if(gmlVersion == "1.0.3"){
      this.jsonParsor = new JsonParsor_1_0_3(jsonresponse);
    }
    else{
      alert(gmlVersion + " is not a vailid version!");
    }

    this.nodes = this.jsonParsor.parsingNodeData(jsonresponse);
    this.edges = this.jsonParsor.parsingEdgeData(jsonresponse);
    this.cellSpaceMembers = this.jsonParsor.parsingCellSpaceMember(jsonresponse);

    this.max_X = this.jsonParsor.getMaxX();
    this.max_Y = this.jsonParsor.getMaxY();
    this.max_Z = this.jsonParsor.getMaxZ();
    this.min_X = this.jsonParsor.getMinX();
    this.min_Y = this.jsonParsor.getMinY();
    this.min_Z = this.jsonParsor.getMinZ();
    // this.cellSpaceBoundaryMembers = this.parsingCellSpaceBoundaryMember(jsonresponse);

  };


  /**
   * Calculate the central coordinates of the building.
   */
  GMLDataContainer.prototype.setCenter = function() {
    this.center_X = (this.min_X + this.max_X) / 2;
    this.center_Y = (this.min_Y + this.max_Y) / 2;
  }



  /**
   * When the inputted coordinates differs from the actual world, this tries to rotate the building to reduce the gap.
   * @param {Cesium.Viewer} viewer
   * @param {Cesium.Cartesian3} position position on actual world
   * @param {number} angle angle for rotate
   */
  GMLDataContainer.prototype.rotateBuilding = function(viewer, position, angle) {

    var ellipsoid = viewer.scene.globe.ellipsoid;

    /** Rotation matrix */
    var orientation = new Cesium.Matrix4(Math.cos(angle), -Math.sin(angle), 0, 0,
      Math.sin(angle), Math.cos(angle), 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1);


    this.rotateCellSpaceMember(orientation, position, ellipsoid);
    this.rotateCellSpaceBoundaryMembers(orientation, position, ellipsoid);
    this.rotateNodes(orientation);
    this.rotateEdges(orientation);

  }



  /**
   * Rotate nodes
   * @param {Cesium.Matrix4} orientation rotation matrix for rotation
   */
  GMLDataContainer.prototype.rotateNodes = function(orientation) {

    var nodesLen = this.nodes.length;

    /** Applying translation and rotation to the nodes */
    for (var i = 0; i < nodesLen; i++) {

      /** Translating coordinates + converting the result to Cartesian3 */
      var offset = new Cesium.Cartesian3(this.nodes[i].coordinates[0] - this.center_X,
        this.nodes[i].coordinates[1] - this.center_Y,
        this.nodes[i].coordinates[2] - this.min_Z);

      /** Applying rotation to the offset */
      var finalPos = Cesium.Matrix4.multiplyByPoint(orientation, offset, new Cesium.Cartesian3());

      /** Report offset to the actual position of LWM */
      var new_coord = Cesium.Matrix4.multiplyByPoint(this.ENU, finalPos, finalPos);

      /** Replacing the old coordinates by the new ones */
      this.nodes[i].coordinates[0] = new_coord.x;
      this.nodes[i].coordinates[1] = new_coord.y;
      this.nodes[i].coordinates[2] = new_coord.z;
    }
  }



  /**
   * Rotate edges
   * @param {Cesium.Matrix4} orientation rotation matrix for rotation
   */
  GMLDataContainer.prototype.rotateEdges = function(orientation) {

    /** Applying translation and rotation to the edges */
    for (var i = 0; i < this.edges.length; i++) {

      for (var j = 0; j < this.edges[i].stateMembers.length; j++) {

        var offset = new Cesium.Cartesian3(this.edges[i].stateMembers[j].coordinates[0] - this.center_X,
          this.edges[i].stateMembers[j].coordinates[1] - this.center_Y,
          this.edges[i].stateMembers[j].coordinates[2] - this.min_Z);

        var finalPos = Cesium.Matrix4.multiplyByPoint(orientation, offset, new Cesium.Cartesian3());

        var new_coord = Cesium.Matrix4.multiplyByPoint(this.ENU, finalPos, finalPos);

        this.edges[i].stateMembers[j].coordinates[0] = new_coord.x;
        this.edges[i].stateMembers[j].coordinates[1] = new_coord.y;
        this.edges[i].stateMembers[j].coordinates[2] = new_coord.z;
      }
    }
  }



  /**
   * Rotate cellSpaceMembers
   * @param {Cesium.Matrix4} orientation rotation matrix for rotation
   * @param {Cesium.Cartesian3} position position on actual world
   * @param {Cesium.Ellipsoid} ellipsoid
   */
  GMLDataContainer.prototype.rotateCellSpaceMember = function(orientation, position, ellipsoid) {

    Cesium.Transforms.eastNorthUpToFixedFrame(position, ellipsoid, this.ENU);

    /** Applying translation and rotation to coordinates */
    for (var i = 0; i < this.cellSpaceMembers.length; i++) {

      var csmLen = this.cellSpaceMembers[i].surfaceMember.length;

      for (var j = 0; j < csmLen; j++) {
        var smLen = this.cellSpaceMembers[i].surfaceMember[j].coordinates.length;

        for (var k = 0; k < smLen; k += 3) {

          /** Translating coordinates + converting the result to Cartesian3 */
          var offset = new Cesium.Cartesian3(this.cellSpaceMembers[i].surfaceMember[j].coordinates[k] - this.center_X,
            this.cellSpaceMembers[i].surfaceMember[j].coordinates[k + 1] - this.center_Y,
            this.cellSpaceMembers[i].surfaceMember[j].coordinates[k + 2] - this.min_Z);

          /** Applying rotation to the offset */
          var finalPos = Cesium.Matrix4.multiplyByPoint(orientation, offset, new Cesium.Cartesian3());

          /** Report offset to the actual position of LWM */
          var new_coord = Cesium.Matrix4.multiplyByPoint(this.ENU, finalPos, finalPos);

          /** Replacing the old coordinates by the new ones */
          this.cellSpaceMembers[i].surfaceMember[j].coordinates[k] = new_coord.x;
          this.cellSpaceMembers[i].surfaceMember[j].coordinates[k + 1] = new_coord.y;
          this.cellSpaceMembers[i].surfaceMember[j].coordinates[k + 2] = new_coord.z;
        }
      }
    }
  }



  /**
   * Rotate cellSpaceBoundaryMembers
   * @param {Cesium.Matrix4} orientation rotation matrix for rotation
   * @param {Cesium.Cartesian3} position position on actual world
   * @param {Cesium.Ellipsoid} ellipsoid
   */
  GMLDataContainer.prototype.rotateCellSpaceBoundaryMembers = function(orientation, position, ellipsoid) {

    Cesium.Transforms.eastNorthUpToFixedFrame(position, ellipsoid, this.ENU);

    /** Applying translation and rotation to coordinates */
    for (var i = 0; i < this.cellSpaceBoundaryMembers.length; i++) {

      var csmLen = this.cellSpaceBoundaryMembers[i].surfaceMember.length;

      for (var j = 0; j < csmLen; j++) {
        var smLen = this.cellSpaceBoundaryMembers[i].surfaceMember[j].coordinates.length;

        for (var k = 0; k < smLen; k += 3) {

          /** Translating coordinates + converting the result to Cartesian3 */
          var offset = new Cesium.Cartesian3(this.cellSpaceBoundaryMembers[i].surfaceMember[j].coordinates[k] - this.center_X,
            this.cellSpaceBoundaryMembers[i].surfaceMember[j].coordinates[k + 1] - this.center_Y,
            this.cellSpaceBoundaryMembers[i].surfaceMember[j].coordinates[k + 2] - this.min_Z);

          /** Applying rotation to the offset */
          var finalPos = Cesium.Matrix4.multiplyByPoint(orientation, offset, new Cesium.Cartesian3());

          /** Report offset to the actual position of LWM */
          var new_coord = Cesium.Matrix4.multiplyByPoint(this.ENU, finalPos, finalPos);

          /** Replacing the old coordinates by the new ones */
          this.cellSpaceBoundaryMembers[i].surfaceMember[j].coordinates[k] = new_coord.x;
          this.cellSpaceBoundaryMembers[i].surfaceMember[j].coordinates[k + 1] = new_coord.y;
          this.cellSpaceBoundaryMembers[i].surfaceMember[j].coordinates[k + 2] = new_coord.z;
        }
      }
    }
  }



