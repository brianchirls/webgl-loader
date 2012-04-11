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

#ifndef WEBGL_LOADER_STREAM_H_
#define WEBGL_LOADER_STREAM_H_

#include <stdio.h>
#include <string>
#include <vector>

#include "base.h"

namespace webgl_loader {

// An abstract interface to allow appending bytes to various streams.
class ByteSinkInterface {
 public:
  virtual void Put(char c) = 0;
  virtual size_t PutN(const char* data, size_t len) = 0;
};

// None of the concrete implementations actually own the backing data.
// They should be safe to copy.

class FileSink : public ByteSinkInterface {
 public:
  // |fp| is unowned and should not be NULL.
  explicit FileSink(FILE* fp)
    : fp_(fp) {
  }

  virtual void Put(char c) {
    PutChar(c, fp_);
  }

  virtual size_t PutN(const char* data, size_t len) {
    return fwrite(data, 1, len, fp_);
  }

 private:
  FILE *fp_;  // unowned.
};

class VectorSink : public ByteSinkInterface {
 public:
  // |vec| is unowned and should not be NULL.
  explicit VectorSink(std::vector<char>* vec)
    : vec_(vec) {
  }
  
  virtual void Put(char c) {
    vec_->push_back(c);
  }

  virtual size_t PutN(const char* data, size_t len) {
    vec_->insert(vec_->end(), data, data + len);
    return len;
  }

 private:
  std::vector<char>* vec_;  // unowned.
};

class StringSink : public ByteSinkInterface {
 public:
  // |str| is unowned and should not be NULL.
  explicit StringSink(std::string* str)
    : str_(str) {
  }

  virtual void Put(char c) {
    str_->append(1, c);
  }

  virtual size_t PutN(const char* data, size_t len) {
    str_->append(data, len);
    return len;
  }

 private:
  std::string* str_;  // unowned.
};

}  // namespace webgl_loader

#endif  // WEBGL_LOADER_STREAM_H_
