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
  BoxGeometry_default
} from "./chunk-MN3D77RO.js";
import "./chunk-UMFEPVOE.js";
import "./chunk-HAMCMKCX.js";
import "./chunk-WD6SRO3M.js";
import "./chunk-PJ2HJQ3U.js";
import "./chunk-Z3PIX66D.js";
import "./chunk-5EN4VYH2.js";
import "./chunk-JEZ2A3PU.js";
import "./chunk-3NZO4C7P.js";
import "./chunk-QBHDVMPH.js";
import "./chunk-MVM7ZSIZ.js";
import "./chunk-HRRYDXHM.js";
import "./chunk-MLVLM4V5.js";
import "./chunk-BU3ZYVMV.js";
import "./chunk-PDJBPIEO.js";
import {
  defined_default
} from "./chunk-4GWVZJTI.js";

// packages/engine/Source/Workers/createBoxGeometry.js
function createBoxGeometry(boxGeometry, offset) {
  if (defined_default(offset)) {
    boxGeometry = BoxGeometry_default.unpack(boxGeometry, offset);
  }
  return BoxGeometry_default.createGeometry(boxGeometry);
}
var createBoxGeometry_default = createBoxGeometry;
export {
  createBoxGeometry_default as default
};
