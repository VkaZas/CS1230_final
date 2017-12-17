#version 400

#define SPHERE       0
#define TERRAIN      1
#define NO_INTERSECT 2
#define SEALEVEL     3
#define CLOUD        4
#define HELIX        5
#define LIGHT        6

#define LOD_NORM     8
#define LOD_RAY      4

#define SEALEVEL_HEIGHT   4.0
#define CLOUD_HEIGHT_MIN 70.0
#define CLOUD_HEIGHT_MAX 74.0
#define LIGHT_RADIUS      5.0

#define AA 0

uniform vec3 iResolution;
uniform float iTime;

uniform float iRain;
uniform float iFog;
uniform float iSnow;
uniform float iAA;
uniform float iLight;
uniform float iSeaReflection;
uniform float iSeaRefraction;
uniform float iSeaStorm;
uniform float iSeaShadow;
uniform float iLadder;
uniform float iAO;
uniform float iDisplace;
uniform sampler2D iChannel3;
out vec4 fragColor;

// Data structure for raymarching results
struct PrimitiveDist {
    float dist;
    int primitive;
};

// Hash 2D to 1D
float hash21(vec2 p) {
    float h = dot(p,vec2(127.1,311.7));
    return fract(sin(h)*43758.5453123) * 2.0 - 1.0;  // Generate a [-1,1] result
}

// Hash 3D to 1D
float hash31(vec3 p) {
    float h = dot(p,vec3(127.1,311.7, 555.5));
    return fract(sin(h)*43758.5453123) * 2.0 - 1.0;
}

// 2D value noise
float valueNoise(vec2 p) {
    vec2 pi = floor(p);
    vec2 pf = fract(p);
    vec2 u = pf*pf*pf*(6.0*pf*pf - 15.0*pf + 10.0);

    float va = hash21(pi + vec2(0.0, 0.0));
    float vb = hash21(pi + vec2(1.0, 0.0));
    float vc = hash21(pi + vec2(0.0, 1.0));
    float vd = hash21(pi + vec2(1.0, 1.0));

    return mix(mix(va, vb, u.x), mix(vc, vd, u.x), u.y);
}


// 3D value noise
float valueNoise(vec3 p) {
    vec3 pi = floor(p);
    vec3 pf = fract(p);
    vec3 u = pf*pf*pf*(6.0*pf*pf - 15.0*pf + 10.0);

    float va = hash31(pi + vec3(0.0, 0.0, 0.0));
    float vb = hash31(pi + vec3(1.0, 0.0, 0.0));
    float vc = hash31(pi + vec3(0.0, 1.0, 0.0));
    float vd = hash31(pi + vec3(1.0, 1.0, 0.0));
    float ve = hash31(pi + vec3(0.0, 0.0, 1.0));
    float vf = hash31(pi + vec3(1.0, 0.0, 1.0));
    float vg = hash31(pi + vec3(0.0, 1.0, 1.0));
    float vh = hash31(pi + vec3(1.0, 1.0, 1.0));

    return mix(mix(mix(va, vb, u.x), mix(vc, vd, u.x), u.y),
               mix(mix(ve, vf, u.x), mix(vg, vh, u.x), u.y), u.z);
}

// 2D FBM
float fbmTerrain(vec2 p, int level) {
    float amp = 0.51;
    float freq = 0.03;  // Reduce frequency vastly to generate common-looking terrain (instead of moutain of spikes)
    float sum = 0.0;

    // Overlapping octaves with doubled frequency and half amplitude
    for (int i = 0; i < level; i++) {
        float vNoise = valueNoise(p * freq);
        sum += amp * vNoise;
        freq *= 2.01;
        // A minus sign produces richer variaty
        amp *= -0.49;
    }

    // Using pow() function to aggravate height changes
    sum = pow(sum, 2.0);
    return sum * 45.0;
}

// 3D FBMs, z dimension can be either time or z components of a position vector
float fbmLight(vec3 p)
{
    float amp = 0.51;
    float freq = 1.;
    float sum = 0;

    for (int i = 0; i < 5; i++) {
        // Make the holy light self rotate and elevate with time increases,
        // you could try change -1.*iTime to -100.*iTime and holy light turns to an angry laser beam
        vec3 q = p + vec3(sin(iTime), -1.*iTime, cos(iTime));
        float vNoise = valueNoise(q * freq);
        sum += amp * (1. + vNoise);
        freq *= 2.01;
        amp *= .5;
    }
    return clamp(sum, 0., 1.);
}

