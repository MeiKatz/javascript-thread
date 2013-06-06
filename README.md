Thread for JavaScript
=================

```javascript
// create a new thread
thr = new Thread(function () {
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
thr.addEventListener( "message", function ( event ) {
  console.log( "error: " + event.message + " in " + event.filename + " on line " + event.lineno );
}, false );

// kill a thread
thr.kill();
// or
Thread.kill( thr );

// get state of a thread
// -- thread is running: true
// -- thread terminated: false
// -- thread terminated after an error: null
thr.state;

```
