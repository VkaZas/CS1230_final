Our project is mainly based on the raymarching technique that introduced in Lab 11. This project is mainly a demo scene that includes a combination of outdoor scenery and some unnatural artifacts -- mountains, lakes, clouds and a sky-ladder surrounding a 'holy beam'. We developed and tested our shader on shadertoy.com and migrated it to Qt environment, so the entire project is consist of two parts :
1. An OpenGL environment that provides users with interfaces to interact with the shader.
2. The fragment shader, which is used as a pixel shader in which the raymarching algorithm was implemented and distance-field models were constructed. This part is the majority of our work.
-----------------------------------------------------------------------------------------------
Part 1. Qt OpenGL Environment
We modified 'mainwindow.ui' to add some checkboxes in it for users to control the fragment shader. The following features are controllable:
(a) Sea reflection -- enable reflection effect of water
(b) Sea refraction -- enable refraction effect of water
(c) Sea shadow -- enable projected shadows effect of water
(d) Sea storm -- enable 'storm' mod of water
(e) Rain -- enable raining effect
(f) Fog -- enable fog effect
(g) Snow -- enable snow effect on mountains
(h) Anti-aliasing -- enable 2X AA
(i) Ladder -- enable displaying sky ladder
(k) Light -- enable 'holy light'
(m) Ambient Occlusion -- enable AO
(l) Displacement -- enable displacement mapping on ladder steps

These checkboxes are bound with callback functions in 'mainwindow.cpp', which calls corresponding functions in 'view.cpp' to pass these boolean arguments as float uniforms to the fragment shader.
In 'view.cpp', we use VAO and VBO to render a squad consisting two triangles to the vertex shader, and the vertex shader passes interpolated coordinates to the fragment shader.
----------------------------------------------------------------------------------------------
Part 2. Raymarching and Distance field modeling
We implemented all the functionalities in 'helix.frag' based on the framework used in Lab 11. Instead of a plane and a sphere with misplacement, we implemented more complicated objects. And almost all these objects are made from 'noises':

2.1 Noises
Back in Lab 11, there was a simple sample to use noise to generate some interesting effects on the sphere. But if we want to generate something like mountains with in-disciplinary peaks and valleys, or to simulate the neverending turbulence and waves on the sea, we need some more natural noises rather than some totally random white noises. During our search, we found some tutorial from Inigo Quilez(http://iquilezles.org/www/index.htm) are very inspiring and useful. And after some experiment and prototyping,  we decided to use simple value noise and its FBM(Fractal Brownian Motion) to create our virtual world.

Value noise is similar to Perlin noise to calculate an interpolated value from four nearby vertices on a lattice grid but without gradient calculations, thus value noise is easier to implement and cheaper but produces relatively less satisfying results.  To prevent this, we implemented FBM of the value noise -- overlapping several octaves to produce a prettier result with richer variety. We made four FBM functions for terrain, cloud, beam light and water corresponding, each with some small modifications to generated our desired feature.

As for random functions, we used hash functions that perform some nonsense calculation to generate the random number. An alternative (and potentially better) way is to fetch texel value from a random noise texture image.

2.2 Terrain
Instead of calculating a constant for a perfect plane, we derive our height value from 2D FBM noise function. After endlessly tuning, we finally obtained a normal-looking terrain with peaks and valleys. In addition to this, we also want to decrease terrain height in the central area in order to form a lake, so we tried lots of distance-dependent functions. During which, we found that some of these functions may cause some part of terrain shimmering weirdly, for the reason that the specific function was not derivative and continuous and thus normals cannot be calculated correctly. Finally, we found a piece-wise but nearly derivative and continuous function which left and right limit around the cut-off point is the same.

After generating terrain, we mixed some colors and assigned them according to latitude to simulate rock and mud. Also, we added snow colors to those positions with low steepness.

2.3 Water
Calculating height map for water is similar to that of terrain, it's actually an animated terrain that takes (x,z) position together with time as input with some wave-like turbulence made by sinc() function. 

To simulate water-like material, we applied Schlick's approximation to calculate Fresnel equation. And starting from the intersection point on the water, we raymarch again towards both reflection direction and refraction direction to fetch target color and mix them according to Fresnel equation. Similarly, we raymarch again towards sunlight direction to calculate shadows. By applying the attenuate function to shadow darkness calculation, we obtained approximated soft shadow effect.

2.4 Cloud
To simplify the situation, we restricted cloud region into [CLOUD_HEIGHT_MIN, CLOUD_HEIGHT_MAX] region, so there's no need to calculate height map for clouds, instead, we treat those NO_INTERSECT rays with rd.y > 0 as rays that will intersect with clouds and we can easily calculate the intersection position. 

To approximate the various appearance of various cloud density. We use 3D fbm as a 3D density map and perform another raymarching from the intersection through the cloud layer. At each step, we sample the color of the current ray position and blend it to the final color. By using this approach, we obtained a rather good result.

2.5 Holy Light
The light effect that we simulated is generated by a two-step raymarching. Since raymarching is costly, our goal is to minimize the light cost while keeping the light transparent. To minimize the computation, we use a cylinder with fixed radius to bound the light beam such that raymarching is done within a certain range. The first pass of the raymarching is to calculate the color of our light beam, we use 3D noise to mimic the dynamic movement of our light beam. In the second raymarching, we deliberately skipped the light cylinder such that the ray is still intersected with the scene without the beam. We could then obtain the color of the beam and the original color of the background scene. Therefore, we could just mix the light color with the background color to render the transparent light beam.

2.6 Rain
Raining effect is purely a screen space post process. To obtain a long but narrow rain-like noise, we simply increase the frequency horizontally and decrease the frequency vertically. To make the rain strip slanted and drop, just correlate the noise's UV with iTime. And the last step is just to blend the generated rain color with screen pixel color.

Also, we add some hack to the water to approximate rain-drop effect by changing reflectance according to a noise map.

2.7 Anti-aliasing
Implementing AA is relatively simple.  Instead of calculating one ray from the center of each pixel,  we calculate four rays of four quartile points and blend them averagely.

2.8 Ambient Occlusion
We approximated AO by sampling along the normal for several times and comparing the extended distance with the return value from map() function. In this way, if there is another surface is closer to that extended point, the ambient component of the original point should be occluded.

2.9 Displacement Mapping
Simply add displacement noise to ladder steps to prevent it from being too slippery.
-----------------------------------------------------------------------------------------------
Part 3. Optimization

Once we finished the basic features, we began to test if our virtual world could satisfy the lowest FPS requirement in the department machine. Unfortunately, it rendered in 15FPS without enabling anti-aliasing... Speeding up our model became the first priority. After doing research for a while, we found that we might apply too many conditional statements in the shader. The GPU runs linearly so that it could do the computation in parallel, but this feature also makes conditional statement cost dramatically increases. To solve this issue, we rewrite all simple if-clauses with mix and step functions. For the if statements which include a lot of costly inner functions, we chose not to rewrite them as the program need to execute all inner functions if using the "mix and step" trick. After testing all if statements one by one, we found an optimal architecture that could speed up our program to 45FPS without applying anti-aliasing.


As an extension of this readme, please also refer to code comments in 'helix.frag'.