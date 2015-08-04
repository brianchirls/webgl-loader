The biggest constraint for WebGL mesh compression is that there just isn't much you can do in Javascript; even though it has gotten much faster as of late (and you can expect it to get faster, still), it just doesn't compare to native code, and the fancy things "real" compression algorithms do; any form of bit-bashing is likely out of the question.

So, it is important to see what is already available in the browser. The obvious is HTTP's GZIP content encoding; you should certainly enable that in your server. The less obvious choice is the UTF-8 character set. It turns out that UTF-8 serves as a passable variable-length encoding scheme.

UTF-8 is quite cleverly designed; it is backwards compatible with ASCII while enabling the encoding of 2<sup>31</sup> different characters. An interesting feature about UTF-8 is that 16-bit values are encoded using between 1 and 3 bytes. Here's a summary table (more details on [http://en.wikipedia.org/wiki/UTF-8#Design the Wikipedia entry):

| First |   Last | # Bytes |
|:------|:-------|:--------|
|     0 |    127 | 1 byte  |
|   128 |  2,047 | 2 bytes |
| 2,048 | 65,536 | 3 bytes |

The single-byte encoding is what makes it backwards compatible with ASCII. Small value are literally encoded as one byte. Larger values use a kind of prefix coding. There is some redundancy designed into the encoding, but that shouldn't be a big problem; any reasonable variable-length encoding for 16-bit value will use between 1 and 3 bytes for each character.

Caveat: surrogate pairs.