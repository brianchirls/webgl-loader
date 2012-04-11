// Copyright 2012 Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
// implied. See the License for the specific language governing
// permissions and limitations under the License.

#ifndef WEBGL_LOADER_COMPRESS_H_
#define WEBGL_LOADER_COMPRESS_H_

#include "base.h"
#include "bounds.h"
#include "stream.h"
#include "utf8.h"

namespace webgl_loader {

void AttribsToQuantizedAttribs(const AttribList& interleaved_attribs,
                               const BoundsParams& bounds_params,
                               QuantizedAttribList* quantized_attribs) {
  quantized_attribs->resize(interleaved_attribs.size());
  for (size_t i = 0; i < interleaved_attribs.size(); i += 8) {
    for (size_t j = 0; j < 8; ++j) {
      quantized_attribs->at(i + j) = Quantize(interleaved_attribs[i + j],
                                              bounds_params.mins[j],
                                              bounds_params.scales[j],
                                              bounds_params.outputMaxes[j]);
    }
  }
}

uint16 ZigZag(int16 word) {
  return (word >> 15) ^ (word << 1);
}

void CompressAABBToUtf8(const Bounds& bounds,
                        const BoundsParams& total_bounds,
                        ByteSinkInterface* utf8) {
  const int maxPosition = (1 << 14) - 1;  // 16383;
  uint16 mins[3] = { 0 };
  uint16 maxes[3] = { 0 };
  for (int i = 0; i < 3; ++i) {
    float total_min = total_bounds.mins[i];
    float total_scale = total_bounds.scales[i];
    mins[i] = Quantize(bounds.mins[i], total_min, total_scale, maxPosition);
    maxes[i] = Quantize(bounds.maxes[i], total_min, total_scale, maxPosition);
  }
  for (int i = 0; i < 3; ++i) {
    Uint16ToUtf8(mins[i], utf8);
  }
  for (int i = 0; i < 3; ++i) {
    Uint16ToUtf8(maxes[i] - mins[i], utf8);
  }
}

void CompressIndicesToUtf8(const OptimizedIndexList& list,
                           ByteSinkInterface* utf8) {
  // For indices, we don't do delta from the most recent index, but
  // from the high water mark. The assumption is that the high water
  // mark only ever moves by one at a time. Foruntately, the vertex
  // optimizer does that for us, to optimize for per-transform vertex
  // fetch order.
  uint16 index_high_water_mark = 0;
  for (size_t i = 0; i < list.size(); ++i) {
    const int index = list[i];
    CHECK(index >= 0);
    CHECK(index <= index_high_water_mark);
    CHECK(Uint16ToUtf8(index_high_water_mark - index, utf8));
    if (index == index_high_water_mark) {
      ++index_high_water_mark;
    }
  }
}

void CompressQuantizedAttribsToUtf8(const QuantizedAttribList& attribs,
                                    ByteSinkInterface* utf8) {
  for (size_t i = 0; i < 8; ++i) {
    // Use a transposed representation, and delta compression.
    uint16 prev = 0;
    for (size_t j = i; j < attribs.size(); j += 8) {
      const uint16 word = attribs[j];
      const uint16 za = ZigZag(static_cast<int16>(word - prev));
      prev = word;
      CHECK(Uint16ToUtf8(za, utf8));
    }
  }
}

}  // namespace webgl_loader

#endif  // WEBGL_LOADER_COMPRESS_H_
