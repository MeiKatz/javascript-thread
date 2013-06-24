Reference
=================
Thread
-----------------
```javascript
//
// constants
//

// ERROR
Thread.ERROR;

// RUNNING
Thread.RUNNING;

// TERMINATED
Thread.TERMINATED;

//
// properties
//

// group_id (string)
thr.group_id;

// id (string)
thr.id;

// isSupported (bool)
Thread.isSupported;

// running (bool)
thr.running;

// status (int)
thr.status;

// terminated (bool)
thr.terminated;

// version (string)
thr.version;

//
// methods
//

// constructor( callback )
// @param   (function)  callback: callback function
new Thread( callback );

// kill()
thr.kill();
// kill( thread )
// @param   (object)    thread: instance of Thread
Thread.kill( thread );

// send( data, success )
// @param   (mixed)     data: a value for passing to the thread
// @param   (function)  success: callback function, gets called on success
thr.send( data, success );

// toString()
// returns "[object Thread]"
thr.toString();

// valueOf()
// returns the callback function that were passed to the constructor of Thread
thr.valueOf();
```
ThreadGroup
-----------------
```javascript
//
// properties
//

// Default
ThreadGroup.Default;

// id (string)
tgrp.id;

// length (int)
tgrp.length;

//
// methods
//

// constructor()
var tgrp = new ThreadGroup;
// constructor( thread )
// @param   (object)    thread: instance of thread
var tgrp = new ThreadGroup( thr );
// constructor([ thr1, thr2, thr3, ..., thrN ])
// @param   (array)     thread: array of threads
var tgrp = new ThreadGroup([ thr, thr2 ]);

// add( thread )
// @param   (object)    thread: instance of thread
tgrp.add( thr );
// add([ thr1, thr2, thr3, ..., thrN ])
// @param   (array)     thread: array of threads
tgrp.add([ thr, thr2 ]);

```