float fbmCloud(vec3 p, int level) {
    float amp = 0.51;
    float freq = 0.03;
    float sum = 0.0;

    for (int i = 0; i < level; i++) {
        float vNoise = valueNoise(p * freq);
        sum += amp * vNoise;
        freq *= 2.01;
        amp *= -0.49;
    }

    // Re-mapping from [-1,1] to [0,1], since cloud density should be a positive number
    sum = (sum + 1.) * .5;
    return sum;
}

float fbmSealevel(vec3 p, int level) {
    float amp = 0.51;
    float freq = 0.03;
    float sum = 0.0;

    // Amplify waves when storm option is checked
    p.z *= iSeaStorm + 1.;

    for (int i = 0; i < level; i++) {
        float vNoise = valueNoise(p * freq);
        sum += amp * vNoise;
        freq *= 2.01;
        amp *= -0.49;
    }

    // Amplify the result to make waves and turbulance obvious
    sum = sum * (20. + iSeaStorm * 50.) + .1;

    // sin(x)/x function generates waves like effects
    return sin(sum) / sum * 5.;
}

// Unsigned box for ladder steps
float udBox(vec3 p, vec3 b) {
  return length(max(abs(p)-b,0.0));
}

float mapTerrain(vec3 p, int level) {
    float dist = p.x*p.x + p.z*p.z;
    float delta = 0.;
    float h = fbmTerrain(p.xz, level);

    // A approximate derivative and continuous function to dig a lake at central area
    if (dist > 1600.) delta = - h * 1.0;
    else delta = - h + exp(-dist/500.-1.)*50.;

    return p.y -3. + delta;
}

float mapSealevel(vec3 p, int level) {
    // Make waves and turbulence on sea-level height
    return p.y - SEALEVEL_HEIGHT - fbmSealevel(vec3(p.xz * .1, iTime * .5) * 5., level);
}

// Rotation matrix
const float theta = 3.14 * 2. / 16.;
const mat2 rotate2D = mat2(cos(theta), sin(theta), -sin(theta), cos(theta));

float mapHelix(vec3 p) {
    // Ladder is infinitely far away if checkbox is unchecked
    if (iLadder < .5) return 10000.;
    // Use mod() to generate unlimited ladder
    p.y = mod(p.y, 23.5);
    vec3 offset = vec3(10., 3., 0.);
    float dh = 1.2;
    vec3 dimen = vec3(2.5, .1, 1.);
    float res = 100000.0;
    for (int i=0; i<16; i++) {
        res = min(res, udBox(p - offset, dimen)); p.xz = rotate2D * p.xz; p.y -= dh;
    }
    return res;
}

float mapLight(vec3 p) {
    // The bounding cylinder of holy light to reduce calculations of mapping
    float dist = length(p.xz) + (1. - iLight) * 10000.;
    int intersectLight = int(dist < LIGHT_RADIUS);
    return mix(dist - LIGHT_RADIUS,  0., float(intersectLight));
}

PrimitiveDist map(vec3 p) {
    float terrainDist = mapTerrain(p, LOD_RAY);
    float sealevelDist = mapSealevel(p, LOD_RAY - 1);
    // Displacement applied to helix ladders
    float helixDist = iDisplace < .5 ? mapHelix(p) : mapHelix(p) + valueNoise(p * 4.) * .03 * iDisplace;
    float lightDist = mapLight(p);

    float dist = terrainDist;
    float which = float(TERRAIN);

    // Replaced all if...else statements with mix(..step())
    which = mix(float(SEALEVEL), which, step(dist, sealevelDist));
    dist = mix(sealevelDist, dist, step(dist, sealevelDist));
    which = mix(float(HELIX), which, step(dist, helixDist));
    dist = mix(helixDist, dist, step(dist, helixDist));
    which = mix(float(LIGHT), which, step(dist, lightDist));
    dist = mix(lightDist, dist, step(dist, lightDist));

    return PrimitiveDist(dist, int(which));

}

