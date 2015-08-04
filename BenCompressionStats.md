|              | Raw Bytes | GZIP Bytes | GZIP % |
|:-------------|:----------|:-----------|:-------|
| .OBJ         | 6,387,698 | 1,864,867  | 29.19% |
| .JS (32-bit) | 5,275,346 | 1,543,449  | 29.26% |
| .JS (16-bit) | 3,074,531 | 963,831    | 31.35% |
| UTF-8        | 712,208   | 483,865    | 67.93% |
| UTF-8x       | 554,006   | 332,727    | 60.06% |

**.OBJ** is the original file, found at [The Utah 3D Animation Repository](http://www.sci.utah.edu/~wald/animrep/).

**.JS (32-bit)** is encoded using floats, just like the .OBJ. The big difference in size comes from .OBJs index format. Like most modelling formats, .OBJ uses an index per attribute, rather than per vertex. For example, vertices along a crease can share position indices but have distinct normal or texcoords. During conversion, these vertices end up getting duplicated, but the triangle indices take way less space.

**.JS (16-bit)** uses quantized attributes at the same precision as Google Body. 14-bits per dimension position, and 10-bits per dimension for normals and texcoords. This is probably excess resolution. Body needed 14-bits for position because it had lots of fine features (e.g. blood vessels, nerves), but 10-bits for normals/texcoords were probably too much. At the time, I was particularly concerned about texture warp due to texcoord quantization.

An important note: positions are encoded using uniform quantization. That is, the scale chosen is that of the largest dimension of the bounding box. Effectively, this means fewer bits are allocated to the shorter dimensions.

**UTF-8** uses the compression in this project. Note that it is more effective than GZIP-ing the 16-bit JSON file. This is bit of an unfair comparison, though, since UTF-8 is the only binary-like format. Of course, GZIP still helps a bit!

**UTF-8x** is the current, experimental version of the compressor: obj2utf8x. As you can see, as good as the original compressor is, this new one is better in every metric. Not only does it emit fewer bytes, but it is friendlier to GZIP as well. As a result, the output is 69% the size for the same exact output!


---


## Histogram of byte frequencies in ben.utf8, original ##

_Scroll down for exciting new experimental results._

Note that you can that the distribution of values has three exponential-looking regions. The largest one starts at 0, which represents the one-byte range. Next is the one that starts at 194, which represents the first byte in the two byte range. It is surprisingly large! Interestingly, it is impossible to generate a value of 192 or 193, since those values should have been encoded as one-byte values. Finally, there is a faint exponential starting at 128, which represents subsequent bytes for two or three-byte values. The start of the three byte range, 224, doesn't register at all.


```
  0: ---------------------------------------------------------------------o
  1: ---------------------------------------------------------o
  2: ---------------------------------------------o
  3: ------------------------------------o
  4: -------------------------------o
  5: --------------------o
  6: -----------------o
  7: -----------o
  8: --------o
  9: -------o
 10: ------o
 11: ------o
 12: -----o
 13: ----o
 14: ----o
 15: ---o
 16: ---o
 17: ---o
 18: ---o
 19: ---o
 20: ---o
 21: --o
 22: --o
 23: --o
 24: --o
 25: -o
 26: -o
 27: -o
 28: -o
 29: -o
 30: -o
 31: -o
 32: -o
 33: -o
 34: o
 35: o
 36: o
 37: o
 38: o
 39: o
 40: o
 41: o
 42: o
 43: o
 44: o
 45: o
 46: o
 47: o
 48: o
 49: o
 50: o
 51: o
 52: 
 53: 
 54: 
 55: 
 56: 
 57: 
 58: 
 59: 
 60: 
 61: 
 62: 
 63: 
 64: 
 65: 
 66: 
 67: 
 68: 
 69: 
 70: 
 71: 
 72: 
 73: 
 74: 
 75: 
 76: 
 77: 
 78: 
 79: 
 80: 
 81: 
 82: 
 83: 
 84: 
 85: 
 86: 
 87: 
 88: 
 89: 
 90: 
 91: 
 92: 
 93: 
 94: 
 95: 
 96: 
 97: 
 98: 
 99: 
100: 
101: 
102: 
103: 
104: 
105: 
106: 
107: 
108: 
109: 
110: 
111: 
112: 
113: 
114: 
115: 
116: 
117: 
118: 
119: 
120: 
121: 
122: 
123: 
124: 
125: 
126: 
127: 
128: --o
129: -o
130: --o
131: o
132: o
133: o
134: o
135: o
136: o
137: o
138: o
139: o
140: o
141: o
142: o
143: o
144: o
145: o
146: o
147: o
148: o
149: o
150: o
151: o
152: o
153: o
154: o
155: o
156: o
157: o
158: o
159: o
160: o
161: o
162: o
163: o
164: o
165: o
166: o
167: o
168: o
169: o
170: o
171: 
172: 
173: 
174: o
175: o
176: o
177: 
178: 
179: 
180: 
181: 
182: o
183: 
184: 
185: 
186: 
187: 
188: 
189: 
190: 
191: 
192: 
193: 
194: -----------------------------------------o
195: ----------------------o
196: -------------o
197: --------o
198: ------o
199: ----o
200: ---o
201: --o
202: -o
203: o
204: o
205:
...
255: 
```

## Histogram of byte frequencies in ben.utf8, experimental ##

Below is a visual explanation of why the experimental compressor is doing so well. Note that the distribution of bytes is far more skew. The initial exponential distribution, while a bit more ragged, drops off much sooner. This is especially true for the multi-byte range at 194+. A larger percentage of one-byte UTF-8 codepoints means that the raw .utf8 file is smaller, and implies that it is has more biased distribution so that GZIP can do a better job during Huffman coding.

```
  0: ---------------------------------------------------------------------o
  1: ----------------o
  2: ------------------------o
  3: ---------------------o
  4: -------------------o
  5: -----o
  6: --------o
  7: ------o
  8: ---o
  9: -----o
 10: ------o
 11: -o
 12: ---o
 13: --o
 14: o
 15: -o
 16: -o
 17: o
 18: o
 19: o
 20: o
 21: o
 22: o
 23: 
 24: 
 25: 
 26: 
 27: 
 28: 
 29: 
 30: 
 31: 
 32: 
 33: 
 34: 
 35: 
 36: 
 37: 
 38: 
 39: 
 40: 
 41: 
 42: 
 43: 
 44: 
 45: 
 46: 
 47: 
 48: 
 49: 
 50: 
 51: 
 52: 
 53: 
 54: 
 55: 
 56: 
 57: 
 58: 
 59: 
 60: 
 61: 
 62: 
 63: 
 64: 
 65: 
 66: 
 67: 
 68: 
 69: 
 70: 
 71: 
 72: 
 73: 
 74: 
 75: 
 76: 
 77: 
 78: 
 79: 
 80: 
 81: 
 82: 
 83: 
 84: 
 85: 
 86: 
 87: 
 88: 
 89: 
 90: 
 91: 
 92: 
 93: 
 94: 
 95: 
 96: 
 97: 
 98: 
 99: 
100: 
101: 
102: 
103: 
104: 
105: 
106: 
107: 
108: 
109: 
110: 
111: 
112: 
113: 
114: 
115: 
116: 
117: 
118: 
119: 
120: 
121: 
122: 
123: 
124: 
125: 
126: 
127: 
128: 
129: 
130: 
131: 
132: 
133: 
134: 
135: 
136: 
137: 
138: 
139: 
140: 
141: 
142: 
143: 
144: 
145: 
146: 
147: 
148: 
149: 
150: 
151: 
152: 
153: 
154: 
155: 
156: 
157: 
158: 
159: 
160: 
161: 
162: 
163: 
164: 
165: 
166: 
167: 
168: 
169: 
170: 
171: 
172: 
173: 
174: 
175: 
176: 
177: 
178: 
179: 
180: 
181: 
182: 
183: 
184: 
185: 
186: 
187: 
188: 
189: 
190: 
191: 
192: 
193: 
194: ------o
195: --o
196: o
197: 
...
255: 
```