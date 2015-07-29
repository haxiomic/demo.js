/*
	CanvasShader
	
	for canvas-covering pixel shaders
*/
DEMO.CanvasShader = Demo.extend(function(canvas, fragmentShader){
	DEMO.CanvasShader.parent.call(this, canvas);//super

	//set the canvas attribute dimensions (not just the style dimensions)
	this.canvas.width = this.width();
	this.canvas.height = this.height();

	var gl = this.canvas.getContext('webgl');
	this.gl = gl;

	this.shadersNeedCompile = true;

	//webgl settings
	gl.clearColor(0, 0, 0, 1);
	gl.disable(gl.CULL_FACE); //makes triangles visible even if they face away

	/* ---- Create Shaders ---- */
	//the do nothing geometry shader
	this.geometryShaderSrc = [
		'precision mediump float;',

		'attribute vec2 position;',
		'varying vec2 uv;',

		'void main(){',
			'uv = (position.xy + vec2(1.0))*.5; //converts from clip space to graph space',
			
			'gl_Position = vec4(position, .0, 1.0);',
		'}'
	].join('\n');

	//simple gradient fragment shader
	this.pixelShaderHeader = [
		'precision mediump float;',

		'uniform float time;',
		'uniform vec2 resolution;',

		'varying vec2 uv;',
		''
	].join('\n');

	this.pixelShaderSrc = this.pixelShaderHeader + (!fragmentShader ? [
		'void main(){',
		'	vec3 col = vec3(0);',

		'	gl_FragColor = vec4(uv, 0.0, 1.0);',
		'}'
	].join('\n') : fragmentShader);

	/* ---- Upload Geometry ---- */
	var vertices = [
		-1,  1,   //  0---2
		-1, -1,   //  |  /|
		 1,  1,   //  | / |
		 1, -1,   //  1---3
	]	

	vertices.elementsPerVertex = 2;
	vertices.vertexCount = vertices.length/vertices.elementsPerVertex;
	this.vertices = vertices;

	var vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	this.vertexBuffer = vertexBuffer;
});

DEMO.CanvasShader.prototype.render = function(dt){
	//recompile shaders if necessary
	if(this.shadersNeedCompile === true){
		this._compileShaders();
	}

	var gl = this.gl;
	var program = this.program;
	var vertexBuffer = this.vertexBuffer;
	var vertices = this.vertices;

	/* ---- Draw! ---- */
	gl.useProgram(program);
	//set the vertices as the active geometry
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	//tell the GPU about the format of the vertices
	gl.vertexAttribPointer(program.aPositionLoc, vertices.elementsPerVertex, gl.FLOAT, false, 0, 0);
	//upload the time variable
	gl.uniform1f(program.uTime, this.time);
	//set the draw region and dimension
	gl.viewport(0, 0, this.width(), this.height());
	//clear canvas from last draw
	gl.clear(gl.COLOR_BUFFER_BIT);
	//draw triangle geometry
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertices.vertexCount);
}

DEMO.CanvasShader.prototype.setSize = function(w, h){
	this.canvas.width = w;
	this.canvas.height = h;
	//update resolution uniform
	this.gl.useProgram(this.program);
	this.gl.uniform2f(this.program.uResolution, this.width(), this.height());
}

DEMO.CanvasShader.prototype.setPixelShader = function(pixelShaderSrc){
	this.pixelShaderSrc = this.pixelShaderHeader + pixelShaderSrc;
	this.shadersNeedCompile = true;
}

DEMO.CanvasShader.prototype.setGeometryShader = function(geometryShaderSrc){
	this.geometryShaderSrc = geometryShaderSrc;
	this.shadersNeedCompile = true;
}

DEMO.CanvasShader.prototype._compileShaders = function(){
	var gl = this.gl;
	var geometryShaderSrc = this.geometryShaderSrc;
	var pixelShaderSrc = this.pixelShaderSrc;

	this.shadersNeedCompile = false;

	//remove any old programs
	if(this.program){
		gl.deleteProgram(this.program);
	}

	//create and compile
	var geometryShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(geometryShader, geometryShaderSrc);
	gl.compileShader(geometryShader);

	var pixelShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(pixelShader, pixelShaderSrc);
	gl.compileShader(pixelShader);

	//check for compilation errors
	if(!gl.getShaderParameter(geometryShader, gl.COMPILE_STATUS)){
		throw {
			type: 'vs',
			msg: gl.getShaderInfoLog(geometryShader)
		};
	}

	if(!gl.getShaderParameter(pixelShader, gl.COMPILE_STATUS)){
		throw {
			type: 'fs',
			msg: gl.getShaderInfoLog(pixelShader)
		};
	}

	var program = gl.createProgram();
	gl.attachShader(program, geometryShader);
	gl.attachShader(program, pixelShader);
	gl.linkProgram(program);
	this.program = program;

	if(!gl.getProgramParameter(program, gl.LINK_STATUS)){
		//cleanup shaders
		gl.detachShader(program, geometryShader);
		gl.detachShader(program, pixelShader);
		gl.deleteShader(geometryShader);
		gl.deleteShader(pixelShader);
		throw {
			type: 'link',
			msg: gl.getProgramInfoLog(program)
		};
	}

	//get program's 'position' attribute memory location
	program.aPositionLoc = gl.getAttribLocation(program, "position");
	//get program's 'time' uniform memory location
	program.uTime = gl.getUniformLocation(program, "time");
	//get program's 'resolution' uniform memory location
	program.uResolution = gl.getUniformLocation(program, "resolution");

	//enable vertex position data
	gl.enableVertexAttribArray(program.aPositionLoc);

	//upload initial uniforms
	gl.useProgram(program);
	gl.uniform1f(program.uTime, this.time);
	gl.uniform2f(program.uResolution, this.width(), this.height());
}