// Another mapping function to only map things should be seen through holy light
PrimitiveDist mapPassLight(vec3 p) {
    float terrainDist = mapTerrain(p, LOD_RAY);
    float sealevelDist = mapSealevel(p, LOD_RAY - 1);
    float helixDist = mapHelix(p);

    float dist = terrainDist;
    float which = float(TERRAIN);

    which = mix(float(SEALEVEL), which, step(dist, sealevelDist));
    dist = mix(sealevelDist, dist, step(dist, sealevelDist));
    which = mix(float(HELIX), which, step(dist, helixDist));
    dist = mix(helixDist, dist, step(dist, helixDist));

    return PrimitiveDist(dist, int(which));
}

// Another map function to map things that should only be seen under sea
PrimitiveDist mapUnderSea(vec3 p) {
    float terrainDist = mapTerrain(p, LOD_RAY);
    float helixDist = mapHelix(p);

    float flag = step(helixDist, terrainDist);
    float resWhich = mix(float(TERRAIN), float(HELIX), flag);
    float resDist = mix(terrainDist, helixDist, flag);

    return PrimitiveDist(resDist, int(resWhich));
}

const float epsilon = 0.01;
vec2 e = vec2(epsilon, 0.0); // For swizzling
vec3 calcNormal(vec3 p, int which) {
    vec3 norm = vec3(0.);
    if (which == TERRAIN) {
        norm.x = mapTerrain(p + e.xyy, LOD_NORM) - mapTerrain(p - e.xyy, LOD_NORM);
        norm.y = mapTerrain(p + e.yxy, LOD_NORM) - mapTerrain(p - e.yxy, LOD_NORM);
        norm.z = mapTerrain(p + e.yyx, LOD_NORM) - mapTerrain(p - e.yyx, LOD_NORM);
    } else if (which == SEALEVEL){
        norm.x = mapSealevel(p + e.xyy, LOD_NORM) - mapSealevel(p - e.xyy, LOD_NORM);
        norm.y = mapSealevel(p + e.yxy, LOD_NORM) - mapSealevel(p - e.yxy, LOD_NORM);
        norm.z = mapSealevel(p + e.yyx, LOD_NORM) - mapSealevel(p - e.yyx, LOD_NORM);
    } else {
        norm.x = map(p + e.xyy).dist - map(p - e.xyy).dist;
        norm.y = map(p + e.yxy).dist - map(p - e.yxy).dist;
        norm.z = map(p + e.yyx).dist - map(p - e.yyx).dist;
    }
    return normalize(norm);
}

// Another raymarch function to calculate background color for the holy light
PrimitiveDist raymarchPassLight(vec3 ro, vec3 rd, float maxDist, float marchSpeed) {
    float marchDist = 0.001;
    float boundingDist = maxDist;
    float threshold = 0.1;

    for (int i = 0; i < 300; i++) {
        vec3 pos = ro + rd * marchDist;
        PrimitiveDist near = mapPassLight(pos);
        if (near.dist < threshold)
            return PrimitiveDist(marchDist, near.primitive);
        marchDist += near.dist * min((marchSpeed + marchDist * 2. / maxDist), .95);
        if (marchDist > boundingDist) break;
    }

    float isCloud = float((ro.y < CLOUD_HEIGHT_MIN && rd.y > 0.) || (ro.y > CLOUD_HEIGHT_MAX && rd.y < 0.));
    float which = mix(float(NO_INTERSECT), float(CLOUD), isCloud);
    return PrimitiveDist(-1.0, int(which));
}


PrimitiveDist raymarchUnderSea(vec3 ro, vec3 rd, float maxDist, float marchSpeed) {
    float marchDist = 0.001;
    float boundingDist = maxDist;
    float threshold = 0.1;

        PrimitiveDist near = PrimitiveDist(100., NO_INTERSECT);
    // 100 iteration is enough for undersea objects
    for (int i = 0; i < 100 && marchDist <= boundingDist && near.dist >= threshold; i++) {
        vec3 pos = ro + rd * marchDist;
        near = mapUnderSea(pos);
        marchDist += near.dist * marchSpeed;
        }

    float flag = float(near.dist < threshold);
    float resDist = mix(-1., marchDist, flag);
    float resWhich = mix(float(NO_INTERSECT), float(near.primitive), flag);
    return PrimitiveDist(resDist, int(resWhich));
}

