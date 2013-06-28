/**
 * @author      Gregor Mitzka (gregor.mitzka@gmail.com)
 * @version     0.3.7
 * @date        2013-06-28
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

    // minimize code
    function minimize ( code ) {
        // segments are needed because otherwise it is impossible to differ code in parantheses from those outside of them
        var segments = [],
            key;
        // collect all code segments. a new one starts after each keyword
        code.replace( /("(\\\\|\\"|[^"])*")|('(\\\\|\\'|[^'])*')|(\/(\\\\|\\\/|[^\/])+\/[ig]*)|([^"'\/]*)/g, function() {
            // code without parantheses
            if ( arguments[ 7 ] != null ) {
                // does five things:
                // 1. replace tabs and spaces between a keyword and the following statement
                // 2. remove spaces, tabs and line breaks (not listed below, I think you know why)
                // 3. remove semi-colons before a }
                // 4. convert true to !0 and false to !1
                // 5. everything else
                return arguments[ 7 ].replace( /((return|var|case|delete|in|typeof|void|function)[ \r\n\t]+)|([ \r\n\t]+)|(;[ \n\r\t]*\})|(true|false)|(.)/g, function() {
                    // 1. case
                    if ( arguments[ 2 ] ) {
                        segments.push( arguments[ 2 ] + " " );
                    // 3. case
                    } else if ( arguments[ 4 ]) {
                        segments.push( ( segments.pop() || "" ) + "}" );
                    // 4. case
                    } else if ( arguments[ 5 ] ) {
                        segments.push( ( segments.pop() || "" ) + ( arguments[ 5 ] === "true"  ? "!0" : "!1" ) );
                    // 5. case
                    } else if ( arguments[ 6 ] ) {
                        segments.push( ( segments.pop() || "" ) + arguments[ 6 ] );
                    }
                });
            // code with parantheses
            } else {
                segments.push( ( segments.pop() || "" ) + arguments[ 0 ] );
            }
        });
        
        // iterate over all segments and look for return/function/case/void at the beginning of a segment
        for ( key in segments ) {
            // sometimes a return/case/function/void statement is not followed by a alphanumeric char,
            // so we can remove the left space between return/case/function/void and its following statement
            segments[ key ] = segments[ key ].replace( /^(return|function|case|void) ([^a-zA-Z0-9_])/g, "$1$2" );
        }
        
        // join all segments and return them. the result is minimized code
        // (variables are not renamed and control structures are not rewritten)
        return segments.join( "" );
    }

    //
    // @param   (string) message: error message
    //
    function ThreadError ( message ) {
        this.message = message || "unknown error";
    }
    
    ThreadError.prototype.toString = function() {
        return "ThreadError: " + this.message;
    };

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
        "each": function ( callback ) {
            if ( typeof callback !== "function" ) {
                throw new ThreadError( "could not iterate over threads, passed argument is not a function" );
            }

            var id;

            for ( id in groups ) {
                if ( groups[ id ] === this.__props__.group_id ) {
                    callback.call( threads[ id ], id, threads[ id ] );
                }
            }
        },

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
            return true;
        },

        //
        // stops all threads in this group (-> Thread.stop)
        //
        "stop": function() {
            this.each(function() {
                this.stop();
            });
            return true;
        },

        //
        // sends data to all threads in this group (-> Thread.send)
        //
        "send": function ( data, progress, finished ) {
            this.each(function() {
                this.send( data, progress, finished );
            });
        },

        "filter": function ( callback ) {
            callback = callback || function() {
                return ( this.status === Thread.RUNNING || this.status === Thread.WAITING );
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
            var ret = [];

            this.each(function() {
                ret.push( this );
            });

            return ret;
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
        },

        "threads": {
            "get": function() {
                var id,
                    list = {};

                for ( id in groups ) {
                    if ( groups[ id ] === this.__props__.group_id ) {
                        list[ id ] = threads[ id ];
                    }
                }
            }
        }
    });

    // create the default thread group
    ThreadGroup.Default = new ThreadGroup();
    ThreadGroup.Default.remove = function() {
      throw new ThreadError( "you cannot remove anything from the default thread group" );
    };

    //
    // @param   (array|function)    require: an array of required scripts for the thread,
    //                                  or in case callback is not defined a callback function
    // @param   (function)          callback: callback function
    //
    function Thread ( require, callback ) {
        this.__props__ = {};

        // check if all necessary objects and functions are defined
        if ( !Thread.isSupported ) {
            throw new ThreadError( "could not create thread, not all necessary dependencies are defined" );
        }

        callback = ( typeof require === "function" ) ? require : callback;
        require  = ( require instanceof Array )      ? require : [];

        this.__props__.thread_id = ( "thread#" + ( new Date() ).valueOf() );
        this.__props__.callback  = callback;

        // incorrect value for passed arguments
        if ( typeof callback !== "function" ) {
            throw new ThreadError( "could not create thread, passed argument is not a function" );            
        }

        var code = callback.toString();

        // code must not be empty (credits to ComFreek <https://github.com/ComFreek> for the idea for this fix)
        if ( !code.substring( code.indexOf( "{" ) + 1, code.lastIndexOf( "}" ) ).replace( /[\t\n\r ]/, "" ) ) {
            throw new ThreadError( "could not create thread, script does not contain any commands" );
        }

        // minimize code
        code = minimize( code );
        
        // build the thread source code
        code = [
            "this.addEventListener(\"message\",function(e){",
                "var t=e.target,s=this;",
                "delete t.onmessage;delete t.onerror;delete t.self;",
                "t.send=function(d){",
                    "s.postMessage([!1,d])",
                "};",
                "t.import=function(f){",
                    "s.importScripts(f)",
                "};",
                "t.threadId=\"", this.__props__.thread_id, "\";",
                "var r=(" + code + ").call(t,e.data);",
                "this.postMessage([!0,r])",
            "},!1);"
        ].join( "" );

        // add required scripts at the top of the thread script
        if ( require.length > 0 ) {
            var local = [],
                files = [],
                key;

            for ( key in require ) {
                if ( typeof require[ key ] === "string" ) {
                    files.push( require[ key ] );
                } else if ( typeof require[ key ] === "function" && /^function[ ]+\w+/.test( require[ key ].toString() ) ) {
                    local.push( minimize( require[ key ].toString() ) );
                } else {
                    throw new ThreadError( "could not load required script or function, one of the passed values is neither a string nor a named function" );
                }
            }

            if ( local.length > 0 ) {
                code = local.join( ";" ) + ";" + code;
            }

            if ( files.length > 0 ) {
                code = "importScripts(\"" + files.join( "\",\"" ) + "\");" + code;
            }
        }

        // create url for the blob object
        var url  = window.URL.createObjectURL( new Blob( [ code ], { "type": "application/javascript" } ) );

        this.__props__.worker = new Worker( url );
        this.__props__.url    = url;
        this.__props__.status = Thread.WAITING;
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
        // thanks to <http://github.com/ComFreek> for the inspiration of the changes made in version 0.3.5
        // sends data to the thread
        // @param   (mixed)     data: data for the thread
        // @param   (function)  progress: function that gets called in progress, takes the data as the first, and the status as the second parameter;
        //                          if <finished> is not defined <progress> gets also called on finish
        // @param   (function)  finished: function that gets called on finish, takes the data as the first, and the status as the second parameter
        //
        "send": function ( data, progress, finished ) {
            if ( this.__props__.status !== Thread.RUNNING && this.__props__.status !== Thread.WAITING ) {
                return false;
            }

            if ( typeof data === "function" ) {
                finished = progress;
                progress = data;
                data     = undefined;
            }

            this.__props__.status = Thread.RUNNING;

            var thread = this,
                worker = this.__props__.worker;

            if ( typeof progress === "function" ) {
                finished = ( finished == null ) ? progress : finished;

                var callback = function ( e ) {
                    if ( e.data[ 0 ] ) {
                        thread.__props__.status = Thread.WAITING;
                        finished.call( thread, e.data[ 1 ], Thread.WAITING );
                        worker.removeEventListener( "message", callback, false );
                    } else {
                        progress.call( thread, e.data[ 1 ], Thread.RUNNING );
                    }
                };
                worker.addEventListener( "message", callback, false);
            }

            worker.postMessage( data );
        },

        "stop": function() {
            if ( this.__props__.status !== Thread.RUNNING ) {
                return null;
            }

            var thread = this;
            this.__props__.status = Thread.WAITING;
            this.__props__.worker.terminate();
            this.__props__.worker = new Worker( this.__props__.url );
            this.__props__.worker.addEventListener( "error", function ( e ) {
                thread.kill();
                thread.__props__.status = Thread.ERROR;
                throw new ThreadError( "thread terminated in " + e.filename + " on line " + e.lineno + " with the following message: " + e.message );
            }, false);
            return true;
        },

        //
        // kill the thread
        //
        "kill": function() {
            if ( this.__props__.status !== Thread.RUNNING && this.__props__.status !== Thread.WAITING ) {
                return null;
            }

            this.__props__.worker.terminate();
            window.URL.revokeObjectURL( this.__props__.url );
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
        // returns true if status is .WAITING
        "waiting": {
            "get": function() {
                return ( this.__props__.status === Thread.WAITING );
            }
        },
        // returns true if status is .TERMINATED or .ERROR
        "terminated": {
            "get": function() {
                return ( this.__props__.status === Thread.TERMINATED || this.__props__.status === Thread.ERROR );
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
    Thread.WAITING    = 2;
    Thread.TERMINATED = 3;
    Thread.ERROR      = 4;

    Thread.version = "0.3.7";

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

    Thread.stop = function ( thread ) {
        if ( thread instanceof Thread || thread instanceof ThreadGroup ) {
            return thread.stop();
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
