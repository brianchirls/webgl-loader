# Introduction #

Normals and positions are very closely related attributes. The idea for normal prediction is to exploit their relationship to improve compression. It is a relatively simple technique that I knew about very early on ([Issue #2](https://code.google.com/p/webgl-loader/issues/detail?id=#2)), but I only just got around to implementing it.

Normals are a kind of derivative of position, which means that given a neighborhood of positions, it would be possible to make a good guess about what the normal will be. Fortunately, the index buffer provides this neighborhood information.

TODO: justify this specialized technique, quantitatively. Describe (non-)interaction with ParallelogramPrediction.

# Algorithm Description #

Here, I'll only describe the encoding in pseudocode. Decoding is straightforward and essentially amounts to doing everything in reverse.

  1. Input ATTRIBS and INDICES
  1. Allocate an array, CROSSES, that can store a normal vector for each vertex
  1. Pass I: For each TRIANGLE in INDICES:
    1. Compute the TRIANGLE's cross product
    1. For each INDEX in TRIANGLE:
      1. Add the cross product to CROSSES(INDEX)
  1. Pass II: For each INDEX in ATTRIBS:
    1. Normalize CROSS(INDEX)
    1. Normalize the normal component of ATTRIBS(INDEX)
    1. Encode their difference

# Analysis #

There are two passes to the algorithm. The first runs through the triangles (Pass I), the second runs through the vertices (Pass II).

Pass I computes each triangle's cross product and accumulates it in each of the vertices. What's happening here is that each vertex will eventually get the sum of cross products of all its incident triangles. Note that because the cross product is unnormalized, the vertex will end up with an area-weighted estimate of the normal direction.

Instead of area-weighting, we could try uniform-weighting by normalizing the cross-product, but this just seems worse since you end up doing extra work to throw away some potentially useful information. We could try angle-weighting is somewhat interesting, but requires an expensive Math.asin (the predictor runs in both the compressor and decompressor) and probably isn't much better than area-weighting. Are-weighting seems like a sweet spot, but I have to do some experiments to back things up.

Pass II compares the actual normals in ATTRIBS with our predicted normals in CROSSES. If we predicted well, then the difference between the two will be small. The magnitudes in CROSSES will be pretty arbitrary, and therefore not very useful, so we finally normalize at this point. This is OK as long as you're not planning on using the normal magnitude for anything, but we can deal with this in the future by explicitly encoding normal magnitude.

Note that we don't actually need to properly normalize here; we just need the compressor and decompressor to agree on what "normalizing" means, so we can use some very aggressive approximations (e.g. divide by the longest axis, like cube map indexing), which could make decoding much faster. Depending on how coarse the approximation is, you may have to do a per-vertex normalization in the vertex shader, but that is very cheap and unlikely to be felt.

# Extensions #

TODO: does this allow more aggressive quantization because there will be less faceting?

TODO: support non-unit normals.

TODO: per-vertex tangent frames used for normal maps.