// Main raymarching function
PrimitiveDist raymarch(vec3 ro, vec3 rd, float maxDist, float marchSpeed) {
    float marchDist = 0.001;
    float boundingDist = maxDist;
    float threshold = 0.1;

    for (int i = 0; i < 400; i++) {
        vec3 pos = ro + rd * marchDist;
        PrimitiveDist near = map(pos);
        if (near.dist < threshold)
            return PrimitiveDist(marchDist, near.primitive);
        // March speed increases along with march distance
        marchDist += near.dist * min((marchSpeed + marchDist * 2. / maxDist), .95);
        if (marchDist > boundingDist) break;
    }

    // We treat those NO_INTERSECTION rays with rd.y > 0 as rays to intersect with cloud layer
    // it also takes situations where camera is above cloud into consideration
    float isCloud = float((ro.y < CLOUD_HEIGHT_MIN && rd.y > 0.) || (ro.y > CLOUD_HEIGHT_MAX && rd.y < 0.));
    float which = mix(float(NO_INTERSECT), float(CLOUD), isCloud);
    return PrimitiveDist(-1.0, int(which));
}

vec3 generateTerrainColor(vec3 pos, vec3 norm, vec3 lig) {
    vec3 col = vec3(0.0);
    vec3 earth = vec3(.824, .706, .549);
    vec3 calcaire = vec3(.624, .412, .118);
    vec3 rocks = vec3(.412, .388, .422);
    vec3 beach = vec3( 1.0, .894, .710);
    vec3 snow1 = vec3 ( .78,.78,.78);
    vec3 snow2 = vec3 ( .9,.9,.9);

    float posNoise = valueNoise(pos.xz) + 0.5;

    // Ambient
    float ambient = 0.2;
    // Diffuse
    float diffuse = clamp(dot(norm, lig), 0.0, 1.0);

    // Base land color
    col = mix(beach, earth, smoothstep(0.0, 0.08, pos.y) );
    col = mix(col, calcaire, smoothstep(0.08, 0.3, pos.y) );
    col = mix(col, rocks, smoothstep(0.3, 10.0, pos.y) );

    // Add some noise to snow color to make it more realistic
    vec3 snowColor = mix(snow1, snow2, smoothstep(0.0, 10.0, posNoise * 10.0));
    // Snow only exist in places where slope is relatively smaller
    col = mix(col, snowColor , (1. - step(norm.y, .6)) * iSnow);

    // No specular part for terrain
    return ambient + diffuse * col;
}

vec3 generateHelixColor(vec3 ro, vec3 rd, vec3 norm, vec3 lig) {
    float ambient = 0.1;
    float diffuse = clamp(dot(norm, lig), 0.0, 1.0);
    // Shiness is 16
    float specular = pow(clamp(dot(rd, reflect(lig, norm)), 0.0, 1.0), 16.);

    vec3 col = vec3(1., 1., .93);
    return ambient + col * (diffuse + specular);
}

