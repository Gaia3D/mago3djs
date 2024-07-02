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
  defaultValue_default
} from "./chunk-BU3ZYVMV.js";
import {
  DeveloperError_default
} from "./chunk-PDJBPIEO.js";
import {
  defined_default
} from "./chunk-4GWVZJTI.js";

// packages/engine/Source/Core/oneTimeWarning.js
var warnings = {};
function oneTimeWarning(identifier, message) {
  if (!defined_default(identifier)) {
    throw new DeveloperError_default("identifier is required.");
  }
  if (!defined_default(warnings[identifier])) {
    warnings[identifier] = true;
    console.warn(defaultValue_default(message, identifier));
  }
}
oneTimeWarning.geometryOutlines = "Entity geometry outlines are unsupported on terrain. Outlines will be disabled. To enable outlines, disable geometry terrain clamping by explicitly setting height to 0.";
oneTimeWarning.geometryZIndex = "Entity geometry with zIndex are unsupported when height or extrudedHeight are defined.  zIndex will be ignored";
oneTimeWarning.geometryHeightReference = "Entity corridor, ellipse, polygon or rectangle with heightReference must also have a defined height.  heightReference will be ignored";
oneTimeWarning.geometryExtrudedHeightReference = "Entity corridor, ellipse, polygon or rectangle with extrudedHeightReference must also have a defined extrudedHeight.  extrudedHeightReference will be ignored";
var oneTimeWarning_default = oneTimeWarning;

export {
  oneTimeWarning_default
};
