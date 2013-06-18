Thread for JavaScript
=================

```javascript
// create a new thread
var thr = new Thread(function() {
  this.addEventListener( "message", function ( event ) {
    // convert value into a number
    var value = event.data * 1;
    // send the square of the number back to the main thread
    this.postMessage( value * value );
  }, false );
});

// listen to messages from the thread
thr.addEventListener( "message", function ( event ) {
  // log the result of x^2
  console.log( event.data );
}, false );

// listen to errors from the thread
thr.addEventListener( "error", function ( event ) {
  console.log( "error: " + event.message + " in " + event.filename + " on line " + event.lineno );
}, false );

// send a message to the thread
// (will log the value 25 on the console)
thr.postMessage( 5 );

// kill a thread
thr.kill();
// or
Thread.kill( thr );

// get state of a thread
// -- thread is running: true
// -- thread terminated: false
// -- thread terminated after an error: null
thr.state;

// check if Thread is supported
if ( !Thread.isSupported ) {
  console.warn( "Thread is not supported in this browser" );
}
```
other ways to create a thread
=====
```html
<script id="thread" type="application/x-thread">
  this.addEventListener( "message", function ( event ) {
    var value = event.data * 1;
    this.postMessage( value * value );
  }, false );
</script>

<!-- ... -->

<script type="application/javascript">
  var thr = new Thread( document.getElementById('thread') );
</script>
```
```javascript
var thr = new Thread( "path/to/my/thread/file.js" );
```