vec3 generateSeaColor(vec3 ro, vec3 rd, vec3 norm, vec3 lig) {
    float ndotr = dot(norm, rd);
    // Reflectance R0 introduced in Lab 10
    float r0 = .6;
    // A hack to approximate rain-drop effect by 'randomly' increasing reflectance
    r0 = min(r0 + .3 * max(valueNoise(vec3(ro.xz * 5., iTime * 10.)) - .2, 0.) * iRain, 1.0);

    // Schlick's approximation
    float fresnel = r0 + (1. - r0) * pow(1.0 - abs(ndotr), 5.);
    // Original water color
    vec3 col = vec3(.292, .434, .729), reflCol, refrCol, refrPos = vec3(0., 1., 0.);
    // Original shadow darkness
    float darkness = 1.;
    PrimitiveDist res;

    // Reflection
    if (iSeaReflection > .5) {
        // Slightly stablize the reflected inverted image by increasing y component of the norm
        vec3 reflD = reflect(rd, normalize(norm + vec3(.0, .3, .0)));
        res = raymarch(ro, reflD, 100., .5);
        vec3 reflPos = ro + res.dist * reflD;
        if (res.primitive == TERRAIN) {
            reflCol = generateTerrainColor(reflPos, calcNormal(reflPos, TERRAIN), lig);
        } else if (res.primitive == HELIX) {
            reflCol = generateHelixColor(reflPos, reflD, calcNormal(reflPos, HELIX), lig);
        }
    }

    // Refraction
    if (iSeaRefraction > .5) { 
        // Stablize refraction images by setting norm to (0,1,0)
        vec3 refrD = refract(rd, vec3(0., 1., 0.), .8);
        res = raymarchUnderSea(ro, refrD, 30., .8);
        refrPos = ro + res.dist * refrD;
        if (res.primitive == TERRAIN) {
            refrCol = generateTerrainColor(refrPos, calcNormal(refrPos, TERRAIN), lig);
        } else if (res.primitive == HELIX) {
            refrCol = generateHelixColor(refrPos, refrD, calcNormal(refrPos, HELIX), lig);
        }
    }

    col = mix(col, (fresnel + (1 - fresnel) * (1. - iSeaRefraction)) * reflCol + (1. - fresnel) * refrCol, .8);

    // Shadow
    if (iSeaShadow > .5) {
        res = raymarch(ro + vec3(0, .15, 0.), lig, 60., .5);
        vec3 shadPos = ro + res.dist * lig;

        // Only accept shadows casted by terrain and helix ladder, since holy light ought not to have shadow
        // and cloud shadow is too heavy to calculate
        int or = int(res.primitive == HELIX || res.primitive == TERRAIN);
        // Applying attenuate function to approximate soft shadow
        darkness -= float(or)*( 1. / (1. + res.dist * .1 +  res.dist * res.dist * .005));
    }

    // Approximate the effect that deeper the water, blue-er the color
    vec3 ambient  = clamp(vec3(0.,0.41,.58)*abs(refrPos.y)*.1, 0., 1.);
    float diffuse  = clamp(dot(norm, lig), 0.0, 1.0);
    float specular = pow(clamp(dot(rd, reflect(lig, norm)), 0.0, 1.0), 32.);

    return (ambient + col * (diffuse + specular)) * darkness;
}

vec3 generateCloudColor(vec3 ro, vec3 rd) {
    // Skyblue as background color for cloud
    vec3 bgc = vec3(0.3, .55, .8);
    // Taking alpha channel into consideration
    vec4 sum = vec4(0.);
    float dist;
    // Under cloud or above cloud
    float less = float(ro.y < CLOUD_HEIGHT_MIN);
    float more = float(ro.y > CLOUD_HEIGHT_MAX);
    vec3 cp_ro = ro;

    // Caculate intersection
    dist = mix(dist, (CLOUD_HEIGHT_MIN - cp_ro.y) / rd.y + .01, less);
    ro += less * dist * rd;

    dist = mix(dist, -(cp_ro.y - CLOUD_HEIGHT_MAX) / rd.y + .01, more);
    ro += more * dist * rd;

    // Two kinds of cloud colors
    vec3 cloud1 = vec3(1.0,0.95,0.8);
    vec3 cloud2 = vec3(0.25,0.3,0.35);

    // Slightly increase rd.y to avoid over densed cloud at far skyline
    rd.y = sqrt(abs(rd.y)) * sign(rd.y);

    // Make sure the sampling only happens between cloud layer and a maximum 1.0 alpha channel
    while ((sum.a < 1.0) && (ro.y + .1 > CLOUD_HEIGHT_MIN) && (ro.y - .1 < CLOUD_HEIGHT_MAX)) {
        // Sampling density, and mitigate density on the far skyline(where rd.y is very small)
        float density = fbmCloud(ro * rd.y, LOD_NORM) * .1;
        vec3 col = mix(cloud1, cloud2, density);
        // Blend the color in the final result
        sum.a += density;
        sum.rgb += col * density * density * 15.;
        ro = ro + rd * .6;
    }

    // Mix cloud color with sky color
    bgc = mix(bgc, sum.rgb, sum.a);
    return bgc;
}

