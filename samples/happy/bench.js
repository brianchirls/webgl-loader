'use strict';

var out = window.document.getElementById('output');
var progress = window.document.getElementById('progress');

var perfNow = Date.now;
if (performance.now) {
  perfNow = function() {
    return performance.now();
  };
}

function copyAttrib(stride, attribsOutFixed, lastAttrib, index) {
  for (var j = 0; j < stride; j++) {
    lastAttrib[j] = attribsOutFixed[stride*index + j];
  }
}

function decodeAttrib2(str, stride, decodeOffsets, decodeScales, deltaStart,
                       numVerts, attribsOut, attribsOutFixed, lastAttrib,
                       index) {
  for (var j = 0; j < 5; j++) {
    var code = str.charCodeAt(deltaStart + numVerts*j + index);
    var delta = (code >> 1) ^ (-(code & 1));
    lastAttrib[j] += delta;
    attribsOutFixed[stride*index + j] = lastAttrib[j];
    attribsOut[stride*index + j] =
      decodeScales[j] * (lastAttrib[j] + decodeOffsets[j]);
  }
}

function accumulateNormal(i0, i1, i2, attribsOutFixed, crosses) {
  var p0x = attribsOutFixed[8*i0 + 0];
  var p0y = attribsOutFixed[8*i0 + 1];
  var p0z = attribsOutFixed[8*i0 + 2];
  var p1x = attribsOutFixed[8*i1 + 0];
  var p1y = attribsOutFixed[8*i1 + 1];
  var p1z = attribsOutFixed[8*i1 + 2];
  var p2x = attribsOutFixed[8*i2 + 0];
  var p2y = attribsOutFixed[8*i2 + 1];
  var p2z = attribsOutFixed[8*i2 + 2];
  p1x -= p0x;
  p1y -= p0y;
  p1z -= p0z;
  p2x -= p0x;
  p2y -= p0y;
  p2z -= p0z;
  p0x = p1y*p2z - p1z*p2y;
  p0y = p1z*p2x - p1x*p2z;
  p0z = p1x*p2y - p1y*p2x;

  crosses[3*i0 + 0] += p0x;
  crosses[3*i0 + 1] += p0y;
  crosses[3*i0 + 2] += p0z;

  crosses[3*i1 + 0] += p0x;
  crosses[3*i1 + 1] += p0y;
  crosses[3*i1 + 2] += p0z;

  crosses[3*i2 + 0] += p0x;
  crosses[3*i2 + 1] += p0y;
  crosses[3*i2 + 2] += p0z;
}

function decompressMesh2(str, meshParams, decodeParams) {
  var MAX_BACKREF = 96;
  // Extract conversion parameters from attribArrays.
  var stride = decodeParams.decodeScales.length;
  var decodeOffsets = decodeParams.decodeOffsets;
  var decodeScales = decodeParams.decodeScales;
  var deltaStart = meshParams.attribRange[0];
  var numVerts = meshParams.attribRange[1];
  var codeStart = meshParams.codeRange[0];
  var codeLength = meshParams.codeRange[1];
  var numIndices = 3*meshParams.codeRange[2];
  var indicesOut = new Uint16Array(numIndices);
  var crosses = new Int32Array(3*numVerts);
  var lastAttrib = new Uint16Array(stride);
  var attribsOutFixed = new Uint16Array(stride * numVerts);
  var attribsOut = new Float32Array(stride * numVerts);
  var highest = 0;
  var outputStart = 0;
  for (var i = 0; i < numIndices; i += 3) {
    var code = str.charCodeAt(codeStart++);
    var max_backref = Math.min(i, MAX_BACKREF);
    if (code < max_backref) {
      // Parallelogram
      var winding = code % 3;
      var backref = i - (code - winding);
      var i0, i1, i2;
      switch (winding) {
      case 0:
        i0 = indicesOut[backref + 2];
        i1 = indicesOut[backref + 1];
        i2 = indicesOut[backref + 0];
        break;
      case 1:
        i0 = indicesOut[backref + 0];
        i1 = indicesOut[backref + 2];
        i2 = indicesOut[backref + 1];
        break;
      case 2:
        i0 = indicesOut[backref + 1];
        i1 = indicesOut[backref + 0];
        i2 = indicesOut[backref + 2];
        break;
      }
      indicesOut[outputStart++] = i0;
      indicesOut[outputStart++] = i1;
      code = str.charCodeAt(codeStart++);
      var index = highest - code;
      indicesOut[outputStart++] = index;
      if (code === 0) {
        for (var j = 0; j < 5; j++) {
          var deltaCode = str.charCodeAt(deltaStart + numVerts*j + highest);
          var prediction = ((deltaCode >> 1) ^ (-(deltaCode & 1))) +
            attribsOutFixed[stride*i0 + j] +
            attribsOutFixed[stride*i1 + j] -
            attribsOutFixed[stride*i2 + j];
          lastAttrib[j] = prediction;
          attribsOutFixed[stride*highest + j] = prediction;
          attribsOut[stride*highest + j] =
            decodeScales[j] * (prediction + decodeOffsets[j]);
        }
        highest++;
      } else {
        copyAttrib(stride, attribsOutFixed, lastAttrib, index);
      }
      accumulateNormal(i0, i1, index, attribsOutFixed, crosses);
    } else {
      // Simple
      var index0 = highest - (code - max_backref);
      indicesOut[outputStart++] = index0;
      if (code === max_backref) {
        decodeAttrib2(str, stride, decodeOffsets, decodeScales, deltaStart,
                      numVerts, attribsOut, attribsOutFixed, lastAttrib,
                      highest++);
      } else {
        copyAttrib(stride, attribsOutFixed, lastAttrib, index0);
      }
      code = str.charCodeAt(codeStart++);
      var index1 = highest - code;
      indicesOut[outputStart++] = index1;
      if (code === 0) {
        decodeAttrib2(str, stride, decodeOffsets, decodeScales, deltaStart,
                      numVerts, attribsOut, attribsOutFixed, lastAttrib,
                      highest++);
      } else {
        copyAttrib(stride, attribsOutFixed, lastAttrib, index1);
      }
      code = str.charCodeAt(codeStart++);
      var index2 = highest - code;
      indicesOut[outputStart++] = index2;
      if (code === 0) {
        for (var j = 0; j < 5; j++) {
          lastAttrib[j] = (attribsOutFixed[stride*index0 + j] +
                           attribsOutFixed[stride*index1 + j]) / 2;
        }
        decodeAttrib2(str, stride, decodeOffsets, decodeScales, deltaStart,
                      numVerts, attribsOut, attribsOutFixed, lastAttrib,
                      highest++);
      } else {
        copyAttrib(stride, attribsOutFixed, lastAttrib, index2);
      }
      accumulateNormal(index0, index1, index2, attribsOutFixed, crosses);
    }
  }
  for (var i = 0; i < numVerts; i++) {
    var nx = crosses[3*i + 0];
    var ny = crosses[3*i + 1];
    var nz = crosses[3*i + 2];
    var norm = 511.0 / Math.sqrt(nx*nx + ny*ny + nz*nz);

    var cx = str.charCodeAt(deltaStart + 5*numVerts + i);
    var cy = str.charCodeAt(deltaStart + 6*numVerts + i);
    var cz = str.charCodeAt(deltaStart + 7*numVerts + i);

    attribsOut[stride*i + 5] = norm*nx + ((cx >> 1) ^ (-(cx & 1)));
    attribsOut[stride*i + 6] = norm*ny + ((cy >> 1) ^ (-(cy & 1)));
    attribsOut[stride*i + 7] = norm*nz + ((cz >> 1) ^ (-(cz & 1)));
  }
}

