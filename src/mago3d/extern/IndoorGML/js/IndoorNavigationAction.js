/**
 * This module provides functions using for navigating building that drew by {@link module: DisplayHelper}.</br>
 * You can navigate the building simply giving these functions to button as onClick action or some the other way.
 * @module IndoorNavigationAction
 */
define([
  "./Objects/MoveState",
  "./Objects/RoomInfo",
  "./Objects/Coordinate",
  "./IndoorNavigationData"
], function(
  MoveState,
  RoomInfo,
  Coordinate,
  IndoorNavigationData
) {
  'use strict';

  /**
   * Create new IndoorNavigationAction.
   * @alias module:IndoorNavigationAction
   * @param {IndoorNavigationData} indoorNavigationData
   */
  function IndoorNavigationAction(viewer, indoorNavigationData) {

    this.indoorNavigationData = indoorNavigationData;

    this.scene = viewer.scene;
    this.camera = viewer.camera;

  }

  /**
   * If you want to use tree view containg room data, you can use this function for calling setting function of tree view in html.</br>
   * Recommand tree view plugin is {@link https://github.com/vakata/jstree|jstree}.</br>
   * Make sure that name of function which setting tree view are `setTreeView(data)` like below.
   * ```
   * <script>
   *  function setTreeView(data) {
   *    $(function() {
   *      $('#jstree').jstree(data);
   *    });
   *  }
   * </script>
   * ```
   */
  IndoorNavigationAction.prototype.setTreeViewNavigation = function() {
    var data = this.makeRoomDataToJson();
    setTreeView(data); // this function must in html
  }


  /**
   * Make Json object for tree view.</br>
   * Json object which made in this function will follow the form requested by {@link https://github.com/vakata/jstree|jstree}.
   * @return {Object}
   */
  IndoorNavigationAction.prototype.makeRoomDataToJson = function() {

    var roomArray = new Array();

    for (var i = 0; i < this.indoorNavigationData.sectionData.length; i++) {
      var sectionInfo = new Object();
      sectionInfo.id = this.indoorNavigationData.sectionData[i];
      sectionInfo.parent = "#";
      sectionInfo.text = sectionInfo.id;
      sectionInfo.icon = "./jtree_icon/iconmonstr-building-15-16.png";
      roomArray.push(sectionInfo);
    }

    for (var i = 0; i < this.indoorNavigationData.sectionData.length; i++) {
      for (var j = 0; j < this.indoorNavigationData.floorData[i].length; j++) {
        var floorInfo = new Object();
        floorInfo.id = this.indoorNavigationData.sectionData[i] + this.indoorNavigationData.floorData[i][j];
        floorInfo.parent = this.indoorNavigationData.sectionData[i];
        floorInfo.text = "Floor : " + this.indoorNavigationData.floorData[i][j];
        floorInfo.icon = "./jtree_icon/iconmonstr-layer-22-16.png"
        roomArray.push(floorInfo);
      }
    }

    for (var key of this.indoorNavigationData.roomData.keys()) {
      var roomInfo = new Object();
      roomInfo.id = key;
      roomInfo.parent = this.indoorNavigationData.roomData.get(key).section + this.indoorNavigationData.roomData.get(key).floor;
      roomInfo.text = key;
      roomInfo.icon = "./jtree_icon/iconmonstr-check-mark-10-12.png";
      roomArray.push(roomInfo);
    }

    var dataInfo = new Object();
    dataInfo.data = roomArray;

    var themeInfo = new Object();
    themeInfo.name = 'proton';
    themeInfo.responsive = false;

    var pluginInfo = ["sort"];
    var sortInfo = function(a, b) {
      var a1 = this.get_node(a);
      var b1 = this.get_node(b);
      if (a1.icon == b1.icon) return (a1.text > b1.text) ? 1 : -1;
      else return (a1.icon > b1.icon) ? 1 : -1;
    }


    var jsonInfo = new Object();
    jsonInfo.core = dataInfo;
    jsonInfo.themes = themeInfo;
    jsonInfo.plugins = pluginInfo;
    jsonInfo.sort = sortInfo;

    return jsonInfo;
  }



  /**
   * If click one value of tree view, camera move to a space where that value pointed.</br>
   * To set onclick this function to tree view, you should call function in `main.js` like below.</br>
   * ```
   * $('#jstree').on("changed.jstree", function(e, data) {
   *  indoorNavigation.onClickTreeView(data.selected);
   * });
   * ```
   * @param {Array} roomHref
   */
  IndoorNavigationAction.prototype.onClickTreeView = function(roomHref) {
    if (this.indoorNavigationData.nowMoveState.srcHref == null && this.indoorNavigationData.nowMoveState.dstHref == null) {
      this.disableDefaultEventHandlers();
    }

    var pickedRoom = this.indoorNavigationData.roomData.get(roomHref[0]);
    // var pickedRoom = this.indoorNavigationData.roomInfo.get(roomHref[0]);

    if (pickedRoom == undefined) {
      return;
    }

    this.indoorNavigationData.nowMoveState.srcHref = roomHref[0];
    this.indoorNavigationData.nowMoveState.dstHref = null;
    this.indoorNavigationData.nowMoveState.T = 0;

    this.camera.flyTo({
      destination: new Cesium.Cartesian3(
        pickedRoom.coordinate.x,
        pickedRoom.coordinate.y,
        pickedRoom.coordinate.z + this.indoorNavigationData.zfactor
      ),
      orientation: {
        heading: Cesium.Math.toRadians(90.0),
        pitch: Cesium.Math.toRadians(0),
        roll: 0.0
      }
    });

    // console.log(this.indoorNavigationData.nowMoveState);
  }



  /**
   * This function make camera turn to left as much as {@link module:IndoorNavigationAction.turnRate}.
   */
  IndoorNavigationAction.prototype.actionTurnLeft = function() {
    this.camera.lookLeft(this.indoorNavigationData.turnRate);
  }



  /**
   * This function make camera turn to right as much as {@link module:IndoorNavigationAction.turnRate}.
   */
  IndoorNavigationAction.prototype.actionTurnRight = function() {
    this.camera.lookRight(this.indoorNavigationData.turnRate);
  }


  /**
   * This function make the camera turn to due east and place it horizontally on the ground.
   */
  IndoorNavigationAction.prototype.actionTurnStraight = function() {
    this.camera.setView({
      orientation: {
        heading: Cesium.Math.toRadians(90.0),
        pitch: Cesium.Math.toRadians(0),
        roll: 0.0
      }
    });
  }



  /**
   *  This function make camera zoom in as much as {@link module:IndoorNavigationAction.zoomRate}.
   */
  IndoorNavigationAction.prototype.actionZoomIn = function() {
    this.camera.zoomIn(this.indoorNavigationData.zoomRate);
  }



  /**
   * This function make camera zoom out as much as {@link module:IndoorNavigationAction.zoomRate}.
   */
  IndoorNavigationAction.prototype.actionZoomOut = function() {
    this.camera.zoomOut(this.indoorNavigationData.zoomRate);
  }



  /**
   * This function make camera move front, if {@link module:IndoorNavigationAction.nowMoveState} and the camera is on the right condition.</br>
   * The right conditions include : </br>
   *  1. nowMoveState should have proper source and destination. This will be checked by `checkAndAssignDst`.
   *  2. The heading of the camera should direct source and destination of nowMoveState. This will be checked by `getDirection`
   * </br></br>
   * <img src="./img/img_actionMoveFront.png" width="600" style="margin-left: 50px;" >
   */
  IndoorNavigationAction.prototype.actionMoveFront = function() {

    /** check first condition*/
    this.checkAndAssignDst4MoveFront(this.camera.direction);

    if (this.indoorNavigationData.nowMoveState.dstHref != null) {

      /** check second condition */
      this.checkDirectionAndMoveFront();
    }
  }



  /**
   * This function make camera move back, if {@link module:IndoorNavigationAction.nowMoveState} and the camera is on the right condition.</br>
   * The conditions for moving is same as `actionMoveFront`, different is in `actionMoveFront` when both of condition appropriate satisfied the camera move to front
   * but in this function the will move to back.
   */
  IndoorNavigationAction.prototype.actionMoveBack = function() {

    var oppsiteDirection = this.getMovedCoordinate(2, this.camera.direction, this.camera.position);

    /** check first condition*/
    this.checkAndAssignDst4MoveBack(oppsiteDirection);

    if (this.indoorNavigationData.nowMoveState.dstHref != null) {

      /** check second condition */
      this.checkDirectionAndMoveBack();
    }
  }



  /**
   * Check the condition 1 : nowMoveState should have proper source and destination.</br>
   * This function check that the camera is whether on traveling one edge or not.</br>
   * If the camera is not in the middle of the edge, which means the camera is on some node, assign the node that camera located at the source of nowMoveState and search new destination using `getNewDst`.
   * @param {Cesium.Cartesian3} direction The coordinate of position that camera staring.
   */
  IndoorNavigationAction.prototype.checkAndAssignDst4MoveFront = function(direction) {

    if (this.indoorNavigationData.nowMoveState.T == 0) { /** camera is on src node, find new dst */

      var newDst = this.getNewDst(direction);
      if (newDst != null) this.indoorNavigationData.nowMoveState.dstHref = newDst.href;
      else this.indoorNavigationData.nowMoveState.dstHref = null;

    } else if (this.indoorNavigationData.nowMoveState.T == 1) { /** camera is on dst node, find new dst */

      this.indoorNavigationData.nowMoveState.srcHref = this.indoorNavigationData.nowMoveState.dstHref;
      var newDst = this.getNewDst(direction);
      if (newDst != null) this.indoorNavigationData.nowMoveState.dstHref = newDst.href;
      else this.indoorNavigationData.nowMoveState.dstHref = null;
      this.indoorNavigationData.nowMoveState.T = 0;
    }
  }



  /**
   * Check the condition 1 : nowMoveState should have proper source and destination.</br>
   * This function check that the camera is whether on traveling one edge or not.</br>
   * If the camera is not in the middle of the edge, which means the camera is on some node, assign the node that camera located at the source of nowMoveState and search new destination using `getNewDst`.
   * @param {Coordinate} od opposite direction. The coordinates of the position in the opposite direction that the camera is staring.
   */
  IndoorNavigationAction.prototype.checkAndAssignDst4MoveBack = function(od) {

    if (this.indoorNavigationData.nowMoveState.T == 0) {

      /** camera is on src node, find new dst */
      var newDst = this.getNewDst(od);

      if (newDst != null) {
        this.indoorNavigationData.nowMoveState.dstHref = this.indoorNavigationData.nowMoveState.srcHref;
        this.indoorNavigationData.nowMoveState.srcHref = newDst.href;
        this.indoorNavigationData.nowMoveState.T = 1;
      } else {
        this.indoorNavigationData.nowMoveState.dstHref = null;
      }


    } else if (this.indoorNavigationData.nowMoveState.T == 1) {
      this.indoorNavigationData.nowMoveState.srcHref = this.indoorNavigationData.nowMoveState.dstHref;

      /** camera is on dst node, find new dst */
      var newDst = this.getNewDst(od);

      if (newDst != null) {
        this.indoorNavigationData.nowMoveState.srcHref = newDst.href;
      } else {
        this.indoorNavigationData.nowMoveState.srcHref = this.indoorNavigationData.nowMoveState.dstHref;
        this.indoorNavigationData.nowMoveState.dstHref = null;
        this.indoorNavigationData.nowMoveState.T = 0;
      }

    }
  }



  /**
   * Check the condition 2 : The heading of the camera should direct source and destination of nowMoveState.</br>
   * This function check direction that show where the camera will move, source of edge or destination of edge.</br>
   * And move camera based on direction and `nowMoveState` :
   * 1. If the edge of `nowMoveState` represents the stair, do move to upper layer.
   * 2. If the direction indicates src, which means camera see source of edge, move to src.
   * 3. If the direction indicates dst, which means camera see destination of edge, move to dst.
   */
  IndoorNavigationAction.prototype.checkDirectionAndMoveFront = function() {

    var direction = this.getDirection(
      this.indoorNavigationData.roomData.get(this.indoorNavigationData.nowMoveState.srcHref).coordinate,
      this.indoorNavigationData.roomData.get(this.indoorNavigationData.nowMoveState.dstHref).coordinate,
      this.camera.direction);

    if (this.checkStairAndMove(this.indoorNavigationData.nowMoveState.srcHref, this.indoorNavigationData.nowMoveState.dstHref) == 10) {

      /* move stair */

    } else if (direction == 0 && this.indoorNavigationData.nowMoveState.T != 0) { //camera see src direction

      this.moveToSrc(
        this.indoorNavigationData.roomData.get(this.indoorNavigationData.nowMoveState.srcHref).coordinate,
        this.indoorNavigationData.roomData.get(this.indoorNavigationData.nowMoveState.dstHref).coordinate,
        this.indoorNavigationData.nowMoveState.T);

      this.indoorNavigationData.nowMoveState.T -= this.indoorNavigationData.moveRate;

    } else if (direction == 1 && this.indoorNavigationData.nowMoveState.T != 1) { //camera see dst direction

      this.moveToDst(
        this.indoorNavigationData.roomData.get(this.indoorNavigationData.nowMoveState.srcHref).coordinate,
        this.indoorNavigationData.roomData.get(this.indoorNavigationData.nowMoveState.dstHref).coordinate,
        this.indoorNavigationData.nowMoveState.T);

      this.indoorNavigationData.nowMoveState.T += this.indoorNavigationData.moveRate;

    } else if (direction == -1) {

      /** over threshold, not move */
      console.log("over threshold, not move");

    } else if (direction == 0 &&
      this.indoorNavigationData.nowMoveState.T == 0 &&
      this.getEdgesConnectedToNowSrc().length == 1 &&
      (this.getEdgesConnectedToNowSrc()[0].connects[0] == this.indoorNavigationData.nowMoveState.dstHref || this.getEdgesConnectedToNowSrc()[0].connects[1] == this.indoorNavigationData.nowMoveState.srcHref)) {

      /** no more node to move */
      console.log("no more node to move");

    } else if (direction == 1 &&
      this.indoorNavigationData.nowMoveState.T == 1 &&
      this.getEdgesConnectedToNowSrc().length == 1 &&
      (this.getEdgesConnectedToNowSrc()[0].connects[0] == this.indoorNavigationData.nowMoveState.dstHref || this.getEdgesConnectedToNowSrc()[0].connects[1] == this.indoorNavigationData.nowMoveState.srcHref)) {

      /** no more node to move */
      console.log("no more node to move");

    } else {

      /**
       * In this case, an error such as seeing src in src or dst in dst occurs.
       * This is often the case when dst and src are too close.
       */
      console.log("error! ", direction, this.indoorNavigationData.nowMoveState);
      this.closeErrorControl(0, direction);

    }
  }



  /**
   * Check the condition 2 : The heading of the camera should direct source and destination of nowMoveState.</br>
   * This function check direction that show where the camera will move, source of edge or destination of edge.</br>
   * And move camera based on direction and `nowMoveState` :
   * 1. If the edge of `nowMoveState` represents the stair, do move to upper layer.
   * 2. If the direction indicates src, which means camera see source of edge, move to dst.
   * 3. If the direction indicates dst, which means camera see destination of edge, move to src.
   */
  IndoorNavigationAction.prototype.checkDirectionAndMoveBack = function() {

    var direction = this.getDirection(
      this.indoorNavigationData.roomData.get(this.indoorNavigationData.nowMoveState.srcHref).coordinate,
      this.indoorNavigationData.roomData.get(this.indoorNavigationData.nowMoveState.dstHref).coordinate,
      this.camera.direction);

    if (this.checkStairAndMove(this.indoorNavigationData.nowMoveState.srcHref, this.indoorNavigationData.nowMoveState.dstHref) == 10) {

      /* move stair */

    } else if (direction == 0 && this.indoorNavigationData.nowMoveState.T != 1) {

      /** camera see src direction */
      this.moveToDst(
        this.indoorNavigationData.roomData.get(this.indoorNavigationData.nowMoveState.srcHref).coordinate,
        this.indoorNavigationData.roomData.get(this.indoorNavigationData.nowMoveState.dstHref).coordinate,
        this.indoorNavigationData.nowMoveState.T);

      this.indoorNavigationData.nowMoveState.T += this.indoorNavigationData.moveRate;

    } else if (direction == 1 && this.indoorNavigationData.nowMoveState.T != 0) {

      /** camera see dst direction */
      this.moveToSrc(
        this.indoorNavigationData.roomData.get(this.indoorNavigationData.nowMoveState.srcHref).coordinate,
        this.indoorNavigationData.roomData.get(this.indoorNavigationData.nowMoveState.dstHref).coordinate,
        this.indoorNavigationData.nowMoveState.T);

      this.indoorNavigationData.nowMoveState.T -= this.indoorNavigationData.moveRate;

    } else if (direction == -1) {

      /** over threshold, not move */
      console.log("over threshold, not move");

    } else if (direction == 0 &&
      this.indoorNavigationData.nowMoveState.T == 0 &&
      this.getEdgesConnectedToNowSrc().length == 1 &&
      (this.getEdgesConnectedToNowSrc()[0].connects[0] == this.indoorNavigationData.nowMoveState.dstHref || this.getEdgesConnectedToNowSrc()[0].connects[1] == this.indoorNavigationData.nowMoveState.srcHref)) {

      /** no more node to move */
      console.log("no more node to move");

    } else if (direction == 1 &&
      this.indoorNavigationData.nowMoveState.T == 1 &&
      this.getEdgesConnectedToNowSrc().length == 1 &&
      (this.getEdgesConnectedToNowSrc()[0].connects[0] == this.indoorNavigationData.nowMoveState.dstHref || this.getEdgesConnectedToNowSrc()[0].connects[1] == this.indoorNavigationData.nowMoveState.srcHref)) {

      /** no more node to move */
      console.log("no more node to move");

    } else {

      /**
       * In this case, an error such as seeing src in src or dst in dst occurs.
       * When two or more nodes are connected to one node and the interval is narrow,
       * this error open occur if the node to be moved next is selected incorrectly.
       */
      console.log("error! ", direction, this.indoorNavigationData.nowMoveState);
      this.closeErrorControl(1, direction);

    }
  }



  /**
   * Find new destination for nowMoveState.</br>
   * The new destination will satisfy two conditions :
   * 1. The new destination is connected with source of nowMoveState.
   * 2. The location of new destination is most similar to the location, where the camera stare, out of the nodes connected with source of nowMoveState.
   *
   * @return {Coordinate}
   */
  IndoorNavigationAction.prototype.getNewDst = function(direction) {

    /** Find arry of coordinate which satisfy first condition */
    var dstCandidate = this.getDstCandidateArray();

    /** Find coordinate which satisfy second condition out of `dstCandidate`*/
    var newDstCoordinate = this.getMostSimilarNode(dstCandidate, direction);

    return newDstCoordinate;
  }



  /**
   * Returns array of {@link Coordinate} connected with source of nowMoveState.
   * @return {Array}
   */
  IndoorNavigationAction.prototype.getDstCandidateArray = function() {

    var filteredTransitionMember = new Array();
    filteredTransitionMember = this.getEdgesConnectedToNowSrc();

    var dstCandidate = new Array();
    for (var i = 0; i < filteredTransitionMember.length; i++) {
      if (filteredTransitionMember[i].connects[0] == this.indoorNavigationData.nowMoveState.srcHref) {
        var tmpCoor = new Coordinate(
          filteredTransitionMember[i].stateMembers[1].coordinates[0],
          filteredTransitionMember[i].stateMembers[1].coordinates[1],
          filteredTransitionMember[i].stateMembers[1].coordinates[2],
          filteredTransitionMember[i].connects[1]);
        dstCandidate.push(tmpCoor);
      } else {
        var tmpCoor = new Coordinate(
          filteredTransitionMember[i].stateMembers[0].coordinates[0],
          filteredTransitionMember[i].stateMembers[0].coordinates[1],
          filteredTransitionMember[i].stateMembers[0].coordinates[2],
          filteredTransitionMember[i].connects[0]);
        dstCandidate.push(tmpCoor);
      }
    }
    // console.log(dstCandidate);
    return dstCandidate;
  }



  /**
   * Returns all edges connected with source of nowMoveState.
   * @return {Array} Array of {@link TransitionMember}
   */
  IndoorNavigationAction.prototype.getEdgesConnectedToNowSrc = function() {

    var connectedEdges = [];
    var edgesLen = this.indoorNavigationData.gmlDataContainer.edges.length;

    for (var i = 0; i < edgesLen; i++) {
      if (this.indoorNavigationData.gmlDataContainer.edges[i].connects[0] == this.indoorNavigationData.nowMoveState.srcHref) {
        connectedEdges.push(this.indoorNavigationData.gmlDataContainer.edges[i]);
      } else if (this.indoorNavigationData.gmlDataContainer.edges[i].connects[1] == this.indoorNavigationData.nowMoveState.srcHref) {
        connectedEdges.push(this.indoorNavigationData.gmlDataContainer.edges[i]);
      }
    }

    return connectedEdges;
  }



  /**
   * Returns all edges connected with destination of nowMoveState.
   * @return {Array} Array of {@link TransitionMember}
   */
  IndoorNavigationAction.prototype.getEdgesConnectedToNowDst = function() {

    var connectedEdges = [];
    var edgesLen = this.indoorNavigationData.gmlDataContainer.edges.length;

    for (var i = 0; i < edgesLen; i++) {
      if (this.indoorNavigationData.gmlDataContainer.edges[i].connects[0] == this.indoorNavigationData.nowMoveState.dstHref) {
        connectedEdges.push(this.indoorNavigationData.gmlDataContainer.edges[i]);
      } else if (this.indoorNavigationData.gmlDataContainer.edges[i].connects[1] == this.indoorNavigationData.nowMoveState.dstHref) {
        connectedEdges.push(this.indoorNavigationData.gmlDataContainer.edges[i]);
      }
    }

    return connectedEdges;
  }



  /**
   * This function works as follows.
   * 1. Calculate the angle between the position of the camera and direction where camera stare of the camera.</br>
   * 2. Calculate the angles between the position of destination candidate and direction where camera stare of the camera.
   * 3. Select one of the values found in 2 that most closely matches the angle found in 1. And return its Coordinate.</br>
   *
   * <table style="width:200px;">
   *  <tr>
   *    <td style="vertical-align: bottom; padding:0px 15px"><img src="./img/img_getMostSimilarNode1.png" height="250px"></td>
   *    <td style="vertical-align: bottom; padding:0px 15px"><img src="./img/img_getMostSimilarNode2.png" height="250px"></td>
   *  </tr>
   *  <tr>
   *    <td style="vertical-align: top; padding:0px 15px"><p style="font-size: 12px;">Fig.1 src node and nodes associated with it.</p></td>
   *    <td style="vertical-align: top; padding:0px 15px"><p style="font-size: 12px;">Fig.2 angle between position of camera and direction of camera</p></td>
   *  </tr>
   *  <tr>
   *    <td style="vertical-align: bottom; padding:0px 15px"><img src="./img/img_getMostSimilarNode3.png" height="250px"></td>
   *    <td style="vertical-align: bottom; padding:0px 15px"><img src="./img/img_getMostSimilarNode4.png" height="200px"></td>
   *  </tr>
   *  <tr>
   *    <td style="vertical-align: top; padding:0px 15px"><p style="font-size: 12px;">Fig.3 angles between the position of destination candidate and direction of the camera.</p></td>
   *    <td style="vertical-align: top; padding:0px 15px"><p style="font-size: 12px;">Fig.4 Select one that most closely matches θ_{0}</p></td>
   *  </tr>
   * </table>
   * @param {Array} dstCandidate Array of {@link Coordinate}.</br>Coordinates connected with source of nowMoveState.
   * @return {Coordinate}
   */
  IndoorNavigationAction.prototype.getMostSimilarNode = function(dstCandidate, direction) {
    var dstCandidateAngle = new Array();

    /** Calculate the angle between the position of the camera and direction where camera stare of the camera. */
    var nowAngle = Cesium.Cartesian3.angleBetween(this.camera.position, new Cesium.Cartesian3(direction.x, direction.y, direction.z));

    /** Calculate the angles between the position of destination candidate and direction where camera stare of the camera. */
    for (var i = 0; i < dstCandidate.length; i++) {
      var tmpAngle = Cesium.Cartesian3.angleBetween(
        direction,
        new Cesium.Cartesian3(dstCandidate[i].x, dstCandidate[i].y, dstCandidate[i].z));

      var diff;
      if (tmpAngle > nowAngle) diff = nowAngle - tmpAngle;
      else diff = tmpAngle - nowAngle;

      dstCandidateAngle.push(diff);
    }

    /** Select one of the values found in 2 that most closely matches the angle found in 1. And return its Coordinate. */
    var min = -9999;
    if (dstCandidateAngle.length != 0) {
      min = dstCandidateAngle.reduce(function(previous, current) {
        return previous > current ? current : previous;
      });
    }

    var indexOfMin = dstCandidateAngle.indexOf(min);

    if (indexOfMin == -1) {
      return null;
    }

    // console.log(dstCandidateAngle, dstCandidate[indexOfMin]);

    return dstCandidate[indexOfMin];
  }



  /**
   * Determines whether to move from now to src or dst.</br>
   * This function finds the angle between src, dst, and dir, and uses that angle to select the direction.</br>
   * When the angle between src and dir is referred to as srcAngle
   * and the angle between dst and dir is referred to dstAngle,
   * the direction is defined in the three cases below :
   * 1. direction = src : `srcAngle < dstAngle` and `srcAngle < threshold`
   * 2. direction = dst : `srcAngle > dstAngle` and `dstAngle < threshold`
   * 3. no direction : Failure to satisfy 1 and 2</br>
   *
   * <table style="width:200px;">
   *  <tr>
   *    <td style="vertical-align: bottom; padding:0px 15px"><img src="./img/img_getDirection4.png" height="250px"></td>
   *    <td style="vertical-align: bottom; padding:0px 15px"><img src="./img/img_getDirection2.png" height="250px"></td>
   *  </tr>
   *  <tr>
   *    <td style="vertical-align: top; padding:0px 15px"><p style="font-size: 12px;">Fig.4 the situation</p></td>
   *    <td style="vertical-align: top; padding:0px 15px"><p style="font-size: 12px;">Fig.5 direction = src</p></td>
   *  </tr>
   *  <tr>
   *    <td style="vertical-align: bottom; padding:0px 15px"><img src="./img/img_getDirection1.png" height="250px"></td>
   *    <td style="vertical-align: bottom; padding:0px 15px"><img src="./img/img_getDirection3.png" height="250px"></td>
   *  </tr>
   *  <tr>
   *    <td style="vertical-align: top; padding:0px 15px"><p style="font-size: 12px;">Fig.6 direction = dst</p></td>
   *    <td style="vertical-align: top; padding:0px 15px"><p style="font-size: 12px;">Fig.7 no direction</p></td>
   *  </tr>
   * </table>
   * @param {Coordinate} src coordinate of source
   * @param {Coordinate} dst coordinate of destination
   * @param {Cesium.Cartesian3} dir coordinate of camera's direction
   * @return {number} direction, 0 : source, 1 : destination, -1 : under threshold / not move / no direction
   */
  IndoorNavigationAction.prototype.getDirection = function(src, dst, dir) {

    var srcAngle = Cesium.Cartesian3.angleBetween(new Cesium.Cartesian3(src.x, src.y, src.z), dir);
    var dstAngle = Cesium.Cartesian3.angleBetween(new Cesium.Cartesian3(dst.x, dst.y, dst.z), dir);

    var direction;

    if (srcAngle < dstAngle && srcAngle < this.indoorNavigationData.threshold) direction = 0;
    else if (dstAngle < srcAngle && dstAngle < this.indoorNavigationData.threshold) direction = 1;
    else direction = -1;

    // console.log("getDirection : ", direction, " srcAngle:", srcAngle, " dstAngle:", dstAngle);
    return direction;
  }



  /**
   * Move the camera as much as moveRate to src. </br>
   * A detailed description of the method of movement is described in {@link MoveState.T}.
   * @param {Coordinate} src coordinate of source
   * @param {Coordinate} dst coordinate of destination
   * @param {number} nowT
   */
  IndoorNavigationAction.prototype.moveToSrc = function(src, dst, nowT) {
    if (nowT == 0) {
      console.log("not move, now on src");
    } else {
      console.log("move to src");
      var newT = nowT - this.indoorNavigationData.moveRate;
      var moved = this.getMovedCoordinate(newT, src, dst);
      this.transformCamera(moved);
    }
  }



  /**
   * Move the camera as much as moveRate to dst. </br>
   * A detailed description of the method of movement is described in {@link MoveState.T}.
   * @param {Coordinate} src coordinate of source
   * @param {Coordinate} dst coordinate of destination
   * @param {number} nowT
   */
  IndoorNavigationAction.prototype.moveToDst = function(src, dst, nowT) {
    if (nowT == 1) {
      console.log("not move, now on dst");
    } else {
      console.log("move to dst");
      var newT = nowT + this.indoorNavigationData.moveRate;
      var moved = this.getMovedCoordinate(newT, src, dst);
      this.transformCamera(moved);

    }
  }



  /**
   * Calculate the coordinates that will be moved.
   * A detailed description of the calculation method is given in {@link MoveState.T}.
   * @param {number} newT
   * @param {Coordinate} src coordinate of source
   * @param {Coordinate} dst coordinate of destination
   * @return {Coordinate}
   */
  IndoorNavigationAction.prototype.getMovedCoordinate = function(newT, src, dst) {
    var moved = new Coordinate();
    moved.x = newT * (dst.x - src.x) + src.x;
    moved.y = newT * (dst.y - src.y) + src.y;
    moved.z = newT * (dst.z - src.z) + src.z;

    return moved;
  }



  /**
   * Transform position of camera using flyTo function of Cesium
   * @param {Coordinate} newPosition
   */
  IndoorNavigationAction.prototype.transformCamera = function(newPosition) {
    // console.log(newPosition);

    var heading = this.camera.heading;
    var pitch = this.camera.pitch;
    var roll = this.camera.roll;

    this.camera.flyTo({
      destination: new Cesium.Cartesian3(
        newPosition.x,
        newPosition.y,
        newPosition.z + this.indoorNavigationData.zfactor
      ),
      orientation: {
        heading: heading,
        pitch: pitch,
        roll: roll
      }
    });

  }



  /**
   * Calculate T for coordinates.
   * A detailed description of T is given in {@link MoveState.T}.
   * @param {Coordinate} src coordinate of source
   * @param {Coordinate} dst coordinate of destination
   * @param {Coordinate} now coordinate of camera
   * @return {number} T
   */
  IndoorNavigationAction.prototype.getT = function(src, dst, now) {
    return (now.x - src.x) / (dst.x - src.x);
  }



  /**
   * Disable default eventHandlers of Cesium.
   */
  IndoorNavigationAction.prototype.disableDefaultEventHandlers = function() {
    this.scene.screenSpaceCameraController.enableRotate = false;
    this.scene.screenSpaceCameraController.enableTranslate = false;
    this.scene.screenSpaceCameraController.enableZoom = false;
    this.scene.screenSpaceCameraController.enableTilt = false;
    this.scene.screenSpaceCameraController.enableLook = false;
  }



  /**
   * This is a function that should be executed when clicking the edge(path) visualized with Polyline.</br>
   * This reads the `id` from the clicked object and parses the `linename` consisting of the href values ​​at both ends of the edge
   * and passes it to {@link module:IndoorNavigationAction.onClickPath}.
   * @param {Cesium.Cesium3DTileFeature} feature Information about the items selected in the viewer.
   * @example
   * var handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
   * handler.setInputAction(function(movement) {
   *  var feature = viewer.scene.pick(movement.position);
   *  if (Cesium.defined(feature)) {
   *    indoorNavigation.onClickPolylinePath(feature);
   *  }
   * }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
   */
  IndoorNavigationAction.prototype.onClickPolylinePath = function(feature) {

    if (feature['id'] == undefined) {
      if (this.indoorNavigationData.nowMoveState.srcHref == null) {
        this.firstClickOnBuilding();
      }
    } else if (feature['id']['polyline'] != undefined) {

      /** Abstract edge data from path */
      var lineName = feature['id']['name'];
      this.onClickPath(lineName);
    }
    // console.log(feature);
  }



  /**
   * This is a function that should be executed when clicking the edge(path) visualized with Polygon.</br>
   * This reads the `id` from the clicked object and parses the `linename` consisting of the href values ​​at both ends of the edge
   * and passes it to {@link module:IndoorNavigationAction.onClickPath}.
   * @param {Cesium.Cesium3DTileFeature} feature Information about the items selected in the viewer.
   * @example
   * var handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
   * handler.setInputAction(function(movement) {
   *  var feature = viewer.scene.pick(movement.position);
   *  if (Cesium.defined(feature)) {
   *    indoorNavigation.onClickPolygonPath(feature);
   *  }
   * }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
   */
  IndoorNavigationAction.prototype.onClickPolygonPath = function(feature) {
    // console.log(feature);

    if (feature['id'] == undefined) {
      if (this.indoorNavigationData.nowMoveState.srcHref == null) {
        this.firstClickOnBuilding();
      }
    } else {
      var lineName = feature['id'];
      this.onClickPath(lineName);
    }
  }



  /**
   * This function works in the following order.</br>
   * 1. Parse src and dst href data from lineName.
   * 2. Check whether there is a part where nowMoveState overlaps with href data parsed in 1.</br>
   *    A. If there is no overlap, set {@link module:IndoorNavigationAction.nowMoveState} to path data.</br>
   *    B. If the camera is on src of edge, assign {@link module:IndoorNavigationAction.nowMoveState}.dstHref to dst of edge.</br>
   *    C. If the camera is on dst of edge, assign {@link module:IndoorNavigationAction.nowMoveState}.srcHref to src of edge.
   * 3. Get direction to move and move the camera. This working like {@link module:IndoorNavigationAction.actionMoveFront}.
   * @param {String} lineName consisting of the href values ​​at both ends of clicked edge.
   */
  IndoorNavigationAction.prototype.onClickPath = function(lineName) {

    /** parse href data from lineName */
    var pathSrcHref = lineName.substring(lineName.indexOf("#"), lineName.indexOf(","));
    var pathDstHref = lineName.substring(lineName.indexOf(",") + 1);

    var pathSrcCoor = this.indoorNavigationData.roomData.get(pathSrcHref).coordinate;
    var pathDstCoor = this.indoorNavigationData.roomData.get(pathDstHref).coordinate;

    /** coordinate data where camera exist now. */
    var now = new Coordinate();
    if (this.indoorNavigationData.nowMoveState.srcHref != null) {
      now = this.indoorNavigationData.roomData.get(this.indoorNavigationData.nowMoveState.srcHref).coordinate;
    }

    /** Check whether there is a part where nowMoveState overlaps with href data parsed in 1. */
    this.setNowMoveState4OnClickEdge(now, pathSrcCoor, pathDstCoor);

    /** Get direction to move and move the camera. */
    this.checkDirectionAndMoveOnEdge();

  }



  /**
   * If edge is clicked, the coordinates of both ends of edge are read,
   * assign proper value to `nowMoveState` :
   * 1. If current `nowMoveState` contains values of each side of edge, do nothing.
   * 2. If current `nowMoveState` didn't containing values of each side of edge, assign `nowMoveState` value using `setNowMoveStateUsingEdge`.
   * 3. If current position of camera is coordinates of source of edge, assign destination of `nowMoveState` to destination of edge.
   * 4. If current position of camera is coordinates of destination of edge, assign souce of `nowMoveState` to source of edge.
   */
  IndoorNavigationAction.prototype.setNowMoveState4OnClickEdge = function(now, pathSrcCoor, pathDstCoor) {

    if ((this.indoorNavigationData.nowMoveState.srcHref == pathSrcCoor.href &&
        this.indoorNavigationData.nowMoveState.dstHref == pathDstCoor.href) ||
      (this.indoorNavigationData.nowMoveState.srcHref == pathDstCoor.href &&
        this.indoorNavigationData.nowMoveState.dstHref == pathSrcCoor.href)) {

      /** If you are crossing the clicked edge, */
      /** do not assign new value to nowMoveState */

    } else if (now.href != pathSrcCoor.href || now.href != pathDstCoor.href) {

      /** if value of clicked edge not matches from nowMoveState data, set nowMoveState to path data */
      this.setNowMoveStateUsingEdge(pathSrcCoor, pathDstCoor);

    } else if (now.href == pathSrcCoor.href) {

      this.indoorNavigationData.nowMoveState.dstHref = pathDstCoor.href;
      this.indoorNavigationData.nowMoveState.srcHref = now.href;

    } else if (now.href == pathDstCoor.href) {

      this.indoorNavigationData.nowMoveState.srcHref = pathSrcCoor.href;
      this.indoorNavigationData.nowMoveState.dstHref = now.href;

    }

  }



  /**
   * Between src and dst, the side closer to the current coordinate is assigned to {@link module:IndoorNavigationAction.nowMoveState.srcHref}
   * and the far side is assigned to {@link module:IndoorNavigationAction.nowMoveState.dstHref}.
   * @param {Coordinate} src
   * @param {Coordinate} dst
   */
  IndoorNavigationAction.prototype.setNowMoveStateUsingEdge = function(src, dst) {

    var nowToSrcLen = Cesium.Cartesian3.distance(new Cesium.Cartesian3(src.x, src.y, src.z), this.camera.position);
    var nowToDstLen = Cesium.Cartesian3.distance(new Cesium.Cartesian3(dst.x, dst.y, dst.z), this.camera.position);

    if (nowToSrcLen > nowToDstLen) {
      this.transformCamera(dst);
      this.indoorNavigationData.nowMoveState.srcHref = dst.href;
      this.indoorNavigationData.nowMoveState.dstHref = src.href;
      this.indoorNavigationData.nowMoveState.T = 0;
    } else {
      this.transformCamera(src);
      this.indoorNavigationData.nowMoveState.srcHref = src.href;
      this.indoorNavigationData.nowMoveState.dstHref = dst.href;
      this.indoorNavigationData.nowMoveState.T = 0;
    }
  };



  /** Get direction to move and move the camera. This working like {@link module:IndoorNavigationAction.actionMoveFront}. */
  IndoorNavigationAction.prototype.checkDirectionAndMoveOnEdge = function() {

    var direction = this.getDirection(
      this.indoorNavigationData.roomData.get(this.indoorNavigationData.nowMoveState.srcHref).coordinate,
      this.indoorNavigationData.roomData.get(this.indoorNavigationData.nowMoveState.dstHref).coordinate,
      this.camera.direction);

    if (this.checkStairAndMove(this.indoorNavigationData.nowMoveState.srcHref, this.indoorNavigationData.nowMoveState.dstHref) == 10) {

      /* move stair */

    } else if (direction == 0 && this.indoorNavigationData.nowMoveState.T != 0) {

      /** camera see src direction */
      this.moveToSrc(
        this.indoorNavigationData.roomData.get(this.indoorNavigationData.nowMoveState.srcHref).coordinate,
        this.indoorNavigationData.roomData.get(this.indoorNavigationData.nowMoveState.dstHref).coordinate,
        this.indoorNavigationData.nowMoveState.T);

      this.indoorNavigationData.nowMoveState.T -= this.indoorNavigationData.moveRate;

    } else if (direction == 1 && this.indoorNavigationData.nowMoveState.T != 1) {

      /** camera see dst direction */
      this.moveToDst(
        this.indoorNavigationData.roomData.get(this.indoorNavigationData.nowMoveState.srcHref).coordinate,
        this.indoorNavigationData.roomData.get(this.indoorNavigationData.nowMoveState.dstHref).coordinate,
        this.indoorNavigationData.nowMoveState.T);

      this.indoorNavigationData.nowMoveState.T += this.indoorNavigationData.moveRate;

    } else if (direction == -1) {

      /** over threshold, not move */

    } else if (direction == 0 &&
      this.indoorNavigationData.nowMoveState.T == 0 &&
      this.getEdgesConnectedToNowSrc().length == 1 &&
      (this.getEdgesConnectedToNowSrc()[0].connects[0] == this.indoorNavigationData.nowMoveState.dstHref || this.getEdgesConnectedToNowSrc()[0].connects[1] == this.indoorNavigationData.nowMoveState.srcHref)) {

      /** no more node to move */
      console.log("no more node to move");

    } else if (direction == 1 &&
      this.indoorNavigationData.nowMoveState.T == 1 &&
      this.getEdgesConnectedToNowSrc().length == 1 &&
      (this.getEdgesConnectedToNowSrc()[0].connects[0] == this.indoorNavigationData.nowMoveState.dstHref || this.getEdgesConnectedToNowSrc()[0].connects[1] == this.indoorNavigationData.nowMoveState.srcHref)) {

      /** no more node to move */
      console.log("no more node to move");

    } else {
      /**
       * In this case, an error such as seeing src in src or dst in dst occurs.
       * This is often the case when dst and src are too close.
       */
      console.log("error! ", direction, this.indoorNavigationData.nowMoveState);
      // this.closeErrorControl(2, direction);
    }

  }


  /**
   * When the error that direction is 0(the camera see source of edge) and `nowMoveState.T` is 0(the camera is on source of edge) occurs this function will call.</br>
   * When two or more nodes are connected to one node and the interval is narrow, this error will occur if the node to be moved next is selected incorrectly.</br>
   * To escape this error, assign new value, not current dst or src, to `nowMoveState`.
   * @param {number} type 0, 2 : move front, 1 : move back. </br> After assign new value to `nowMoveState`, the camera will move forward or backward through this value.
   * @param {number} direction
   */
  IndoorNavigationAction.prototype.closeErrorControl = function(type, direction) {

    var exceptionNode;

    if (this.indoorNavigationData.nowMoveState.T == 1) {

      exceptionNode = this.indoorNavigationData.roomData.get(this.indoorNavigationData.nowMoveState.srcHref);

      this.indoorNavigationData.nowMoveState.T == 0;
      this.indoorNavigationData.nowMoveState.srcHref = this.indoorNavigationData.nowMoveState.dstHref;
      this.indoorNavigationData.nowMoveState.dstHref = null;
      this.indoorNavigationData.nowMoveState.T = 0;

    } else if (this.indoorNavigationData.nowMoveState.T == 0) {

      exceptionNode = this.indoorNavigationData.roomData.get(this.indoorNavigationData.nowMoveState.dstHref);

      this.indoorNavigationData.nowMoveState.dstHref = null;

    }

    var dstCandidate = this.getDstCandidateArray();

    dstCandidate.splice(this.getIndexOfCoordinate(dstCandidate, exceptionNode), 1);
    var newDstCoordinate = this.getMostSimilarNode(dstCandidate, this.camera.direction);

    this.indoorNavigationData.nowMoveState.dstHref = newDstCoordinate.href;

    if (type == 0 || type == 2) {
      this.checkDirectionAndMoveFront();
    } else if (type == 1) {
      this.checkDirectionAndMoveBack();
    }

  }



  /**
   * In array `arr`, find `coor` and return its index.
   * @param {Array} arr The array of Coordinate
   * @param {Coordinate} coor The Coordinates for which this function wants to find its index.
   * @return {number} If function finds `coor` in array, returns its index. If not, returns `-1`.
   */
  IndoorNavigationAction.prototype.getIndexOfCoordinate = function(arr, coor) {
    var arrLen = arr.length;
    for (var i = 0; i < arrLen; i++) {
      if (coor.coordinate.href == arr[i].href) return i;
    }
    return -1;
  }


  /**
   * Until you click on the building, you can freely explore the exterior of the building through the action of the mouse.</br>
   * This function is called when the building is first clicked</br>
   * This makes to move the camera to a space known as the building's entrance({@link module:IndoorNavigationAction.entranceHref}),
   * and disables the default events provide by cesium.</br>
   * After this function, you can visit the room through the functions that are defined in the {@link module:IndoorNavigation}.
   * {@link module:IndoorNavigationAction.setEntranceHref} must be called for this to work properly.
   */
  IndoorNavigationAction.prototype.firstClickOnBuilding = function() {
    if (this.indoorNavigationData.entranceHref != null) {
      var roomHref = [];
      roomHref[0] = this.indoorNavigationData.entranceHref;
      this.onClickTreeView(roomHref);
    }
  }



  /**
   * @param {Cesium.Cartesian3} buildingCoor
   * @param {Number} heading
   * @param {Number} pitch
   * @param {Number} roll
   */
  IndoorNavigationAction.prototype.flyToBuilding = function(buildingCoor, heading, pitch, roll) {
    this.camera.flyTo({
      destination: new Cesium.Cartesian3(
        buildingCoor.x,
        buildingCoor.y,
        buildingCoor.z
      ),
      orientation: {
        heading: heading,
        pitch: pitch,
        roll: roll
      }
    });
  }



  /**
   * Using the stored room information{@link module:IndoorNavigationData.roomData}, judge whether the current edge is a stair or not. </br>
   * If the floor of the room at both ends of the edge is different, this function judge as a stair and moves to the upper layer.
   * @param {string} srcHref href of source node of edge
   * @param {string} srcHref href of destination node of edge
   */
  IndoorNavigationAction.prototype.checkStairAndMove = function(srcHref, dstHref) {

    var upperFloorCoor, lowerFloorCoor;
    var srcCoor = this.indoorNavigationData.roomData.get(srcHref);
    var dstCoor = this.indoorNavigationData.roomData.get(dstHref);

    var srcFloor = parseInt(srcCoor.floor);
    var dstFloor = parseInt(dstCoor.floor);

    if (srcFloor < dstFloor) {
      upperFloorCoor = dstCoor;
      lowerFloorCoor = srcCoor;
    } else if (srcFloor > dstFloor) {
      upperFloorCoor = srcCoor;
      lowerFloorCoor = dstCoor;
    }

    if (upperFloorCoor != null && lowerFloorCoor != null) {
      this.transformCamera(upperFloorCoor.coordinate);
      this.indoorNavigationData.nowMoveState.srcHref = upperFloorCoor.coordinate.href;
      this.indoorNavigationData.nowMoveState.dstHref = null;
      this.indoorNavigationData.nowMoveState.T = 0;
      return 10;
    }
    return 0;
  }



  return IndoorNavigationAction;
});