// Calculate ambient occlusion for only terrain, since other objects have no obvious changes under AO
vec3 calcAO(vec3 pos, vec3 norm) {
    vec3 extPos = pos;
    vec3 ao = vec3(0.);
    float distIntv = .01;
    // Sample along normal
    for (int i = 1; i < 10; i++) {
        extPos = pos + norm * distIntv * i;
        float res = mapTerrain(extPos, LOD_RAY);
        if (abs(res - i * distIntv) > .1) {
            // Found a closer surface and occlude ambient light
            ao += .15 - .15 / 50. * i;
            break;
        }
    }
    return ao;
}

// Reference from one of iq's cloud shader
float buff = 2.5;
vec3 generateLightColor(vec3 ro, vec3 rd, float t, vec3 lig, vec3 ligColor) {
    vec4 sum = vec4(0.0);
    vec3 pos = vec3(0.0);
    float dist = 0.0;

    // Increment light color and density when iterating through the loop
    for(int i=0; dist <= LIGHT_RADIUS*LIGHT_RADIUS + buff && sum.a <= .99 && i < 300; i++) {
        pos = ro + t*rd;
        dist = pos.x*pos.x + pos.z*pos.z;
        // Calculate color density at current location using the noise function
        float density = mix(0., fbmLight( pos )* exp(-dist*.33)*(dist*1.2 + 2.), step(dist, 25.));
        float flag = float(density > 0.01);
        // Add color of the light source to the beam, the color should be weighted the most when the beam is facing the light source and gradually decreases afterward.
        float sunCol =  clamp((density - fbmLight(pos+0.3*lig))/0.6, 0.0, 1.0 );


        vec3 ligCol = vec3(0.99,0.99,0.4)*1.4; - vec3(.9, .9, .9)* sunCol;
        vec4 col = vec4( mix( vec3(1.,1.,0.), vec3(1.0,1.0,0.8), density ), density );
        col.xyz *= ligCol;
        col.xyz = mix( col.xyz, ligColor, 1.0-exp(-0.003*t*t) );

        col.a *= 0.6;
        col.rgb *= col.a;
        sum += flag * col*(1.-sum.a);
        // Increment the raymarching step
        t += max(0.05,0.15*t);
    }

    // Calculate the background scene color
    PrimitiveDist passObject = raymarchPassLight(ro, rd, 1050., .25);
    pos = ro + passObject.dist*rd;
    vec4 lightColor = clamp(sum, 0., 1.);
    int which = passObject.primitive;

    // Normal vector
    vec3 nor = calcNormal(pos, which);

    // BackgroundColor Placeholder
    vec3 col = vec3(0.68,0.68,0.6);
    if (which == TERRAIN) {
        col = generateTerrainColor(pos, nor, lig) - calcAO(pos, nor) * iAO;
    } else if (which == HELIX) {
        col = generateHelixColor(pos, rd, nor, lig);
    } else if (which == SEALEVEL){
        col = generateSeaColor(pos - rd * .05, rd, nor, lig);
    } else if (which == CLOUD) {
        col = generateCloudColor(ro, rd);
    }

    // Add the distant fog to the cylinder that bounds the light beam
    float fo = .5 - .5 / (1. + passObject.dist * .02 +  passObject.dist * passObject.dist * .0001);
    vec3 fco = vec3(0.68,0.68,0.6);
    col = mix(col, fco, fo * iFog);

    // Mix the background color with the beam color
    return col*(1. - lightColor.w) + lightColor.xyz * lightColor.w;
}



vec3 render(vec3 ro, vec3 rd, float t, int which) {
    // Col is the final color of the current pixel.
    vec3 col = vec3(0.68,0.68,0.6);
    vec3 pos = ro + rd * t;
    // Light vector
    vec3 lig = normalize(vec3(0.5,0.5,0.5));
    vec3 lightCol = vec3(1., 1., 1.);

    // Normal vector
    vec3 nor = calcNormal(pos, which);

    vec3 material = vec3(0.0);
    if (which == TERRAIN) {
        // Calc Ambient Occlusion
        col = generateTerrainColor(pos, nor, lig) - calcAO(pos, nor) * iAO;
    } else if (which == HELIX) {
        col = generateHelixColor(pos, rd, nor, lig);
    } else if (which == SEALEVEL){
        col = generateSeaColor(pos - rd * .05, rd, nor, lig);
    } else if (which == CLOUD) {
        col = generateCloudColor(ro, rd);
    } else if (which == LIGHT) {
        col = generateLightColor(ro, rd, t, lig, lightCol);
    }

    return col;
}

