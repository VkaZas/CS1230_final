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
uniform sampler2D iChannel3;
out vec4 fragColor;

// Data structure for raymarching results
struct PrimitiveDist {
    float dist;
    int primitive; // Can be SPHERE, TERRAIN, or NO_INTERSECT
};

float hash21(vec2 p) {
    float h = dot(vec2(p),vec2(127.1,311.7));
    return fract(sin(h)*43758.5453123) * 2.0 - 1.0;
}

float hash31(vec3 p) {
    p = 50.0*fract( p*0.3183099 + vec3(0.71,0.113,0.419));
    return -1.0+2.0*fract( p.x*p.y*p.z*(p.x+p.y+p.z) );
}

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

float fbmTerrain(vec2 p, int level) {
    float amp = 0.51;
    float freq = 0.03;
    float sum = 0.0;

    for (int i = 0; i < level; i++) {
        float vNoise = valueNoise(p * freq);
        sum += amp * vNoise;
        freq *= 2.01;
        amp *= -0.49;
    }
    sum = pow(sum, 2.0);
    return sum * 45.0;
}

float fbmLight( vec3 p )
{
        vec3 q = p + vec3(sin(iTime),-1.*iTime,cos(iTime));
        float f;
    f  = 0.50000*(1.+valueNoise( q )); q = q*2.02;
    f += 0.25000*(1.+valueNoise( q )); q = q*2.03;
    f += 0.12500*(1.+valueNoise( q )); q = q*2.01;
    f += 0.06250*(1.+valueNoise( q )); q = q*2.02;
    f += 0.03125*(1.+valueNoise( q ));
        return clamp(f, 0.0, 1.0 );
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

    sum = (sum + 1.) * .5;
    return sum;
}

float fbmSealevel(vec3 p, int level) {
    float amp = 0.51;
    float freq = 0.03;
    float sum = 0.0;

    for (int i = 0; i < level; i++) {
        float vNoise = valueNoise(p * freq);
        sum += amp * vNoise;
        freq *= 2.01;
        amp *= -0.49;
    }
    return sin(sum * 10.);
}


float udBox( vec3 p, vec3 b ) {
  return length(max(abs(p)-b,0.0));
}

float mapTerrain(vec3 p, int level) {
        float dist = p.x*p.x + p.z*p.z;
    float delta = 0.;
    float h = fbmTerrain(p.xz, level);

    if (dist > 1600.) delta = - h * 1.0;
    else delta = - h + exp(-dist/500.-1.)*50.;


    return p.y -2. + delta;
}

float mapSealevel(vec3 p, int level) {
    return p.y - SEALEVEL_HEIGHT - fbmSealevel(vec3(p.xz * .1, iTime * .5) * 5., level);
}

const float theta = 3.14 * 2. / 15.;
const mat2 rotate2D = mat2(cos(theta), sin(theta), -sin(theta), cos(theta));

float mapHelix(vec3 p) {
    p.y = mod(p.y, 25.);
    vec3 offset = vec3(10., 3., 0.);
    float dh = 1.2;
    vec3 dimen = vec3(2.5, .1, 1.);
    float res = 100000.0;
    for (int i=0; i<16; i++) {
        res = min(res, udBox(p - offset, dimen)); p.xz = rotate2D * p.xz; p.y -= dh;
    }
        return res;
}

float mapCloud(vec3 p) {
    int and = int(p.y < CLOUD_HEIGHT_MAX) * int(p.y > CLOUD_HEIGHT_MIN);
        return mix(-1., min(abs(p.y - CLOUD_HEIGHT_MIN), abs(p.y - CLOUD_HEIGHT_MAX)), float(and));
}

float mapLight(vec3 p) {
    float dist = length(p.xz);
    int intersectLight = int(dist < LIGHT_RADIUS);
    return mix(dist - LIGHT_RADIUS,  0., float(intersectLight));
}

PrimitiveDist map(vec3 p) {
    float terrainDist = mapTerrain(p, LOD_RAY);
    float sealevelDist = mapSealevel(p, LOD_RAY - 1);
    float helixDist = mapHelix(p);
    float lightDist = mapLight(p);

    float dist = terrainDist;
    float which = float(TERRAIN);

    which = mix(float(SEALEVEL), which, step(dist, sealevelDist));
    dist = mix(sealevelDist, dist, step(dist, sealevelDist));
    which = mix(float(HELIX), which, step(dist, helixDist));
    dist = mix(helixDist, dist, step(dist, helixDist));
        which = mix(float(LIGHT), which, step(dist, lightDist));
    dist = mix(lightDist, dist, step(dist, lightDist));

    return PrimitiveDist(dist, int(which));

}

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


