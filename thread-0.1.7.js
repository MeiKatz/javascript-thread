/**
 * @author      Gregor Mitzka (gregor.mitzka@gmail.com)
 * @version     0.2.1
 * @date        2013-06-18
 * @licence     beer ware licence
 * ----------------------------------------------------------------------------
 * "THE BEER-WARE LICENSE" (Revision 42):
 * <gregor.mitzka@gmail.com> wrote this file. As long as you retain this notice you
 * can do whatever you want with this stuff. If we meet some day, and you think
 * this stuff is worth it, you can buy me a beer in return Gregor Mitzka
 * ----------------------------------------------------------------------------
 */
(function() {
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

    function ThreadGroup() {
        var group_id = ( "group#" + (new Date).valueOf() );

        this.id = function() {
            return group_id;
        };

        this.add = function ( thread ) {
            if ( !( thread instanceof Thread ) ) {
                throw new ThreadError( "could not add thread, passed argument is not a thread" );
            }

            threads[ thread.id ] || ( threads[ thread.id ] = thread );
            groups[ thread.id ] = group_id;
        };

        this.remove = function ( thread ) {
            if ( !( thread instanceof Thread ) ) {
                throw new ThreadError( "could not remove thread, passed argument is not a thread" );
            }

            groups[ thread.id ] = ThreadGroup.Default.id;
        };

        this.has = function ( thread ) {
            if ( !( thread instanceof Thread ) ) {
                throw new ThreadError( "could not check thread, passed argument is not a thread" );
            }

            return ( groups[ thread.id ] === group_id );
        };
        
        this.length = function() {
            var id,
                length = 0;
            for ( id in groups ) {
                ( groups[ id ] === group_id ) && ( ++length );
            }
            
            return length;
        };

        this.kill = function() {
            var id;

            for ( id in groups ) {
                ( groups[ id ] === group_id ) && threads[ id ].kill();
            }
        };

        this.send = function ( data, success ) {
            var id;

            for ( id in groups ) {
                ( groups[ id ] === group_id ) && threads[ id ].send( data, success );
            }
        };

        Object.defineProperties( this, {
            "id": {
                "get": this.id
            },
            
            "length": {
                "get": this.length
            }
        });
    }

    ThreadGroup.Default = new ThreadGroup;

    //
    // @param   (mixed) callback: function, string or instance of HTMLElement
    //
    function Thread ( callback ) {
        var thread    = this,
            thread_id = ( "thread#" + (new Date).valueOf() );

        // check if all necessary objects and functions are defined
        if ( !Thread.isSupported ) {
            throw new ThreadError( "could not create thread, not all necessary dependencies are defined" );
        }

        // callback is either a function or a script element
        if ( typeof callback === "function" || callback instanceof HTMLScriptElement ) {
            // callback function
            if ( typeof callback === "function" ) {
                var code = callback.toString();
            // script element
            } else {
                var code = callback.textContent;
            }

            var source = code.match( /^function\s*\([^\)]*\)\s*\{\s*((\S|\s)*\S)\s*\}$/ );

            // code must not be empty
            if ( source == null || source[ 1 ] === "" ) {
                throw new ThreadError( "could not create thread, script does not contain any commands or has an invalid structure" );
            }

            source = [
                "this.addEventListener( \"message\", function ( e ) {", "\n\t",
                    "var ret = (" + source[ 0 ] + ").call( e.target, e.data );", "\n\t",
                    "this.postMessage( ret );", "\n",
                "}, false);"
            ].join( "" );

            // create url for the blob object
            var url  = window.URL.createObjectURL( new Blob( [ source ], { "type": "application/javascript" } ) );
        // file name
        } else if ( typeof callback === "string" ) {
            // determine file name of string
            callback = callback.match( /\S+/ );

            // no file name could be determined
            if ( !callback ) {
                throw new ThreadError( "could not create thread, passed argument does not contain any file name" );
            }

            // set url
            var url = callback[ 0 ];
        // incorrect value for passed argument
        } else {
            throw new ThreadError( "could not create thread, passed argument is neither a function nor a script element nor a file uri" );
        }

        var worker = new Worker( url );
        var status = Thread.RUNNING;
        ThreadGroup.Default.add( this );

        worker.addEventListener( "error", function ( e ) {
            thread.kill();
            status = Thread.ERROR;
            throw new ThreadError( "thread terminated in " + e.filename + " on line " + e.lineno + " with the following message: " + e.message );
        }, false);

        this.send = function ( data, success ) {
            if ( status !== Thread.RUNNING ) {
                return false;
            }

            if ( typeof success === "function" ) {
                worker.addEventListener( "message", function ( e ) {
                    success.call( thread, e.data );
                    worker.removeEventListener( this );
                }, false);
            }

            worker.postMessage( data );
        };

        this.status = function() {
            return status;
        };

        this.id = function() {
            return thread_id;
        };

        this.kill = function() {
            if ( status !== Thread.RUNNING ) {
                return null;
            }

            worker.terminate();
            window.URL.revokeObjectURL( url );
            status = Thread.TERMINATED;
            return true;
        };

        Object.defineProperties( this, {
            "status": {
                "get": this.status
            },

            "running": {
                "get": function() {
                    return ( this.status === Thread.RUNNING );
                }
            },

            "terminated": {
                "get": function() {
                    return ( this.status !== Thread.RUNNING );
                }
            },

            "id": {
                "get": this.id
            },
            
            "group_id": {
                "get": function() {
                    return groups[ this.id ];
                }
            }
        });
    }

    Thread.RUNNING    = 1;
    Thread.TERMINATED = 2;
    Thread.ERROR      = 3;

    //
    // @param   (object) thread: instance of Thread
    //
    Thread.kill = function ( thread ) {
        if ( thread instanceof Thread ) {
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
    
    window.Thread      = Thread;
    window.ThreadError = ThreadError;
    window.ThreadGroup = ThreadGroup;
})();
