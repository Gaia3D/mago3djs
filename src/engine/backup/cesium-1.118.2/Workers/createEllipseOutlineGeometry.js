/**
 * @license
 * Cesium - https://github.com/CesiumGS/cesium
 * Version 1.118.2
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
  EllipseOutlineGeometry_default
} from "./chunk-352EISPR.js";
import "./chunk-AAS53MOH.js";
import "./chunk-6RRF5YBC.js";
import "./chunk-U53HAUFB.js";
import "./chunk-S6DUQVBD.js";
import "./chunk-7II32SQN.js";
import "./chunk-URYPPIUV.js";
import "./chunk-RQOFHLNO.js";
import "./chunk-7QBH4VK2.js";
import {
  Cartesian3_default,
  Ellipsoid_default
} from "./chunk-IBKAUZYG.js";
import "./chunk-JLMA55OI.js";
import "./chunk-T4N3SIDB.js";
import "./chunk-BATVGC7G.js";
import "./chunk-RTL3Y4IQ.js";
import "./chunk-3HL26SAA.js";
import {
  defined_default
} from "./chunk-BEJE5IMN.js";

// packages/engine/Source/Workers/createEllipseOutlineGeometry.js
function createEllipseOutlineGeometry(ellipseGeometry, offset) {
  if (defined_default(offset)) {
    ellipseGeometry = EllipseOutlineGeometry_default.unpack(ellipseGeometry, offset);
  }
  ellipseGeometry._center = Cartesian3_default.clone(ellipseGeometry._center);
  ellipseGeometry._ellipsoid = Ellipsoid_default.clone(ellipseGeometry._ellipsoid);
  return EllipseOutlineGeometry_default.createGeometry(ellipseGeometry);
}
var createEllipseOutlineGeometry_default = createEllipseOutlineGeometry;
export {
  createEllipseOutlineGeometry_default as default
};
