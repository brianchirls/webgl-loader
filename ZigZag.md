Delta compression makes perfect sense when variable-length encoding unsigned values: use fewer bytes for smaller values. However, delta coding usually creates signed values. This interacts poorly with two's complement arithmetic; simply interpreting the bits of a small negative number as an unsigned number yields a very large positive number. For example, -1 as a 16-bit unsigned integer maps to 65,535. Naively, then, small negative numbers require more than expected bytes to encode.

We'd rather map small negative numbers to small positive numbers. Fortunately, this has been solved before. The Google Protocol Buffer project includes [a description of ZigZag encoding](http://code.google.com/apis/protocolbuffers/docs/encoding.html#types). The exact C code used to ZigZag encode in this library is:

```
uint16 ZigZag(int16 word) {
  return (word >> 15) ^ (word << 1);
}
```

The trickiest thing about this code is that the right shift has to be a signed right shift, so it is important to get the signedness of the parameter and return type correct. Technically, the C library provides no guarantees; it defines >> in terms of division by 2 for positive values and implementation defined for negative values! Of course, almost every microarchitecture anyone cares about nowadays uses two's complement, and almost every C compiler will do the right thing, and sign-extend negative values.

Note: not to be confused with [JPEG's !ZigZag encoding](http://en.wikipedia.org/wiki/JPEG#Entropy_coding), which describes the order in which DCT coefficients are serialized.