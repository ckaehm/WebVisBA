declare var VideoFrame: any;

export class VideoRenderer {
    private canvas: HTMLCanvasElement;
    private ctx?: CanvasRenderingContext2D;
    private gl?: WebGLRenderingContext;
    private program?: WebGLProgram;

    private rendering: boolean = false; 
    private processMode: boolean;
    private startTime: number | null = null;
    private firstTimestamp: number | null = null;
    private frameQueue: {frame: typeof VideoFrame; timestamp: number}[] = [];

    constructor(canvas: HTMLCanvasElement, process: boolean = false){
        this.canvas = canvas;
        this.processMode = process;
        
        if(this.processMode){
            this.initWebGL();
        } else if(!this.processMode){
            const context = canvas.getContext("2d");
            if(!context){throw new Error("Canvas 2D context not found!");}
            this.ctx = context;
        }
    }

    public getStartTime(): number {
        return this.startTime!;
    }

    enqueueFrame(frame: typeof VideoFrame): void{
        if(this.firstTimestamp === null){
            this.firstTimestamp = frame.timestamp;
            this.startTime = performance.now();
        }
        this.frameQueue.push({frame, timestamp: frame.timestamp});
    }

    startRendering(): void {
        if(this.rendering) return;
        this.rendering = true;

        const renderLoop = () => {
            if(!this.rendering) return;
            requestAnimationFrame(renderLoop);
            if(this.startTime === null || this.firstTimestamp === null) return;
            const now = performance.now();
            const elapsed = now - this.startTime; //time in ms
            const videoTime = elapsed * 1000;
            while(this.frameQueue.length > 0 && (this.frameQueue[0].timestamp - this.firstTimestamp) <= videoTime){
                const { frame } = this.frameQueue.shift()!;
                if(this.processMode){
                    this.renderWithWebGL(frame);
                } else if(!this.processMode){
                    this.renderStandard(frame);
                }
                frame.close();
            }
        };
        renderLoop();
    }

    public stopRendering(): void{
        this.rendering = false;
        this.reset();
    }

    private renderStandard(frame: typeof VideoFrame): void {
        this.ctx!.drawImage(frame as unknown as CanvasImageSource, 0, 0, this.canvas.width, this.canvas.height)
    }

    private renderWithWebGL(frame: typeof VideoFrame): void {
        const gl = this.gl!;
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, frame as unknown as TexImageSource);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        gl.useProgram(this.program!);

        const uImageLocation = gl.getUniformLocation(this.program!, "u_image");
        gl.uniform1i(uImageLocation, 0);

        const uTextureSize = gl.getUniformLocation(this.program!, "u_textureSize");
        gl.uniform2f(uTextureSize, this.canvas.width, this.canvas.height);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.deleteTexture(texture);
    }

    reset(): void {
        this.frameQueue.forEach(({frame}) => frame.close());
        this.frameQueue = [];
        this.startTime = null;
        this.firstTimestamp = null;
    }

    private initWebGL(): void {
        this.gl = this.canvas.getContext("webgl", { preserveDrawingBuffer: true })!;
        if(!this.gl) throw new Error("WebGL not supported!");
        const gl = this.gl;

        const vertexShaderSource = `
            attribute vec2 a_position;
            attribute vec2 a_texCoord;
            varying vec2 v_texCoord;
            void main() {
                gl_Position = vec4(a_position, 0, 1);
                v_texCoord = a_texCoord;
            }
        `;
        const fragmentShaderSource = `
            precision mediump float;

            varying vec2 v_texCoord;
            uniform sampler2D u_image;
            uniform vec2 u_textureSize;

            const float threshold = 0.75;

            void main() {
                vec2 onePixel = 1.0 / u_textureSize;
                float sum = 0.0;

                float g00 = dot(texture2D(u_image, v_texCoord + onePixel * vec2(-1.0, -1.0)).rgb, vec3(0.299, 0.587, 0.114)) > threshold ? 1.0 : 0.0;
                float g10 = dot(texture2D(u_image, v_texCoord + onePixel * vec2( 0.0, -1.0)).rgb, vec3(0.299, 0.587, 0.114)) > threshold ? 1.0 : 0.0;
                float g20 = dot(texture2D(u_image, v_texCoord + onePixel * vec2( 1.0, -1.0)).rgb, vec3(0.299, 0.587, 0.114)) > threshold ? 1.0 : 0.0;

                float g01 = dot(texture2D(u_image, v_texCoord + onePixel * vec2(-1.0,  0.0)).rgb, vec3(0.299, 0.587, 0.114)) > threshold ? 1.0 : 0.0;
                float g11 = dot(texture2D(u_image, v_texCoord + onePixel * vec2( 0.0,  0.0)).rgb, vec3(0.299, 0.587, 0.114)) > threshold ? 1.0 : 0.0;
                float g21 = dot(texture2D(u_image, v_texCoord + onePixel * vec2( 1.0,  0.0)).rgb, vec3(0.299, 0.587, 0.114)) > threshold ? 1.0 : 0.0;

                float g02 = dot(texture2D(u_image, v_texCoord + onePixel * vec2(-1.0,  1.0)).rgb, vec3(0.299, 0.587, 0.114)) > threshold ? 1.0 : 0.0;
                float g12 = dot(texture2D(u_image, v_texCoord + onePixel * vec2( 0.0,  1.0)).rgb, vec3(0.299, 0.587, 0.114)) > threshold ? 1.0 : 0.0;
                float g22 = dot(texture2D(u_image, v_texCoord + onePixel * vec2( 1.0,  1.0)).rgb, vec3(0.299, 0.587, 0.114)) > threshold ? 1.0 : 0.0;

                sum += g00 * 1.0; sum += g10 * 2.0; sum += g20 * 1.0;
                sum += g01 * 2.0; sum += g11 * 4.0; sum += g21 * 2.0;
                sum += g02 * 1.0; sum += g12 * 2.0; sum += g22 * 1.0;

                float blurred = sum / 16.0;
                gl_FragColor = vec4(vec3(blurred), 1.0);
            }
        `;

        const vs = this.compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const fs = this.compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
        
        this.program = gl.createProgram()!;
        gl.attachShader(this.program, vs);
        gl.attachShader(this.program, fs);
        gl.linkProgram(this.program);

        if(!gl.getProgramParameter(this.program, gl.LINK_STATUS)){
            throw new Error("Error while linking shader: " + gl.getProgramInfoLog(this.program));
        }

        const positionLocation = gl.getAttribLocation(this.program, "a_position");
        const texCoordLocation = gl.getAttribLocation(this.program, "a_texCoord");

        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 0, 0, 1, -1, 1, 0, -1, 1, 0, 1, 1, 1, 1, 1]), gl.STATIC_DRAW);

        const size = 2;
        const stride = 4 * Float32Array.BYTES_PER_ELEMENT;
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, stride, 0);
        gl.enableVertexAttribArray(texCoordLocation);
        gl.vertexAttribPointer(texCoordLocation, size, gl.FLOAT, false, stride, 2 * Float32Array.BYTES_PER_ELEMENT)
    }

    private compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
        const shader = gl.createShader(type)!;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        
        if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
            throw new Error("Shader compile error: " + gl.getShaderInfoLog(shader));
        }
        return shader;
    }

    public getCanvas(): HTMLCanvasElement {
        return this.canvas;
    }
}