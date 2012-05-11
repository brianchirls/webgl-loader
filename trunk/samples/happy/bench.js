'use strict';

var out = window.document.getElementById('output');
var progress = window.document.getElementById('progress');

function decompressAttribsInner_(str, inputStart, inputEnd,
                                 output, outputStart, stride,
                                 decodeOffset, decodeScale) {
  var prev = 0;
  for (var j = inputStart; j < inputEnd; j++) {
    var code = str.charCodeAt(j);
    prev += (code >> 1) ^ (-(code & 1));
    output[outputStart] = decodeScale * (prev + decodeOffset);
    outputStart += stride;
  }
}

function decompressIndices_(str, inputStart, numIndices,
                            output, outputStart) {
  var highest = 0;
  for (var i = 0; i < numIndices; i++) {
    var code = str.charCodeAt(inputStart++);
    output[outputStart++] = highest - code;
    if (code == 0) {
      highest++;
    }
  }
}

function decompressMesh(str, meshParams, decodeParams, callback) {
  // Extract conversion parameters from attribArrays.
  var stride = decodeParams.decodeScales.length;
  var decodeOffsets = decodeParams.decodeOffsets;
  var decodeScales = decodeParams.decodeScales;
  var attribStart = meshParams.attribRange[0];
  var numVerts = meshParams.attribRange[1];

  // Decode attributes.
  var inputOffset = attribStart;
  var attribsOut = new Float32Array(stride * numVerts);
  for (var j = 0; j < stride; j++) {
    var end = inputOffset + numVerts;
    var decodeScale = decodeScales[j];
    if (decodeScale) {
      // Assume if decodeScale is never set, simply ignore the
      // attribute.
      decompressAttribsInner_(str, inputOffset, end,
                              attribsOut, j, stride,
                              decodeOffsets[j], decodeScale);
    }
    inputOffset = end;
  }

  var indexStart = meshParams.indexRange[0];
  var numIndices = 3*meshParams.indexRange[1];
  var indicesOut = new Uint16Array(numIndices);
  decompressIndices_(str, inputOffset, numIndices, indicesOut, 0);
}

function downloadMesh(path, meshEntry, decodeParams) {
  var downloadStart = Date.now();
  var req = new XMLHttpRequest();
  var lastIndexRange = meshEntry[meshEntry.length - 1].indexRange;
  progress.max = lastIndexRange[0] + 3*lastIndexRange[1];

  req.onload = function(e) {
    if (req.status === 200 || req.status === 0) {
      progress.value = req.responseText.length;
      var downloadEnd = Date.now();
      for (var count = 0; count < 16; count++) {
        for (var idx = 0; idx < meshEntry.length; ++idx) {
    	  var meshParams = meshEntry[idx];
  	  var indexRange = meshParams.indexRange;
	  var meshEnd = indexRange[0] + 3*indexRange[1];

	  decompressMesh(req.responseText, meshParams, decodeParams);
        }
      }
      var decompressEnd = Date.now();

      out.innerHTML = 'Download time: ' + (downloadEnd - downloadStart) +
        ' ms, Decode (x16) time: ' + (decompressEnd - downloadEnd) + ' ms';
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
  decodeOffsets: [-4095, -4095, -4095, 0, 0, -511, -511, -511],
  decodeScales: [1/8191, 1/8191, 1/8191, 0, 0, 1/1023, 1/1023, 1/1023]
};

downloadMesh("happy.utf8", [
    { material: "",
      attribRange: [0, 55294],
      indexRange: [442352, 107195],
    },
    { material: "",
      attribRange: [763937, 55294],
      indexRange: [1206289, 107742],
    },
    { material: "",
      attribRange: [1529515, 55294],
      indexRange: [1971867, 107160]
    },
    { material: "",
      attribRange: [2293347, 55294],
      indexRange: [2735699, 106284],
    },
    { material: "",
      attribRange: [3054551, 55294],
      indexRange: [3496903, 107142],
    },
    { material: "",
      attribRange: [3818329, 55294],
      indexRange: [4260681, 107062],
    },
    { material: "",
      attribRange: [4581867, 55294],
      indexRange: [5024219, 105773],
    },
    { material: "",
      attribRange: [5341538, 55294],
      indexRange: [5783890, 107983],
    },
    { material: "",
      attribRange: [6107839, 55294],
      indexRange: [6550191, 104468],
    },
    { material: "",
      attribRange: [6863595, 55294],
      indexRange: [7305947, 102345],
    },
    { material: "",
      attribRange: [7612982, 13733],
      indexRange: [7722846, 24562],
    },
  ], BUDDHA_DECODE_PARAMS);
