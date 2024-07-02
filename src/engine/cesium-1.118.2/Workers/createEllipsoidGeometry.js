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
  EllipsoidGeometry_default
} from "./chunk-J4K4SDC4.js";
import "./chunk-6RRF5YBC.js";
import "./chunk-RAOUHMDC.js";
import "./chunk-U53HAUFB.js";
import "./chunk-S6DUQVBD.js";
import "./chunk-7II32SQN.js";
import "./chunk-URYPPIUV.js";
import "./chunk-RQOFHLNO.js";
import "./chunk-7QBH4VK2.js";
import "./chunk-IBKAUZYG.js";
import "./chunk-JLMA55OI.js";
import "./chunk-T4N3SIDB.js";
import "./chunk-BATVGC7G.js";
import "./chunk-RTL3Y4IQ.js";
import "./chunk-3HL26SAA.js";
import {
  defined_default
} from "./chunk-BEJE5IMN.js";

// packages/engine/Source/Workers/createEllipsoidGeometry.js
function createEllipsoidGeometry(ellipsoidGeometry, offset) {
  if (defined_default(offset)) {
    ellipsoidGeometry = EllipsoidGeometry_default.unpack(ellipsoidGeometry, offset);
  }
  return EllipsoidGeometry_default.createGeometry(ellipsoidGeometry);
}
var createEllipsoidGeometry_default = createEllipsoidGeometry;
export {
  createEllipsoidGeometry_default as default
};
