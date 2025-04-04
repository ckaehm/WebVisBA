precision highp float;
precision highp int;
precision highp sampler2D;

uniform sampler2D bufferTexture;

uniform float kernel[kernelSize];
// size is neede, as kernel[kernelSize].length() with dynamic array is not possible
uniform float kSize;

in vec2 vUv;

/* own variable name for fragment out, as gl_FragColor is deprecated in the used glsl version
** https://stackoverflow.com/a/51459750, visited 20.01.23 */
out vec4 outColor;


// how to apply kernel see: https://webgl2fundamentals.org/webgl/lessons/webgl-image-processing.html, visited 02.04.23
float applyKernel() {
    float sum = 0.0;
    int kernelIndex = 0;
    // round off because mean is needed [-mean, mean]
    int mean = int(floor(sqrt(kSize) / 2.0));

    // apply Kernel on current pixel
    for (int ky = -mean; ky <= mean; ky++) {
        for (int kx = -mean; kx <= mean; kx++) {
            // current Kernel Value
            float kernelValue = kernel[kernelIndex];

            vec2 pixelCoord = vec2(kx, ky) / vec2(textureSize(bufferTexture, 0));
            float pixelColor = texture(bufferTexture, vec2(vUv + pixelCoord)).r;
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

// apply Kernel see: https://webgl2fundamentals.org/webgl/lessons/webgl-image-processing.html, visited 02.04.23
void main() { 
    float color;

    // image convolution
    if(kSize > 0.0) {
        color = applyKernel();
    } else {
        color = texture( bufferTexture, vec2( vUv )).r;
    }
    
    outColor = vec4(vec3(color), 1.0);
}