PrimitiveDist mapUnderSea(vec3 p) {
    float terrainDist = mapTerrain(p, LOD_RAY);
    float helixDist = mapHelix(p);
        //float lightDist = mapLight(p);

    float flag = step(helixDist, terrainDist);
    float resWhich = mix(float(TERRAIN), float(HELIX), flag);
    float resDist = mix(terrainDist, helixDist, flag);
        //resWhich = mix(float(LIGHT), resWhich, step(resDist, lightDist));
    //resDist = mix(lightDist, resDist, step(resDist, lightDist));

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


PrimitiveDist raymarchPassLight(vec3 ro, vec3 rd, float maxDist, float marchSpeed) {
    float marchDist = 0.001;
    float boundingDist = maxDist;
    float threshold = 0.1;

    for (int i = 0; i < 300; i++) {
        // Fill in loop body
        vec3 pos = ro + rd * marchDist;
        PrimitiveDist near = mapPassLight(pos);
        if (near.dist < threshold)
            return PrimitiveDist(marchDist, near.primitive);
        marchDist += near.dist * marchSpeed;
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
    // Fill in the iteration count
    for (int i = 0; i < 100 && marchDist <= boundingDist && near.dist >= threshold; i++) {
        // Fill in loop body
        vec3 pos = ro + rd * marchDist;
        near = mapUnderSea(pos);
        marchDist += near.dist * marchSpeed;
        }

    float flag = float(near.dist < threshold);
    float resDist = mix(-1., marchDist, flag);
    float resWhich = mix(float(NO_INTERSECT), float(near.primitive), flag);
    return PrimitiveDist(resDist, int(resWhich));
}

PrimitiveDist raymarch(vec3 ro, vec3 rd, float maxDist, float marchSpeed) {
    float marchDist = 0.001;
    float boundingDist = maxDist;
    float threshold = 0.1;

    for (int i = 0; i < 300; i++) {
        // Fill in loop body
        vec3 pos = ro + rd * marchDist;
        PrimitiveDist near = map(pos);
        if (near.dist < threshold)
            return PrimitiveDist(marchDist, near.primitive);
        marchDist += near.dist * marchSpeed;
        if (marchDist > boundingDist) break;
    }

    float isCloud = float((ro.y < CLOUD_HEIGHT_MIN && rd.y > 0.) || (ro.y > CLOUD_HEIGHT_MAX && rd.y < 0.));
        float which = mix(float(NO_INTERSECT), float(CLOUD), isCloud);
    return PrimitiveDist(-1.0, int(which));
}

vec3 generateTerrainColor(vec3 pos, vec3 norm, vec3 lig) {
    vec3 col        = vec3(0.0);
    vec3 earth      = vec3(.824, .706, .549);
    vec3 calcaire   = vec3(.624, .412, .118);
    vec3 rocks      = vec3(.412, .388, .422);
    vec3 beach      = vec3( 1.0, .894, .710);
        vec3 snow1 = vec3 ( .78,.78,.78);
    vec3 snow2 = vec3 ( .9,.9,.9);

    float posNoise = valueNoise(pos.xz) + 1.0 * 0.5;

    // Ambient
    float ambient = 0.2;
    // Diffuse
    float diffuse = clamp(dot(norm, lig), 0.0, 1.0);

    // base color
    col = mix ( beach,    earth, smoothstep(0.0 , 0.08, pos.y) );
    col = mix ( col  , calcaire, smoothstep(0.08,  0.3, pos.y) );
    col = mix ( col  ,    rocks, smoothstep(0.3 , 10.0, pos.y) );

    vec3 snowColor = mix(snow1, snow2, smoothstep(0.0, 10.0, posNoise * 10.0));
    col = mix(snowColor, col, step(norm.y, .6));

    return ambient + diffuse * col;
}

vec3 generateHelixColor(vec3 ro, vec3 rd, vec3 norm, vec3 lig) {
    float ambient = 0.1;
    float diffuse = clamp(dot(norm, lig), 0.0, 1.0);
    float specular = pow(clamp(dot(rd, reflect(lig, norm)), 0.0, 1.0), 16.);

    vec3 col = vec3(1., 1., .93);
    return ambient + col * (diffuse + specular);
}

vec3 generateSeaColor(vec3 ro, vec3 rd, vec3 norm, vec3 lig) {
    float ndotr = dot(norm, rd);
    float r0 = .6;
    r0 = min(r0 + .3 * max(valueNoise(vec3(ro.xz * 5., iTime * 10.)) - .2, 0.), 1.0);
    float fresnel = r0 + (1. - r0) * pow(1.0 - abs(ndotr), 5.);
    vec3 col = vec3(.292, .434, .729), reflCol, refrCol;
    float darkness = 1.;

    // Reflection
    vec3 reflD = reflect(rd, normalize(norm + vec3(.0, .3, .0)));
    PrimitiveDist res = raymarch(ro, reflD, 100., .5);
    vec3 reflPos = ro + res.dist * reflD;
    if (res.primitive == TERRAIN) {
        reflCol = generateTerrainColor(reflPos, calcNormal(reflPos, TERRAIN), lig);
    } else if (res.primitive == HELIX) {
        reflCol = generateHelixColor(reflPos, reflD, calcNormal(reflPos, HELIX), lig);
    }

    // Refraction
    vec3 refrD = refract(rd, vec3(0., 1., 0.), .8);
    res = raymarchUnderSea(ro, refrD, 20., .8);
    vec3 refrPos = ro + res.dist * refrD;
    if (res.primitive == TERRAIN) {
        refrCol = generateTerrainColor(refrPos, calcNormal(refrPos, TERRAIN), lig);
    } else if (res.primitive == HELIX) {
        refrCol = generateHelixColor(refrPos, refrD, calcNormal(refrPos, HELIX), lig);
    }

    col = mix(col, fresnel * reflCol + (1. - fresnel) * refrCol, .8);

    // Shadow
    res = raymarch(ro + vec3(0, .15, 0.), lig, 60., .5);
    vec3 shadPos = ro + res.dist * lig;

    int or = int(res.primitive == HELIX || res.primitive == TERRAIN);
    darkness -= float(or)*( 1. / (1. + res.dist * .1 +  res.dist * res.dist * .005));

    vec3 ambient  = clamp(vec3(0.,0.41,.58)*abs(refrPos.y)*.1, 0., 1.);
    float diffuse  = clamp(dot(norm, lig), 0.0, 1.0);
    float specular = pow(clamp(dot(rd, reflect(lig, norm)), 0.0, 1.0), 32.);

    return (ambient + col * (diffuse + specular)) * darkness;
}

vec3 generateCloudColor(vec3 ro, vec3 rd) {
    vec3 bgc = vec3(0.3, .55, .8);
    vec4 sum = vec4(0.);
    float dist;
    float less = float(ro.y < CLOUD_HEIGHT_MIN);
    float more = float(ro.y > CLOUD_HEIGHT_MAX);
    vec3 cp_ro = ro;

    dist = mix(dist, (CLOUD_HEIGHT_MIN - cp_ro.y) / rd.y + .01, less);
    ro += less * dist * rd;

    dist = mix(dist, -(cp_ro.y - CLOUD_HEIGHT_MAX) / rd.y + .01, more);
    ro += more * dist * rd;

    vec3 cloud1 = vec3(1.0,0.95,0.8);
    vec3 cloud2 = vec3(0.25,0.3,0.35);

    rd.y = sqrt(abs(rd.y)) * sign(rd.y);

    while ((sum.a < 1.0) && (ro.y > CLOUD_HEIGHT_MIN) && (ro.y < CLOUD_HEIGHT_MAX)) {
        float density = fbmCloud(ro * rd.y, LOD_NORM) * .1;
        vec3 col = mix(cloud1, cloud2, density);
        sum.a += density;
        sum.rgb += col * density * density * 15.;
        ro = ro + rd * .5;
    }

    bgc = mix(bgc, sum.rgb, sum.a);
        return bgc;
}

float buff = 2.5;
vec3 generateLightColor(vec3 ro, vec3 rd, float t, vec3 lig, vec3 ligColor) {
    vec4 sum = vec4(0.0);
    vec3 pos = vec3(0.0);
        float dist = 0.0;


        for(int i=0; dist <= LIGHT_RADIUS*LIGHT_RADIUS + buff && sum.a <= .99 && i < 300; i++) {
        pos = ro + t*rd;
        dist = pos.x*pos.x + pos.z*pos.z;

        float den = mix(0., fbmLight( pos )* exp(-dist*.33)*(dist*1.2 + 2.), step(dist, 25.));
        float flag = float(den > 0.01);
        float dif =  clamp((den - fbmLight(pos+0.3*lig))/0.6, 0.0, 1.0 );

        // lighting
        vec3 lin = vec3(0.99,0.99,0.4)*1.4; - vec3(.9, .9, .9)*dif;
        vec4 col = vec4( mix( vec3(1.,1.,0.), vec3(1.0,1.0,0.8), den ), den );
        col.xyz *= lin;
        col.xyz = mix( col.xyz, ligColor, 1.0-exp(-0.003*t*t) );
        // front to back blending
        col.a *= 0.6;
        col.rgb *= col.a;
        sum += flag * col*(1.-sum.a);

        t += max(0.05,0.15*t);
        }

    PrimitiveDist passObject = raymarchPassLight(ro, rd, 350., .5);
        pos = ro + passObject.dist*rd;
    vec4 lightColor = clamp(sum, 0., 1.);
    int which = passObject.primitive;

    // Normal vector
    vec3 nor = calcNormal(pos, which);

    // BackgroundColor Placeholder
        vec3 col = vec3(0.);
    if (which == TERRAIN) {
        col = generateTerrainColor(pos, nor, lig);
    } else if (which == HELIX) {
        col = generateHelixColor(pos, rd, nor, lig);
    } else if (which == SEALEVEL){
        col = generateSeaColor(pos - rd * .05, rd, nor, lig);
    } else if (which == CLOUD) {
        col = generateCloudColor(ro, rd);
    }

    float fo = .5 - .5 / (1. + passObject.dist * .02 +  passObject.dist * passObject.dist * .0001);
    vec3 fco = vec3(0.68,0.68,0.6);
    col = mix( col, fco, fo );

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
        col = generateTerrainColor(pos, nor, lig);
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
    // Rain
    vec2 rainUV = (uv * vec2(5., .3) + vec2(.8 * iTime - (uv.x + uv.y) * 1., .8 * iTime)) * 30. ;
    float rain = max(valueNoise(rainUV), 0.) * .5;
    col = mix(col, vec3(rain), .1);
    return col;
}

//void getRay(out vec3 ro, out vec3 rd, out vec2 uv) {
//    ro = vec3(6.0 * sin(iTime * .3), 10.0, 6.0 * cos(iTime * .3));

//    float focalLength = 2.0;

//    // The target we are looking at
//    vec3 target = vec3(0.0, 8.0, 0.0);
//    // Look vector
//    vec3 look = normalize(ro - target);
//    // Up vector
//    vec3 up = vec3(0.0, 1.0, 0.0);

//    // Set up camera matrix
//    vec3 cameraForward = -look;
//    vec3 cameraRight = normalize(cross(cameraForward, up));
//    vec3 cameraUp = normalize(cross(cameraRight, cameraForward));

//    // Construct the ray direction vector
//    uv = gl_FragCoord.xy / iResolution.xy;
//    uv = uv * 2.0 - 1.0;
//    uv.x = uv.x * iResolution.x / iResolution.y;
//    rd = normalize(uv.x * cameraRight + uv.y * cameraUp + focalLength * cameraForward);
//}

void main() {
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

    vec3 col = vec3(0.68,0.68,0.6);

    // AA
    if (AA == 1) {
        vec2 uvSize = 2. / iResolution.yx;

        for (int dx = -1; dx <= 1; dx += 2) {
            for (int dy = -1; dy <= 1; dy += 2) {
                vec2 puv = uv + vec2(float(dx) * uvSize.x * .25, float(dy) * uvSize.y * .25);
                vec3 rayDirection = vec3(puv, focalLength);
                rayDirection = normalize(puv.x * cameraRight + puv.y * cameraUp + focalLength * cameraForward);

                PrimitiveDist rayMarchResult = raymarch(rayOrigin, rayDirection, 350., .5);
                int intersect = int(rayMarchResult.primitive != NO_INTERSECT);
                vec3 tcol = mix(vec3(0.68,0.68,0.6), render(rayOrigin, rayDirection, rayMarchResult.dist, rayMarchResult.primitive), float(intersect));

                // Postprocess
                //fog
                int isLight = int(rayMarchResult.primitive == LIGHT);
                float fo = .5 - .5 / (1. + rayMarchResult.dist * .02 +  rayMarchResult.dist * rayMarchResult.dist * .0001);
                vec3 fco = vec3(0.68,0.68,0.6);
                tcol = mix(mix( tcol, fco, fo ), tcol, float(isLight));
                tcol = postProcess(tcol, uv);
                col += tcol;
            }
        }
        col *= .25;

    } else if (AA == 0) {
        vec3 rayDirection = vec3(uv, focalLength);
        rayDirection = normalize(uv.x * cameraRight + uv.y * cameraUp + focalLength * cameraForward);

        PrimitiveDist rayMarchResult = raymarch(rayOrigin, rayDirection, 350., .5);
        int intersect = int(rayMarchResult.primitive != NO_INTERSECT);
        col = mix(vec3(0.68,0.68,0.6), render(rayOrigin, rayDirection, rayMarchResult.dist, rayMarchResult.primitive), float(intersect));

        // Postprocess
        col = postProcess(col, uv);
        //fog

        int isLight = int(rayMarchResult.primitive == LIGHT);
        float fo = .5 - .5 / (1. + rayMarchResult.dist * .02 +  rayMarchResult.dist * rayMarchResult.dist * .0001);
        vec3 fco = vec3(0.68,0.68,0.6);
        col = mix(mix( col, fco, fo ), col, float(isLight));

    }

    fragColor = vec4(col, 1.0);
}
