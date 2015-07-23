/*
	demo.js v0.6

	- handy utility for quickly creating WebGL demos

	@author George Corney (haxiomic)
*/

var DEMO = {};


/*
	Demo

	base class for demos
*/
DEMO.Demo = function(canvas){
	//private
	var initTime = Date.now()/1000;
	var lastTime = initTime;

	var mainLoop = (function(){
		if(!this.running) return;

		this.time = Date.now()/1000 - initTime;
		var dt = this.time - lastTime;
		lastTime = this.time;

		this.update(this.time);
		this.render(dt);

		requestAnimationFrame(mainLoop);
	}).bind(this);

	//mouse handling
	this.canvas = canvas;
	this.running = false;
	this.time = 0;
	this.mouseDown = false;
	this.mouse = {
		x:0,
		y:0
	}
	this._mainLoop = mainLoop;

	this.canvas.addEventListener('mousedown', (function(e){
		this.mouseDown = true;
		this.mouse.x = e.layerX;
		this.mouse.y = e.layerY;
		this.onMouseDown(e);
	}).bind(this));

	this.canvas.addEventListener('mouseup', (function(e){
		this.mouseDown = false;
		this.mouse.x = e.layerX;
		this.mouse.y = e.layerY;
		this.onMouseUp(e);
	}).bind(this));

	this.canvas.addEventListener('mousemove', (function(e){
		this.mouse.x = e.layerX;
		this.mouse.y = e.layerY;
		this.onMouseMove(e);
	}).bind(this));

	this.canvas.addEventListener('mouseleave', (function(e){
		this.mouseDown = false;
	}).bind(this));
}

DEMO.Demo.extend = function(constructor){
	var cClass = this;
	var obj = constructor;
	obj.prototype = Object.create(cClass.prototype);
	obj.prototype.constructor = obj;

	obj.parent = cClass;
	obj.extend = cClass.extend;
	return obj;
}

DEMO.Demo.prototype.constructor = DEMO.Demo;

DEMO.Demo.prototype.start = function(){
	if(this.running) return;
	this.running = true;
	this._mainLoop();
	this.dispatch('start', this);
}

DEMO.Demo.prototype.stop = function(){
	this.running = false;
	this.dispatch('stop', this);
}

DEMO.Demo.prototype.update = function(time){}

DEMO.Demo.prototype.render = function(dt){}

DEMO.Demo.prototype.setSize = function(width, height){
	this.canvas.width = width;
	this.canvas.height = height;
	return this;
}

DEMO.Demo.prototype.width = function(){
	return this.canvas.clientWidth;
}

DEMO.Demo.prototype.height = function(){
	return this.canvas.clientHeight;
}

DEMO.Demo.prototype.onMouseDown = function(e){}
DEMO.Demo.prototype.onMouseUp = function(e){}
DEMO.Demo.prototype.onMouseMove = function(e){}
DEMO.Demo.prototype.onMouseLeave = function(e){}

DEMO.Demo.prototype.listeners = {};//{ name: [callbacks] }

DEMO.Demo.prototype.addEventListener = function(eventName, callback){
	if(!this.listeners[eventName])
		this.listeners[eventName] = [];

	this.listeners[eventName].push(callback);
	return this;
}

DEMO.Demo.prototype.removeEventListener = function(eventName, callback){
	if(!this.listeners[eventName]){
		while(true){
			var cbi = this.listeners[eventName].indexOf(callback);
			if(cbi < 0) break;
			this.listeners[eventName].splice(cbi, 1);
		}
	}
	return this;
}

DEMO.Demo.prototype.dispatch = function(eventName, data){
	var callbacks = this.listeners[eventName];
	if(callbacks){
		for(var i = 0; i < callbacks.length; i++){
			callbacks[i](data);
		}
	}
	return this;
}



//Utils
DEMO.utils = {};

//Data
DEMO.data = {};