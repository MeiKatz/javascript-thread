/**
 * @author      Gregor Mitzka (gregor.mitzka@gmail.com)
 * @version     0.2.8
 * @date        2013-06-24
 * @licence     beer ware licence
 * ----------------------------------------------------------------------------
 * "THE BEER-WARE LICENSE" (Revision 42):
 * <gregor.mitzka@gmail.com> wrote this file. As long as you retain this notice you
 * can do whatever you want with this stuff. If we meet some day, and you think
 * this stuff is worth it, you can buy me a beer in return Gregor Mitzka
 * ----------------------------------------------------------------------------
 */
define(function ( require, exports, module ) {
    "use strict";

    //
    // @param   (string) message: error message
    //
    function ThreadError ( message ) {
        message = message || "unknown error";

        this.toString = function() {
            return "ThreadError: " + message;
        };
    }

    var groups  = {},
        threads = {};

    //
    // creates a group of threads
    // @param   (array) thread: a thread or an array of threads (-> add)
    //
    function ThreadGroup ( thread ) {
        this.__props__ = {};
        this.__props__.group_id = ( "group#" + ( new Date() ).valueOf() );
        
        if ( thread != null ) {
            this.add( thread );
        }
    }

    ThreadGroup.prototype = {
        //
        // adds all passed threads to this group
        // @param   (array|thread)  thread: a thread or an array of threads
        //
        "add": function ( thread ) {
            if ( thread instanceof Array && thread.length > 0 ) {
                var i;
                for ( i in thread ) {
                    this.add( thread[ i ] );
                }

                return true;
            } else if ( !( thread instanceof Thread ) ) {
                throw new ThreadError( "could not add thread, passed argument is not a thread" );
            }

            if ( !threads[ thread.id ] ) {
                threads[ thread.id ] = thread;
            }

            groups[ thread.id ] = this.__props__.group_id;
            return true;
        },

        //
        // removes all passed threads from this group
        // @param   (array|thread)  thread: a thread or an array of threads
        //
        "remove": function ( thread ) {
            if ( thread instanceof Array && thread.length > 0 ) {
                var i;
                for ( i in thread ) {
                    this.remove( thread[ i ] );
                }

                return true;
            } else if ( !( thread instanceof Thread ) ) {
                throw new ThreadError( "could not remove thread, passed argument is not a thread" );
            }

            groups[ thread.id ] = ThreadGroup.Default.id;
            return true;
        },
        
        //
        // returns true if this group contains all passed threads
        // @param   (array|thread)  thread: a thread or an array of threads
        //
        "has": function ( thread ) {
            if ( thread instanceof Array && thread.length > 0 ) {
                var i;
                for ( i in thread ) {
                    if ( !this.has( thread[ i ] ) ) {
                        return false;
                    }   
                }

                return true;
            } else if ( !( thread instanceof Thread ) ) {
                throw new ThreadError( "could not check thread, passed argument is not a thread" );
            }

            return ( groups[ thread.id ] === this.__props__.group_id );
        },

        //
        // kills all threads in this group (-> Thread.kill)
        //
        "kill": function() {
            this.each(function() {
               this.kill(); 
            });
        },

        //
        // sends data to all threads in this group (-> Thread.send)
        //
        "send": function ( data, success ) {
            var id;

            for ( id in groups ) {
                if ( groups[ id ] === this.__props__.group_id ) {
                    threads[ id ].send( data, success );
                }
            }
        },

        "each": function ( callback ) {
            if ( typeof callback !== "function" ) {
                throw new ThreadError( "could not filter threads, passed argument is not a function" );
            }

            var id;

            for ( id in groups ) {
                if ( groups[ id ] === this.__props__.group_id ) {
                    callback.call( threads[ id ], id, threads[ id ] );
                }
            }
        },

        "filter": function ( callback ) {
            callback = callback || function() {
                return ( this.status === Thread.RUNNING );
            };
            
            var filtered = [];

            this.each(function ( id ) {
                if ( !callback.call( this, id, this ) ) {
                    ThreadGroup.Default.add( this );
                    filtered.push( this );
                }
            });

            return filtered;
        },

        "toString": function() {
            return "[object ThreadGroup]";
        },
        
        "valueOf": function() {
            var id,
                list = [];

            for ( id in groups ) {
                if ( groups[ id ] === this.__props__.group_id ) {
                    list.push( threads[ id ] );
                }
            }

            return list;
        }
    };

    Object.defineProperties( ThreadGroup.prototype, {
        // returns the id of this thread group
        "id": {
            "get": function() {
                return this.__props__.group_id;
            }
        },
        // returns the number of threads in this group
        "length": {
            "get": function() {
                var id,
                    length = 0;
                for ( id in groups ) {
                    if ( groups[ id ] === this.__props__.group_id ) {
                        ++length;
                    }
                }

                return length;
            }
        }
    });

    // create the default thread group
    ThreadGroup.Default = new ThreadGroup();
    ThreadGroup.Default.remove = function() {
      throw new ThreadError( "you cannot remove anything from the default thread group" );
    };

    //
    // @param   (mixed) callback: function
    //
    function Thread ( callback ) {
        this.__props__ = {};

        // check if all necessary objects and functions are defined
        if ( !Thread.isSupported ) {
            throw new ThreadError( "could not create thread, not all necessary dependencies are defined" );
        }

        this.__props__.thread_id = ( "thread#" + ( new Date() ).valueOf() );
        this.__props__.callback  = callback;
        
        // callback is a function
        if ( typeof callback === "function" ) {
            var code = callback.toString().match( /^function\s*\([^\)]*\)\s*\{\s*((\S|\s)*\S)\s*\}$/ );

            // code must not be empty
            if ( code == null ) {
                throw new ThreadError( "could not create thread, script does not contain any commands" );
            }

            code = [
                "this.addEventListener( \"message\", function ( e ) {",
                    "var ret = (" + code[ 0 ] + ").call( e.target, e.data );",
                    "this.postMessage( ret );",
                "}, false);"
            ].join( "" );

            // create url for the blob object
            var url  = window.URL.createObjectURL( new Blob( [ code ], { "type": "application/javascript" } ) );
        // incorrect value for passed argument
        } else {
            throw new ThreadError( "could not create thread, passed argument is not a function" );
        }
        
        this.__props__.worker = new Worker( url );
        this.__props__.status = Thread.RUNNING;
        ThreadGroup.Default.add( this );

        var thread = this;

        this.__props__.worker.addEventListener( "error", function ( e ) {
            thread.kill();
            thread.__props__.status = Thread.ERROR;
            throw new ThreadError( "thread terminated in " + e.filename + " on line " + e.lineno + " with the following message: " + e.message );
        }, false);
    }

    Thread.prototype = {
        //
        // sends data to the thread
        // @param   (mixed)     data: data for the thread
        // @param   (function)  success: function that gets the result of the thread as the first parameter
        //
        "send": function ( data, success ) {
            if ( this.__props__.status !== Thread.RUNNING ) {
                return false;
            }

            var thread = this,
                worker = this.__props__.worker;

            if ( typeof success === "function" ) {
                var callback = function ( e ) {
                    success.call( thread, e.data );
                    worker.removeEventListener( "message", callback, false );
                };
                worker.addEventListener( "message", callback, false);
            }

            worker.postMessage( data );
        },

        //
        // kill the thread
        //
        "kill": function() {
            if ( this.__props__.status !== Thread.RUNNING ) {
                return null;
            }

            this.__props__.worker.terminate();
            window.URL.revokeObjectURL( url );
            this.__props__.status = Thread.TERMINATED;
            return true;
        },

        "toString": function() {
            return "[object Thread]";
        },

        "valueOf": function() {
            return this.__props__.callback;
        }
    };

    Object.defineProperties( Thread.prototype, {
        // returns the current status of the thread: running, terminated, or terminated with error (-> constants)
        "status": {
            "get": function() {
                return this.__props__.status;
            }
        },
        // returns true if status is .RUNNING
        "running": {
            "get": function() {
                return ( this.__props__.status === Thread.RUNNING );
            }
        },
        // returns true if status is .TERMINATED or .ERROR
        "terminated": {
            "get": function() {
                return ( this.__props__.status !== Thread.RUNNING );
            }
        },
        // id of this thread
        "id": {
            "get": function() {
                return this.__props__.thread_id;
            }
        },
        // group id of the thread group that contains this thread
        "group_id": {
            "get": function() {
                return groups[ this.__props__.thread_id ];
            }
        }
    });

    Thread.RUNNING    = 1;
    Thread.TERMINATED = 2;
    Thread.ERROR      = 3;

    Thread.version = "0.2.8";

    //
    // @param   (object) thread: instance of Thread or ThreadGroup
    //
    Thread.kill = function ( thread ) {
        if ( thread instanceof Thread || thread instanceof ThreadGroup ) {
            return thread.kill();
        } else {
            return false;
        }
    };

    Thread.isSupported = !!(
        window.URL                  &&
        window.URL.createObjectURL  &&
        window.URL.revokeObjectURL  &&
        window.Blob                 &&
        window.Worker
    );

    exports.Thread      = Thread;
    exports.ThreadError = ThreadError;
    exports.ThreadGroup = ThreadGroup;
});
