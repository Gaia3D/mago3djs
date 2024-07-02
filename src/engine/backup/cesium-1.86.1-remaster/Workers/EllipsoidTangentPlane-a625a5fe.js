/**
 * Cesium - https://github.com/CesiumGS/cesium
 *
 * Copyright 2011-2020 Cesium Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Columbus View (Pat. Pend.)
 *
 * Portions licensed separately.
 * See https://github.com/CesiumGS/cesium/blob/main/LICENSE.md for full licensing details.
 */

define(['exports', './AxisAlignedBoundingBox-6cc05ad6', './Matrix2-f2da41d4', './RuntimeError-ffe03243', './when-229515d6', './IntersectionTests-38c622a7', './Plane-0421a8be', './Transforms-5a906b9e'], (function (exports, AxisAlignedBoundingBox, Matrix2, RuntimeError, when, IntersectionTests, Plane, Transforms) { 'use strict';

  var scratchCart4 = new Matrix2.Cartesian4();
  /**
   * A plane tangent to the provided ellipsoid at the provided origin.
   * If origin is not on the surface of the ellipsoid, it's surface projection will be used.
   * If origin is at the center of the ellipsoid, an exception will be thrown.
   * @alias EllipsoidTangentPlane
   * @constructor
   *
   * @param {Cartesian3} origin The point on the surface of the ellipsoid where the tangent plane touches.
   * @param {Ellipsoid} [ellipsoid=Ellipsoid.WGS84] The ellipsoid to use.
   *
   * @exception {DeveloperError} origin must not be at the center of the ellipsoid.
   */
  function EllipsoidTangentPlane(origin, ellipsoid) {

    ellipsoid = when.defaultValue(ellipsoid, Matrix2.Ellipsoid.WGS84);
    origin = ellipsoid.scaleToGeodeticSurface(origin);


    var eastNorthUp = Transforms.Transforms.eastNorthUpToFixedFrame(origin, ellipsoid);
    this._ellipsoid = ellipsoid;
    this._origin = origin;
    this._xAxis = Matrix2.Cartesian3.fromCartesian4(
      Matrix2.Matrix4.getColumn(eastNorthUp, 0, scratchCart4)
    );
    this._yAxis = Matrix2.Cartesian3.fromCartesian4(
      Matrix2.Matrix4.getColumn(eastNorthUp, 1, scratchCart4)
    );

    var normal = Matrix2.Cartesian3.fromCartesian4(
      Matrix2.Matrix4.getColumn(eastNorthUp, 2, scratchCart4)
    );
    this._plane = Plane.Plane.fromPointNormal(origin, normal);
  }

  Object.defineProperties(EllipsoidTangentPlane.prototype, {
    /**
     * Gets the ellipsoid.
     * @memberof EllipsoidTangentPlane.prototype
     * @type {Ellipsoid}
     */
    ellipsoid: {
      get: function () {
        return this._ellipsoid;
      },
    },

    /**
     * Gets the origin.
     * @memberof EllipsoidTangentPlane.prototype
     * @type {Cartesian3}
     */
    origin: {
      get: function () {
        return this._origin;
      },
    },

    /**
     * Gets the plane which is tangent to the ellipsoid.
     * @memberof EllipsoidTangentPlane.prototype
     * @readonly
     * @type {Plane}
     */
    plane: {
      get: function () {
        return this._plane;
      },
    },

    /**
     * Gets the local X-axis (east) of the tangent plane.
     * @memberof EllipsoidTangentPlane.prototype
     * @readonly
     * @type {Cartesian3}
     */
    xAxis: {
      get: function () {
        return this._xAxis;
      },
    },

    /**
     * Gets the local Y-axis (north) of the tangent plane.
     * @memberof EllipsoidTangentPlane.prototype
     * @readonly
     * @type {Cartesian3}
     */
    yAxis: {
      get: function () {
        return this._yAxis;
      },
    },

    /**
     * Gets the local Z-axis (up) of the tangent plane.
     * @memberof EllipsoidTangentPlane.prototype
     * @readonly
     * @type {Cartesian3}
     */
    zAxis: {
      get: function () {
        return this._plane.normal;
      },
    },
  });

  var tmp = new AxisAlignedBoundingBox.AxisAlignedBoundingBox();
  /**
   * Creates a new instance from the provided ellipsoid and the center
   * point of the provided Cartesians.
   *
   * @param {Cartesian3[]} cartesians The list of positions surrounding the center point.
   * @param {Ellipsoid} [ellipsoid=Ellipsoid.WGS84] The ellipsoid to use.
   * @returns {EllipsoidTangentPlane} The new instance of EllipsoidTangentPlane.
   */
  EllipsoidTangentPlane.fromPoints = function (cartesians, ellipsoid) {

    var box = AxisAlignedBoundingBox.AxisAlignedBoundingBox.fromPoints(cartesians, tmp);
    return new EllipsoidTangentPlane(box.center, ellipsoid);
  };

  var scratchProjectPointOntoPlaneRay = new IntersectionTests.Ray();
  var scratchProjectPointOntoPlaneCartesian3 = new Matrix2.Cartesian3();

  /**
   * Computes the projection of the provided 3D position onto the 2D plane, radially outward from the {@link EllipsoidTangentPlane.ellipsoid} coordinate system origin.
   *
   * @param {Cartesian3} cartesian The point to project.
   * @param {Cartesian2} [result] The object onto which to store the result.
   * @returns {Cartesian2} The modified result parameter or a new Cartesian2 instance if none was provided. Undefined if there is no intersection point
   */
  EllipsoidTangentPlane.prototype.projectPointOntoPlane = function (
    cartesian,
    result
  ) {

    var ray = scratchProjectPointOntoPlaneRay;
    ray.origin = cartesian;
    Matrix2.Cartesian3.normalize(cartesian, ray.direction);

    var intersectionPoint = IntersectionTests.IntersectionTests.rayPlane(
      ray,
      this._plane,
      scratchProjectPointOntoPlaneCartesian3
    );
    if (!when.defined(intersectionPoint)) {
      Matrix2.Cartesian3.negate(ray.direction, ray.direction);
      intersectionPoint = IntersectionTests.IntersectionTests.rayPlane(
        ray,
        this._plane,
        scratchProjectPointOntoPlaneCartesian3
      );
    }

    if (when.defined(intersectionPoint)) {
      var v = Matrix2.Cartesian3.subtract(
        intersectionPoint,
        this._origin,
        intersectionPoint
      );
      var x = Matrix2.Cartesian3.dot(this._xAxis, v);
      var y = Matrix2.Cartesian3.dot(this._yAxis, v);

      if (!when.defined(result)) {
        return new Matrix2.Cartesian2(x, y);
      }
      result.x = x;
      result.y = y;
      return result;
    }
    return undefined;
  };

  /**
   * Computes the projection of the provided 3D positions onto the 2D plane (where possible), radially outward from the global origin.
   * The resulting array may be shorter than the input array - if a single projection is impossible it will not be included.
   *
   * @see EllipsoidTangentPlane.projectPointOntoPlane
   *
   * @param {Cartesian3[]} cartesians The array of points to project.
   * @param {Cartesian2[]} [result] The array of Cartesian2 instances onto which to store results.
   * @returns {Cartesian2[]} The modified result parameter or a new array of Cartesian2 instances if none was provided.
   */
  EllipsoidTangentPlane.prototype.projectPointsOntoPlane = function (
    cartesians,
    result
  ) {

    if (!when.defined(result)) {
      result = [];
    }

    var count = 0;
    var length = cartesians.length;
    for (var i = 0; i < length; i++) {
      var p = this.projectPointOntoPlane(cartesians[i], result[count]);
      if (when.defined(p)) {
        result[count] = p;
        count++;
      }
    }
    result.length = count;
    return result;
  };

  /**
   * Computes the projection of the provided 3D position onto the 2D plane, along the plane normal.
   *
   * @param {Cartesian3} cartesian The point to project.
   * @param {Cartesian2} [result] The object onto which to store the result.
   * @returns {Cartesian2} The modified result parameter or a new Cartesian2 instance if none was provided.
   */
  EllipsoidTangentPlane.prototype.projectPointToNearestOnPlane = function (
    cartesian,
    result
  ) {

    if (!when.defined(result)) {
      result = new Matrix2.Cartesian2();
    }

    var ray = scratchProjectPointOntoPlaneRay;
    ray.origin = cartesian;
    Matrix2.Cartesian3.clone(this._plane.normal, ray.direction);

    var intersectionPoint = IntersectionTests.IntersectionTests.rayPlane(
      ray,
      this._plane,
      scratchProjectPointOntoPlaneCartesian3
    );
    if (!when.defined(intersectionPoint)) {
      Matrix2.Cartesian3.negate(ray.direction, ray.direction);
      intersectionPoint = IntersectionTests.IntersectionTests.rayPlane(
        ray,
        this._plane,
        scratchProjectPointOntoPlaneCartesian3
      );
    }

    var v = Matrix2.Cartesian3.subtract(
      intersectionPoint,
      this._origin,
      intersectionPoint
    );
    var x = Matrix2.Cartesian3.dot(this._xAxis, v);
    var y = Matrix2.Cartesian3.dot(this._yAxis, v);

    result.x = x;
    result.y = y;
    return result;
  };

  /**
   * Computes the projection of the provided 3D positions onto the 2D plane, along the plane normal.
   *
   * @see EllipsoidTangentPlane.projectPointToNearestOnPlane
   *
   * @param {Cartesian3[]} cartesians The array of points to project.
   * @param {Cartesian2[]} [result] The array of Cartesian2 instances onto which to store results.
   * @returns {Cartesian2[]} The modified result parameter or a new array of Cartesian2 instances if none was provided. This will have the same length as <code>cartesians</code>.
   */
  EllipsoidTangentPlane.prototype.projectPointsToNearestOnPlane = function (
    cartesians,
    result
  ) {

    if (!when.defined(result)) {
      result = [];
    }

    var length = cartesians.length;
    result.length = length;
    for (var i = 0; i < length; i++) {
      result[i] = this.projectPointToNearestOnPlane(cartesians[i], result[i]);
    }
    return result;
  };

  var projectPointsOntoEllipsoidScratch = new Matrix2.Cartesian3();
  /**
   * Computes the projection of the provided 2D position onto the 3D ellipsoid.
   *
   * @param {Cartesian2} cartesian The points to project.
   * @param {Cartesian3} [result] The Cartesian3 instance to store result.
   * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if none was provided.
   */
  EllipsoidTangentPlane.prototype.projectPointOntoEllipsoid = function (
    cartesian,
    result
  ) {

    if (!when.defined(result)) {
      result = new Matrix2.Cartesian3();
    }

    var ellipsoid = this._ellipsoid;
    var origin = this._origin;
    var xAxis = this._xAxis;
    var yAxis = this._yAxis;
    var tmp = projectPointsOntoEllipsoidScratch;

    Matrix2.Cartesian3.multiplyByScalar(xAxis, cartesian.x, tmp);
    result = Matrix2.Cartesian3.add(origin, tmp, result);
    Matrix2.Cartesian3.multiplyByScalar(yAxis, cartesian.y, tmp);
    Matrix2.Cartesian3.add(result, tmp, result);
    ellipsoid.scaleToGeocentricSurface(result, result);

    return result;
  };

  /**
   * Computes the projection of the provided 2D positions onto the 3D ellipsoid.
   *
   * @param {Cartesian2[]} cartesians The array of points to project.
   * @param {Cartesian3[]} [result] The array of Cartesian3 instances onto which to store results.
   * @returns {Cartesian3[]} The modified result parameter or a new array of Cartesian3 instances if none was provided.
   */
  EllipsoidTangentPlane.prototype.projectPointsOntoEllipsoid = function (
    cartesians,
    result
  ) {

    var length = cartesians.length;
    if (!when.defined(result)) {
      result = new Array(length);
    } else {
      result.length = length;
    }

    for (var i = 0; i < length; ++i) {
      result[i] = this.projectPointOntoEllipsoid(cartesians[i], result[i]);
    }

    return result;
  };

  exports.EllipsoidTangentPlane = EllipsoidTangentPlane;

}));
