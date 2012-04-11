#if 0  // A cute trick to making this .cc self-building from shell.
g++ $0 -O2 -Wall -Werror -o `basename $0 .cc`;
exit;
#endif
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

#include "../base.h"
#include "../stream.h"
#include "../json.h"

#include <iostream>
#include <string>

using namespace webgl_loader;

int main() {
  std::string buf;
  StringSink sink(&buf);
  JsonSink json(&sink);
  
  json.BeginObject();
  json.PutString("string");
  json.PutBool(false);
  json.PutString("key");
  json.BeginArray();
  for (int i = 1; i < 8; ++i) {
    json.PutInt(i);
  }
  json.EndAll();
  
  std::cout << buf << std::endl;
  
  return 0;
}
