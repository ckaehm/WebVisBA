// idea to set slice in shader see: https://github.com/mrdoob/three.js/blob/master/examples/webgl2_materials_texture2darray.html#L26-L43, visited 20.04.23
precision highp float;
precision highp int;
precision highp sampler2DArray;
precision highp sampler2D;

uniform sampler2DArray volumeTexture;
uniform int slice;
uniform float windowCenter;
uniform float windowWidth;

uniform float kernel[kernelSize];
// kSize is neede, as kernel[kernelSize].length() with dynamic array is not possible
uniform float kSize;


in vec2 vUv;

/* own variable name for fragment out, as gl_FragColor is deprecated in the used glsl version
** https://stackoverflow.com/a/51459750, visited 20.01.23 */
out vec4 outColor;

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
// how to apply kernel see: https://webgl2fundamentals.org/webgl/lessons/webgl-image-processing.html, visited 02.04.23
float applyKernel() {
    float sum = 0.0;
    int kernelIndex = 0;
    // round off because the mean kernel index is needed [-mean, mean]
    int mean = int(floor(sqrt(kSize)) / 2.0);

    // apply Kernel on current pixel
    for (int ky = -mean; ky <= mean; ky++) {
        for (int kx = -mean; kx <= mean; kx++) {
            // current Kernel Value
            float kernelValue = kernel[kernelIndex];

            vec2 pixelCoord = vec2(kx, ky) / vec2(textureSize(volumeTexture, 0));
            float pixelColor = texture(volumeTexture, vec3(vUv + pixelCoord, slice)).r;
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

void main() { 
    float color;
    
    // image convolution
    if(kSize > 0.0) {
        color = applyKernel();
    } else {
        color = texture( volumeTexture, vec3( vUv, slice )).r;
    }

    
    float colorWindowing = voiLut(color);
    outColor = vec4(vec3(colorWindowing), 1.0);
}