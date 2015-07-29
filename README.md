# demo.js

This is a little utility class to quickly whip up canvas based demos.

### v 0.0.7
*not quite ready for production*

## Takes care of

- inheritance
- mouse
- custom event dispatch
- time tracking


## Usage

```javascript
var SomeDemo = Demo.extend(function(canvas){
	Demo.call(this, canvas);//super
});
```