function downloadMesh(path, meshEntry, decodeParams) {
  var downloadStart = perfNow();
  var req = new XMLHttpRequest();
  var lastCodeRange = meshEntry[meshEntry.length - 1].codeRange;
  progress.max = lastCodeRange[0] + lastCodeRange[1];

  req.onload = function(e) {
    if (req.status === 200 || req.status === 0) {
      progress.value = req.responseText.length;
      var downloadEnd = perfNow();
      for (var count = 0; count < 10; count++) {
        var numTriangles = 0;
        for (var idx = 0; idx < meshEntry.length; ++idx) {
    	  var meshParams = meshEntry[idx];
  	  var codeRange = meshParams.codeRange;
	  var meshEnd = codeRange[0] + codeRange[1];
          numTriangles += codeRange[2];

	  decompressMesh2(req.responseText, meshParams, decodeParams);
        }
      }
      var decompressEnd = perfNow();

      var decompressSec = (decompressEnd - downloadEnd) / 1000;

      out.innerHTML = 'Download time: ' + (downloadEnd - downloadStart) +
        ' ms<br># triangles: ' + numTriangles + '<br>Decode (x10) time: ' +
        decompressSec + ' sec<br>' + (10 * numTriangles / decompressSec) +
        ' triangles per second.';
    } else {
      out.innerHTML = 'Error downloading ' + path;
    }
  };
  req.onprogress = function() {
    progress.value = req.responseText.length;
  };
  req.open('GET', path, true);
  req.send(null);
}

var BUDDHA_DECODE_PARAMS = {
  decodeOffsets: [-1023, -1023, -1023, 0, 0, -127, -127, -127],
  decodeScales: [1/2047, 1/2047, 1/2047, 0, 0, 1/255, 1/255, 1/255]
};

// 1,087,474 Triangles.
downloadMesh("happy.utf8", [
      { "material": "",
        "attribRange": [0, 55294],
        "codeRange": [442352, 215001, 107474]
      },
      { "material": "",
        "attribRange": [657353, 55294],
        "codeRange": [1099705, 215393, 107671]
      },
      { "material": "",
        "attribRange": [1315098, 55294],
        "codeRange": [1757450, 215179, 107550]
      },
      { "material": "",
        "attribRange": [1972629, 55294],
        "codeRange": [2414981, 216027, 107975]
      },
      { "material": "",
        "attribRange": [2631008, 55294],
        "codeRange": [3073360, 213121, 106518]
      },
      { "material": "",
        "attribRange": [3286481, 55294],
        "codeRange": [3728833, 214768, 107346]
      },
      { "material": "",
        "attribRange": [3943601, 55294],
        "codeRange": [4385953, 211439, 105659]
      },
      { "material": "",
        "attribRange": [4597392, 55294],
        "codeRange": [5039744, 213710, 106789]
      },
      { "material": "",
        "attribRange": [5253454, 55294],
        "codeRange": [5695806, 212303, 106083]
      },
      { "material": "",
        "attribRange": [5908109, 55294],
        "codeRange": [6350461, 205699, 102676]
      },
      { "material": "",
        "attribRange": [6556160, 12461],
        "codeRange": [6655848, 44141, 21975]
      }
  ], BUDDHA_DECODE_PARAMS);
