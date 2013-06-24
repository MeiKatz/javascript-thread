Thread for JavaScript
=================

New since version 0.2.7
-----------------
You cannot use a file uri or a html script element object as an argument for the constructor of Thread anymore. Now you only can use a callback function.
```javascript
var grp = new ThreadGroup([ a, b, c ]); // a, b, c are threads
// iterate over all threads in this group
grp.each(function ( id, thread ) {
  // this === thread
  // do something ...
});
// filter all terminated threads in this group
ver terminated = grp.filter();
// or via a custom filter function
ver terminated = grp.filter(function ( id, thread ) {
  // this === thread
  // all return values that are converted to "true" stay in this group,
  // everything will be kicked off
  // do something ...
});
```
Behavior since version 0.2
-----------------
###### Normal way to create a thread (since version 0.2.7 the only way)
```javascript
// is Thread supported?
if ( !Thread.isSupported ) {
  console.warn( "sorry, your browser does not support Thread" );
}

// get version of Thread
Thread.version;

// create a new thread
var thr = new Thread(function ( data ) {
  // convert value into a number
  var value = event.data * 1;
  // send the square of the number back to the main thread
  return ( value * value );
});

// send data to the thread and listen to its return value
thr.send( 5, function ( data ) {
  console.log( "the square is " + data );
});

// there may be errors. let's wrap it into a try-catch construct
try {
  thr.send( 5, function ( data ) {
    console.log( "the square is " + data );
  });
} catch ( error ) {
  // upps, there was an error
  console.error( error );
}

// get the status of a thread
switch ( thr.status ) {
  case Thread.RUNNING:
    console.log( "thread is running" );
    break;
  case Thread.TERMINATED:
    console.log( "thread has terminated" );
    break;
  case Thread.ERROR:
    console.log( "thread has terminated with an error" );
    break;
}

// get the id of an thread (should be something like "thread#{timestamp}")
thr.id;
// get the group id of an thread (should be something like "group#{timestamp}")
// and by default this is the id of ThreadGroup.Default
thr.group_id;

// kill a thread like this ..
thr.kill();
// or like this ..
Thread.kill( thr );
```
###### Thread groups
```javascript
// new thing: ThreadGroup
var grp = new ThreadGroup;

// add a thread to this group
grp.add( thr );
// check it
grp.has( thr );
// or remove it
grp.remove( thr );
// the group id of this thread is now again the id of ThreadGroup.Default
// is the same as ThreadGroup.Default.add( thr )

// get the number of threads in this group
grp.length;
// get the group id
grp.id;

// let's create another thread group
// a thread can only belong to one single thread group
// when you add it to a new group, it will be removed from its old one
var grp2 = new ThreadGroup;
grp.add( thr );
grp.has( thr ); // returns true

grp2.add( thr );
grp2.has( thr ); // returns true
grp.has( thr ); // returns false

// but what is it good for?
// well, you can kill many threads at once
var a, b, c; // threads
grp.add([ a, b, c ]);
grp.kill();
// now all threads are killed

// or you can send data to many threads at once
grp.send( 5, function ( data ) {
  this; // this is the instance of the current thread
});
```
###### other ways to create a thread (no more available since version 0.2.7)
```html
<script id="thread" type="application/x-thread">
  function ( data ) {
    var value = data * 1;
    return ( value * value );
  }
</script>

<!-- ... -->

<script type="application/javascript">
  var thr = new Thread( document.getElementById( "thread" ) );
</script>
```

```javascript
var thr = new Thread( "path/to/my/thread/file.js" );
```

###### using with require.js
```javascript
var Thread = require( "thread" ).Thread;
```

Behavior before version 0.2
-----------------
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
thr.status;

// check if Thread is supported
if ( !Thread.isSupported ) {
  console.warn( "Thread is not supported in this browser" );
}
```
###### other ways to create a thread
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
