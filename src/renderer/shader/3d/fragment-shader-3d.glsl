// fundamental algorithms for fragment shaders see.: https://github.com/mrdoob/three.js/blob/master/examples/webgl2_volume_cloud.html#L138-L245, viseted 10.04.23

precision highp float;
precision highp sampler3D;
in vec3 vOrigin;
in vec3 vDirection;
out vec4 color;
uniform sampler3D volumeTexture;
uniform float stepSize;

uniform float windowCenter;
uniform float windowWidth;

uniform float kernel[kernelSize];
// kSize is neede, as kernel[kernelSize].length() with dynamic array is not possible
uniform float kSize;

uniform float voxelSizeZ;

/* window function
** Value Of Interest(VOI) lookup table(LUT) */
float voiLut(float value) {
    float wMinValue = windowCenter - windowWidth / 2.0;
    float wMaxValue = windowCenter + windowWidth / 2.0;
    if (value < wMinValue) {
        return 0.0;
    } else if (value > wMaxValue) {
        return 1.0;
    } else {
        return (value - wMinValue) / windowWidth;
    }
}

vec2 hitBox( vec3 orig, vec3 dir ) {
    vec3 box_min = vec3( - 0.5 );
    vec3 box_max = vec3( 0.5 );
    vec3 inv_dir = 1.0 / dir;
    box_min.z = box_min.z * voxelSizeZ;
    box_max.z = box_max.z * voxelSizeZ;
    vec3 tmin_tmp = ( box_min - orig ) * inv_dir;
    vec3 tmax_tmp = ( box_max - orig ) * inv_dir;
    vec3 tmin = min( tmin_tmp, tmax_tmp );
    vec3 tmax = max( tmin_tmp, tmax_tmp );
    float t0 = max( tmin.x, max( tmin.y, tmin.z ) );
    float t1 = min( tmax.x, min( tmax.y, tmax.z ) );
    return vec2( t0, t1 );
}

// how to apply kernel see: https://webgl2fundamentals.org/webgl/lessons/webgl-image-processing.html, visited 02.04.23
float applyKernel(vec3 coord) {
    float sum = 0.0;
    int kernelIndex = 0;
    // round off because mean is needed [-mean, mean]
    int mean = int(floor(sqrt(kSize) / 2.0));

    // apply Kernel on current pixel
    for (int ky = -mean; ky <= mean; ky++) {
        for (int kx = -mean; kx <= mean; kx++) {
            // current Kernel Value
            float kernelValue = kernel[kernelIndex];

            vec2 pixelTexturePosition = vec2(kx, ky) / vec2(textureSize(volumeTexture, 0));
            float pixelColor = texture(volumeTexture, vec3(coord.xy + pixelTexturePosition, coord.z)).r;
            float pixelMultKernel = pixelColor * kernelValue;
            sum += pixelMultKernel;
            kernelIndex +=1;
        }
    }
    /* do not allow values smaller than 0, because in data modifiy filter this is also not possible, because data type Uint is used.
    ** so both have the same result */
    if(sum < 0.0) {
        return 0.0;
    }
    return sum;
}

// voiLut here, since this value is used for shading. If 16-bit data were used, the shader would otherwise be white
// applying voiLut also to the calculated shader and then still to the pixel value would slow down the calculation time.
float sample1( vec3 coord ) {
    if(kSize > 0.0) {
        return voiLut(applyKernel(coord));
    }
    return voiLut(texture( volumeTexture, coord ).r);
}
float shading( vec3 coord ) {
    float step = 0.01;
    return sample1( coord + vec3( - step ) ) - sample1( coord + vec3( step ) );
}

void main(){
    vec3 rayDir = normalize( vDirection );
    vec2 bounds = hitBox( vOrigin, rayDir );
    if ( bounds.x > bounds.y ) discard;
    bounds.x = max( bounds.x, 0.0 );
    vec3 coord = vOrigin + bounds.x * rayDir;
    vec3 inc = 1.0 / abs( rayDir );
    float delta = min( inc.x, min( inc.y, inc.z ) );
    delta /= stepSize;
    vec3 size = vec3( textureSize( volumeTexture, 0 ) );
    coord += rayDir * ( 1.0 / size );
    //
    coord.z /= voxelSizeZ;
    vec4 ac = vec4( vec3(0.6), 0.0 );
    for ( float t = bounds.x; t < bounds.y; t += delta ) {
        float d = sample1( coord + 0.5 );
        // smoothstep not needed as voiLut is used and it is used before shading. otherwise when using 16 bit data there is no shader
        float col = shading( coord + 0.5 );
        ac.rgb += d * col;
        ac.a += d;
        // ray marching loop as soon as the accumulated opacity has reached a given threshold
        if ( ac.a >= 0.95 ) break;
        coord += rayDir * delta;
    }

    color = vec4(vec3(ac.r), ac.a);
    if ( color.a == 0.0 ) {
        discard;
    }
}