/**
 * @license
 * Cesium - https://github.com/CesiumGS/cesium
 * Version 1.110
 *
 * Copyright 2011-2022 Cesium Contributors
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

import {
  EllipseGeometry_default
} from "./chunk-JFQYX22Q.js";
import "./chunk-VATJJMV2.js";
import "./chunk-2WRJZ76F.js";
import "./chunk-XADWHUEG.js";
import "./chunk-OFDR5AMS.js";
import "./chunk-UVGAMNYN.js";
import "./chunk-UMFEPVOE.js";
import "./chunk-HAMCMKCX.js";
import "./chunk-NKJ54ZII.js";
import "./chunk-E6QFVXWT.js";
import "./chunk-YDIUX2NJ.js";
import "./chunk-WD6SRO3M.js";
import "./chunk-PJ2HJQ3U.js";
import "./chunk-Z3PIX66D.js";
import "./chunk-5EN4VYH2.js";
import "./chunk-JEZ2A3PU.js";
import "./chunk-3NZO4C7P.js";
import {
  Cartesian3_default,
  Ellipsoid_default
} from "./chunk-QBHDVMPH.js";
import "./chunk-MVM7ZSIZ.js";
import "./chunk-HRRYDXHM.js";
import "./chunk-MLVLM4V5.js";
import "./chunk-BU3ZYVMV.js";
import "./chunk-PDJBPIEO.js";
import {
  defined_default
} from "./chunk-4GWVZJTI.js";

// packages/engine/Source/Workers/createEllipseGeometry.js
function createEllipseGeometry(ellipseGeometry, offset) {
  if (defined_default(offset)) {
    ellipseGeometry = EllipseGeometry_default.unpack(ellipseGeometry, offset);
  }
  ellipseGeometry._center = Cartesian3_default.clone(ellipseGeometry._center);
  ellipseGeometry._ellipsoid = Ellipsoid_default.clone(ellipseGeometry._ellipsoid);
  return EllipseGeometry_default.createGeometry(ellipseGeometry);
}
var createEllipseGeometry_default = createEllipseGeometry;
export {
  createEllipseGeometry_default as default
};
