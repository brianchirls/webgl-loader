Currently, there are lots of changes while a final format settles out. In particular, [r51](https://code.google.com/p/webgl-loader/source/detail?r=51) **breaks compatibility** with previously meshes, so for now **I recommend [r50](https://code.google.com/p/webgl-loader/source/detail?r=50) as the last stable revision**.

Live demos:
  * [A Hand](http://webgl-loader.googlecode.com/svn/trunk/samples/hand.html) (small)
  * ["Ben"](http://webgl-loader.googlecode.com/svn/trunk/samples/ben.html) (medium, also see [compression stats](BenCompressionStats.md))
  * [Walt](http://webgl-loader.googlecode.com/svn/trunk/samples/walt.html) (large, does fast client-side normal reconstruction]
  * [Happy Buddha](http://webgl-loader.googlecode.com/svn/trunk/samples/happy/happy.html) (1 million triangles, [commentary](HappyBuddha.md))


This library includes:
  * a simple Wavefront .OBJ file parser,
  * a simple [vertex cache optimizer](http://home.comcast.net/~tom_forsyth/papers/fast_vert_cache_opt.html) and [analyzer](FifoCacheAnalysis.md),
  * a [UTF-8](UtfEight.md) based binary encoder,
  * no external dependencies except for C/C++ standard libraries.


[The SIGGRAPH 2011 talk slides](https://docs.google.com/present/view?id=d4wf4t2_251g4kjtwgs).

Models from [The Utah 3D Animation Repository](http://www.sci.utah.edu/~wald/animrep/) and [The Stanford 3D Scanning Repository](http://graphics.stanford.edu/data/3Dscanrep/).

