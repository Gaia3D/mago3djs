/**
  * @module JsonParsor_1_0_3
  */

  'use strict';


  /**
   * @alias module:JsonParsor_1_0_3
   * @param {Object} jsonresponse JSON object parsed from inputed json data file
   */
  function JsonParsor_1_0_3(jsonresponse) {

    /**
     * JSON object parsed from inputed json data file.</br>
     * Inputed json data file is converted from IndoorGML file.</br>
     * You can convert IndoorGML to json through 'gmlToJson' in our git hub project.
     */
    this.jsonresponse = jsonresponse;

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

  }


  /**
   * @param {Object} jsonresponse JSON object parsed from inputed json data file
   */
  JsonParsor_1_0_3.prototype.parsingNodeData = function(jsonresponse) {

    var nodes = [];

    /** Extracting state members */
    var sm = jsonresponse.value.multiLayeredGraph.multiLayeredGraph.spaceLayers["0"].spaceLayerMember["0"].spaceLayer.nodes["0"].stateMember;
    var smLen = sm.length;

    for (var j = 0; j < smLen; j++) {

      var coordinates = sm[j].state.geometry.point.pos.value;
      var stateMemberObject = new StateMember(coordinates);
	  
	  // Son 20181121.*******************************************
	  stateMemberObject.id = sm[j].state.id;
	  // End Son 20181121.---------------------------------------

      /** Adding the state member to the nodes array */
      nodes.push(stateMemberObject);
    }

    return nodes;
  };



  /**
   * @param {Object} jsonresponse JSON object parsed from inputed json data file
   */
  JsonParsor_1_0_3.prototype.parsingEdgeData = function(jsonresponse) {

    var edges = [];

    /** Extracting transition members */
    var tm = jsonresponse.value.multiLayeredGraph.multiLayeredGraph.spaceLayers["0"].spaceLayerMember["0"].spaceLayer.edges["0"].transitionMember;

    /** Loop through transition Members and extracting connection, description and state members of each transition member */
    for (var i = 0; i < tm.length; i++) {

      /** Array of connections of a transition member */
      var connects = [];

      /** Getting the href of each connection */
      for (var j = 0; j < tm[i].transition.connects.length; j++) {
        connects.push(tm[i].transition.connects[j].href);
      }

      /** Description of a transition member */
      var description;
      if (tm[i].transition.description != null) {
        description = tm[i].transition.description.value;
      }


      /** Array of state members */
      var stateMembers = [];

      /** Getting coordinates of each state member */
      for (var k = 0; k < tm[i].transition.geometry.abstractCurve.value.posOrPointPropertyOrPointRep.length; k++) {
        /** Creating a state member instance*/

        var coordinates = tm[i].transition.geometry.abstractCurve.value.posOrPointPropertyOrPointRep[k].value.value;
        var smObject = new StateMember(coordinates);

		// Son 20181121.*******************************************
		//smObject.id = tm[i].transition.id;
		// End Son 20181121.---------------------------------------

        // smObject.coordinates.push(coordinates[0], coordinates[1], coordinates[2]);
        stateMembers.push(smObject);
      }


      /** Creating a transition member instance */
      var transitionMemberObject = new TransitionMember(connects, description, stateMembers);


      /** Adding the transition member to edges array */
      edges.push(transitionMemberObject);
    }

    return edges;
  };



  /**
   * Abstract cellSpaceMember data from JSON object and save it as cellSpaceMembers
   * @param {Object} jsonresponse JSON object parsed from inputed json data file
   */
  JsonParsor_1_0_3.prototype.parsingCellSpaceMember = function(jsonresponse) {

    var cellSpaceMembers = [];

    var cellSpaceMemberLen = jsonresponse.value.primalSpaceFeatures.primalSpaceFeatures.cellSpaceMember.length;

    for (var i = 0; i < cellSpaceMemberLen; i++) {

      /** Cell space member */
      var csm = jsonresponse.value.primalSpaceFeatures.primalSpaceFeatures.cellSpaceMember[i];

      /** Extracting the description of the cell space member */
      var description = "";
      if (csm.cellSpace.description != null) {
        description = csm.cellSpace.description.value;
      }

      var id = "";
      if (csm.cellSpace.id != null) {
        id = csm.cellSpace.id;
      }

      /** Extracting the href of the cell space member */
      var href = "";
      if (csm.cellSpace.duality.href != null) {
        href = csm.cellSpace.duality.href;
      }


      /** Creating an instance of the cell space member */
      var csmObject = new CellSpaceMember(description, href, id, []);

      /** Number of surface members */
      if (csm.cellSpace.cellSpaceGeometry.geometry3D != null) {
        csmObject.surfaceMember = this.getCsmSurfaceMemberFromGeometry3D(csm);
      } else if (csm.cellSpace.cellSpaceGeometry.geometry2D != null) {
        csmObject.surfaceMember = this.getCsmSurfaceMemberFromGeometry2D(csm);
      }


      /** Filling the array with the cell space member instancesBut the problem with outline has not been solved yet. */
      cellSpaceMembers.push(csmObject);
    }

    return cellSpaceMembers;
  };



  /**
   * @param {Object} jsonresponse JSON object parsed from inputed json data file
   */
  JsonParsor_1_0_3.prototype.parsingCellSpaceBoundaryMember = function(jsonresponse) {
    var cellSpaceBoundaryMembers = [];
    var cellSpaceBoundaryMemberLen = jsonresponse.value.primalSpaceFeatures.primalSpaceFeatures.cellSpaceBoundaryMember.length;

    for (var i = 0; i < cellSpaceBoundaryMemberLen; i++) {

      var csbm = jsonresponse.value.primalSpaceFeatures.primalSpaceFeatures.cellSpaceBoundaryMember[i];

      var description = "";
      if (csbm.cellSpaceBoundary.description != null) {
        description = csbm.cellSpaceBoundary.description.value;
      }

      var id = "";
      if (csbm.cellSpaceBoundary.id != null) {
        id = csbm.cellSpaceBoundary.id;
      }

      /** Extracting the href of the cell space member */
      var href = "";
      if (csbm.cellSpaceBoundary.duality != null) {
        href = csbm.cellSpaceBoundary.duality.href;
      }

      /** Creating an instance of the cell space member */
      var csbmObject = new CellSpaceMember(description, href, id, []);

      /** Number of surface members */
      if (csbm.cellSpaceBoundary.cellSpaceBoundaryGeometry.geometry3D != null) {
        csbmObject.surfaceMember = this.getCsbmSurfaceMemberFromGeometry3D(csbm);
      }

      cellSpaceBoundaryMembers.push(csbmObject);
    }

    return cellSpaceBoundaryMembers;
  };



  /**
   * Extract surfaceMember of cellSpaceMember from the JSON object when the surface of the given GML file is configured with geometry3D.
   * @param {Object} csm CellSpaceMember, cellSpaceMember part of jsonresponse.
   * @returns {array} array of {@link SurfaceMember}
   */
  JsonParsor_1_0_3.prototype.getCsmSurfaceMemberFromGeometry3D = function(csm) {
    /** get surface MemberLen */
    var surfaceMemberLen = csm.cellSpace.cellSpaceGeometry.geometry3D.abstractSolid.value.exterior.shell.surfaceMember.length;

    var surfaceMembers = [];

    /** Loop through the surface members and creating instances */
    for (var j = 0; j < surfaceMemberLen; j++) {

      /** Surface member */
      var sm = csm.cellSpace.cellSpaceGeometry.geometry3D.abstractSolid.value.exterior.shell.surfaceMember[j];

      /** Creating an instance of the surface member */
      var smObject = new SurfaceMember([]);

      /** Number of coordinates of the surface member */
      var coordLen = sm.abstractSurface.value.exterior.abstractRing.value.posOrPointPropertyOrPointRep.length;

      var value = sm.abstractSurface.value.exterior.abstractRing.value.posOrPointPropertyOrPointRep;

      /** Loop through the coordinates of a surfaceMember */
      for (var k = 0; k < coordLen; k++) {
        smObject = this.abstractCoordinate(value[k].value.value, smObject);
      }

      /** Adding the surface member to the corresponding cell space member */
      surfaceMembers.push(smObject);
    }
    return surfaceMembers;
  }



  /**
   * Extract surfaceMember of cellSpaceMember from the JSON object when the surface of the given GML file is configured with geometry2D.
   * @param {Object} csm CellSpaceMember, cellSpaceMember part of jsonresponse.
   * @returns {array} array of {@link SurfaceMember}
   */
  JsonParsor_1_0_3.prototype.getCsmSurfaceMemberFromGeometry2D = function(csm) {

    var surfaceMembers = [];

    /** abstractRing */
    var ar = csm.cellSpace.cellSpaceGeometry.geometry2D.abstractSurface.value.exterior.abstractRing;

    /** Creating an instance of abstractRing */
    var arObject = new SurfaceMember([]);

    /** Number of coordinates of the surface member */
    var coordLen = ar.value.posOrPointPropertyOrPointRep.length;

    /** Loop through the coordinates of a surfaceMember */
    for (var i = 0; i < coordLen; i++) {
      arObject = this.abstractCoordinate(ar.value.posOrPointPropertyOrPointRep[i].value.value, arObject);
    }

    surfaceMembers.push(arObject);

    return surfaceMembers;
  }



  /**
   * Extract surfaceMember of cellSpaceBoundaryMember from the JSON object when the surface of the given GML file is configured with geometry3D.
   * @param {Object} csm cellSpaceBoundaryMember, cellSpaceBoundaryMember part of jsonresponse.
   * @returns {array} array of {@link SurfaceMember}
   */
  JsonParsor_1_0_3.prototype.getCsbmSurfaceMemberFromGeometry3D = function(csbm) {

    var smObject = new SurfaceMember([]);

    var surfaceMembers = [];

    if (csbm.cellSpaceBoundary.cellSpaceBoundaryGeometry.geometry3D.abstractSurface.value.exterior != null) {

      var coordLen = csbm.cellSpaceBoundary.cellSpaceBoundaryGeometry.geometry3D.abstractSurface.value.exterior.abstractRing.value.posOrPointPropertyOrPointRep.length;
      for (var k = 0; k < coordLen; k++) {
        smObject = this.abstractCoordinate(csbm.cellSpaceBoundary.cellSpaceBoundaryGeometry.geometry3D.abstractSurface.value.exterior.abstractRing.value.posOrPointPropertyOrPointRep[k].value.value, smObject);
      }
    }

    surfaceMembers.push(smObject);

    return surfaceMembers;
  }



  /**
   * Abstract coordinates from value and save it in object.coordinates
   * @param {Array} value array of coordinates.
   * @param {SurfaceMember} object The coordinates obtained from value are stored in object.coordinates.
   * @returns {array} array of {@link SurfaceMember}
   */
  JsonParsor_1_0_3.prototype.abstractCoordinate = function(value, object) {

    /** Extracting X */
    var X = value[0];
    object.coordinates.push(X);


    /** Test if X is maximum or minimum */
    if (X > this.max_X) {
      this.max_X = X;
    } else if (X < this.min_X) {
      this.min_X = X;
    }

    /** Extracting Y */
    var Y = value[1];
    object.coordinates.push(Y);

    if (Y > this.max_Y) {
      this.max_Y = Y;
    } else if (Y < this.min_Y) {
      this.min_Y = Y;
    }

    /** Extracting Z */
    var Z = value[2];
    object.coordinates.push(Z);

    if (Z > this.max_Z) {
      this.max_Z = Z;
    } else if (Z < this.min_Z) {
      this.min_Z = Z;
    }

    return object;
  }

  JsonParsor_1_0_3.prototype.getMaxX = function(){
    return this.max_X;
  }

  JsonParsor_1_0_3.prototype.getMaxY = function(){
    return this.max_Y;
  }

  JsonParsor_1_0_3.prototype.getMaxZ = function(){
    return this.max_Z;
  }

  JsonParsor_1_0_3.prototype.getMinX = function(){
    return this.min_X;
  }

  JsonParsor_1_0_3.prototype.getMinY = function(){
    return this.min_Y;
  }

  JsonParsor_1_0_3.prototype.getMinZ = function(){
    return this.min_Z;
  }