vec3 postProcess(vec3 col, vec2 uv) {
    // Rain, streching and animating the noise
    vec2 rainUV = (uv * vec2(5., .3) + vec2(.8 * iTime - (uv.x + uv.y) * 1., .8 * iTime)) * 30. ;
    float rain = max(valueNoise(rainUV), 0.) * .5;
    // Blend rain color with original color
    col = mix(col, vec3(rain), .1 * iRain);
    return col;
}

void main() {
    // Set camera along a preset route
    float height = mix((iTime-30.) * 2. + 10., 10. , step(iTime, 30.));
    float radius = mix(40. - 20.*exp(-iTime+30.), 20., step(iTime, 30.));
    vec3 rayOrigin = vec3(20.0 * sin(iTime * .3), height, 20.0 * cos(iTime * .3));

    float focalLength = 2.0;

    // The target we are looking at
    vec3 target = vec3(0.0, height*.7, 0.0);
    // Look vector
    vec3 look = normalize(rayOrigin - target);
    // Up vector
    vec3 up = vec3(0.0, 1.0, 0.0);

    // Set up camera matrix
    vec3 cameraForward = -look;
    vec3 cameraRight = normalize(cross(cameraForward, up));
    vec3 cameraUp = normalize(cross(cameraRight, cameraForward));

    // Construct the ray direction vector
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    uv = uv * 2.0 - 1.0;
    uv.x = uv.x * iResolution.x / iResolution.y;

    // Background color when NO_INTERSECT
    vec3 col = vec3(0.68,0.68,0.6);

    // AA
    if (iAA > .5) {
        // Pixel size
        vec2 uvSize = 2. / iResolution.yx;

        // Four sub-pixel
        for (int dx = -1; dx <= 1; dx += 2) {
            for (int dy = -1; dy <= 1; dy += 2) {
                vec2 puv = uv + vec2(float(dx) * uvSize.x * .25, float(dy) * uvSize.y * .25);
                vec3 rayDirection = vec3(puv, focalLength);
                rayDirection = normalize(puv.x * cameraRight + puv.y * cameraUp + focalLength * cameraForward);

                PrimitiveDist rayMarchResult = raymarch(rayOrigin, rayDirection, 1050., .25);
                int intersect = int(rayMarchResult.primitive != NO_INTERSECT);
                vec3 tcol = mix(vec3(0.68,0.68,0.6), render(rayOrigin, rayDirection, rayMarchResult.dist, rayMarchResult.primitive), float(intersect));

                // Postprocess
                //fog
                int isLight = int(rayMarchResult.primitive == LIGHT);
                float fo = .5 - .5 / (1. + rayMarchResult.dist * .02 +  rayMarchResult.dist * rayMarchResult.dist * .0001);
                vec3 fco = vec3(0.68,0.68,0.6);
                tcol = mix(mix(tcol, fco, fo * iFog), tcol, float(isLight));
                tcol = postProcess(tcol, uv);
                col += tcol;
            }
        }
        col *= .25 * .825;

    } else if (AA == 0) {
        vec3 rayDirection = vec3(uv, focalLength);
        rayDirection = normalize(uv.x * cameraRight + uv.y * cameraUp + focalLength * cameraForward);

        PrimitiveDist rayMarchResult = raymarch(rayOrigin, rayDirection, 1050., .2);
        int intersect = int(rayMarchResult.primitive != NO_INTERSECT);
        col = mix(vec3(0.68,0.68,0.6), render(rayOrigin, rayDirection, rayMarchResult.dist, rayMarchResult.primitive), float(intersect));

        // Postprocess
        col = postProcess(col, uv);

        //fog
        int isLight = int(rayMarchResult.primitive == LIGHT);
        float fo = .5 - .5 / (1. + rayMarchResult.dist * .02 +  rayMarchResult.dist * rayMarchResult.dist * .0001);
        vec3 fco = vec3(0.68,0.68,0.6);
        col = mix(mix(col, fco, fo * iFog), col, float(isLight));

    }

    fragColor = vec4(col, 1.0);

}
