### Intro ###

The _raison d'être_ for webgl-loader is to efficiently load meshes using HTTP and JS. Until recently, webgl-loader didn't deal with very large meshes. In particular, it couldn't handle meshes that had with more vertices than WebGL could handle in a single `DrawIndexed` call. In practice, this meant that a single mesh could only be ~100k triangles.

As of [r41](https://code.google.com/p/webgl-loader/source/detail?r=41), webgl-loader no longer has this restriction, and will happily split large meshes into several smaller ones. [The demo](http://webgl-loader.googlecode.com/svn/trunk/samples/happy/happy.html) loads and renders a >1 million mesh quite efficiently.

There are alternatives, of course. One that has gotten some attention is [x3dom's image geometry approach](http://x3dom.org/x3dom/example/x3dom_imageGeometry.html). However, there are several shortcomings compared to the [the webgl-loader approach](http://webgl-loader.googlecode.com/svn/trunk/samples/happy/happy.html).

For now, ignore the visible chunk boundaries in the x3dom approach; it seems to be a problem with vertex quantization. However, this is a minor criticism of their implementation, and not the overall technique, but there are still some inherent disadvantages with that approach.

### image geometry requires hardware-accelerated vertex texture fetch ###

This has two overlapping problems: support, and performance. OpenGL ES 2.0 and, by consequence, WebGL specify 0 as the minimum number of vertex texture samplers. So, there are no guarantees that you can use this. And even if you could, it won't necessarily be fast. Some implementations report vertex texture fetch support, but emulate it in software. And even those that do, vertex texture fetch is still much slower than simply submitting geometry.

### image geometry does not use index buffers ###

This disadvantage makes the x3dom technique decidedly different (and inferior) to the similar technique of [geometry images](http://research.microsoft.com/en-us/um/people/hoppe/proj/gim/) which use implicit connectivity. Without index buffers or some kind of connectivity information, the x3dom approach cannot exploit vertex transform caches, and will have to re-process each vertex multiple (~6) times. The vertex-optimized approach of webgl-loader will only process each vertex [~1.2 times](FifoCacheAnalysis.md), thanks to its vertex cache optimizer.

### image geometry creates unnecessarily large numbers of draw batches ###

WebGL performance is often [limited by the number of draw calls you can make](http://www.google.com/events/io/2011/sessions/webgl-techniques-and-performance.html). Because of the low precision (8-bits) of image files, the entire model cannot be served by one large image. Instead the model is chunked into various regions and each are encoded into a local image, each of which are rendered using a separate call. There are 185 batches in their demo.

To some extent, webgl-loader has this problem, too. It uses a fixed point representation, so has to deal with precision loss. More importantly, WebGL cannot draw indexed triangles with more than 65,536 vertices, so a million-triangle model has to be split, no matter what. However, compared to x3dom's 185 chunks, webgl-loader only needs 11, which is close to the minimum possible (if not the minimum). This is because webgl-loader can encode using more than 15-bits of precision per attribute, and doesn't need to split the model.

### more to come from webgl-loader ###

The webgl-loader approach, while already better than x3dom image geometry, will continue to improve. I will improve the algorithm to have better coherence and improve compression. I will eliminate redundant data and decoding work for texture coordinates. I will pipeline decoding to overlap computation and I/O using `XHR.onprogress`. I will add progressive rendering. I will add parallel decoding when `TypedArray`s and `WebWorker`s learn to play nicely with each other.