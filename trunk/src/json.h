// Copyright 2011 Google Inc. All Rights Reserved.
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

#ifndef WEBGL_LOADER_JSON_H_
#define WEBGL_LOADER_JSON_H_

#include <float.h>
#include <stdio.h>
#include <string.h>

#include <vector>

#include "base.h"
#include "stream.h"

namespace webgl_loader {

// TODO: Pretty printing.
class JsonSink {
 public:
  explicit JsonSink(ByteSinkInterface* sink)
    : sink_(sink) {
    state_.reserve(8);
    PushState(JSON_STATE_SIMPLE);
  }

  ~JsonSink() {
    EndAll();
  }

  void PutNull() {
    OnPutValue();
    PutStringInternal("null", 4);
  }

  void PutBool(bool b) {
    OnPutValue();
    PutStringInternal(b ? "true" : "false", b ? 4 : 5);
  }

  void PutInt(int i) {
    OnPutValue();
    char buf[kBufSize];
    int len = sprintf(buf, "%d", i);
    CHECK(len > 0 && len < kBufSize);
    PutStringInternal(buf, len);
  }

  void PutFloat(float f) {
    OnPutValue();
    char buf[kBufSize];
    int len = sprintf(buf, "%g", f);
    CHECK(len > 0 && len < kBufSize);
    PutStringInternal(buf, len);
  }

  void PutString(const char* str) {
    // Strings are the only legal value for object keys.
    switch (GetState()) {
    case JSON_STATE_OBJECT_KEY:
      Put(',');  // fall through.
    case JSON_STATE_OBJECT_KEY_FIRST:
      SetState(JSON_STATE_OBJECT_VALUE);
      break;
    default:
      UpdateState();
    }

    // TODO: escaping!
    Put('\"');
    PutStringInternal(str, strlen(str));
    Put('\"');
  }

  void BeginArray() {
    OnPutValue();
    Put('[');
    PushState(JSON_STATE_ARRAY_FIRST);
  }

  void BeginObject() {
    OnPutValue();
    Put('{');
    PushState(JSON_STATE_OBJECT_KEY_FIRST);
  }

  void End() {
    switch (GetState()) {
    case JSON_STATE_OBJECT_VALUE:
      // We haven't provided a value, so emit a null..
      PutNull();  // ...and fall through to the normal case.
    case JSON_STATE_OBJECT_KEY:
    case JSON_STATE_OBJECT_KEY_FIRST:
      Put('}');
      break;
    case JSON_STATE_ARRAY_FIRST:
    case JSON_STATE_ARRAY:
      Put(']');
      break;
    default: 
      return;  // Do nothing.
    }
    PopState();
  }
  
  void EndAll() {
    while (GetState() != JSON_STATE_SIMPLE) End();
  }
  
 private:
  static const int kBufSize = 32;
  
  enum State {
    JSON_STATE_OBJECT_VALUE,
    JSON_STATE_OBJECT_KEY_FIRST,
    JSON_STATE_OBJECT_KEY,
    JSON_STATE_ARRAY_FIRST,
    JSON_STATE_ARRAY,
    JSON_STATE_SIMPLE,
  };

  State GetState() const {
    return state_.back();
  }

  void CheckNotKey() const {
    CHECK(GetState() != JSON_STATE_OBJECT_KEY_FIRST ||
	  GetState() != JSON_STATE_OBJECT_KEY);
  }

  void SetState(State state) {
    state_.back() = state;
  }

  void PushState(State state) {
    state_.push_back(state);
  }

  void PopState() {
    state_.pop_back();
  }

  void UpdateState() {
    switch (GetState()) {
    case JSON_STATE_OBJECT_VALUE:
      Put(':');
      SetState(JSON_STATE_OBJECT_KEY);
      return;
    case JSON_STATE_ARRAY_FIRST:
      SetState(JSON_STATE_ARRAY);
      return;
    case JSON_STATE_ARRAY:
      Put(',');
      return;
    default:
      return;
    }
  }

  void OnPutValue() {
    CheckNotKey();
    UpdateState();
  }

  void Put(char c) {
    sink_->Put(c);
  }
  
  void PutStringInternal(const char* str, size_t len) {
    sink_->PutN(str, len);
  }
  
  ByteSinkInterface* sink_;
  std::vector<State> state_;
};

}  // namespace webgl_loader

#endif  // WEBGL_LOADER_JSON_H_
