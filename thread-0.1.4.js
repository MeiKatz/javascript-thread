/**
 * @author      Gregor Mitzka (gregor.mitzka@gmail.com)
 * @version     0.1.4
 * @date        2013-08-06
 * @licence     beer ware licence
 * ----------------------------------------------------------------------------
 * "THE BEER-WARE LICENSE" (Revision 42):
 * <gregor.mitzka@gmail.com> wrote this file. As long as you retain this notice you
 * can do whatever you want with this stuff. If we meet some day, and you think
 * this stuff is worth it, you can buy me a beer in return Gregor Mitzka
 * ----------------------------------------------------------------------------
 */
(function () {
    //
    // @param   (mixed) callback: function, string or instance of HTMLElement
    //
    Thread = function ( callback ) {
        // callback is either a function or a script element
        if ( typeof callback === "function" || callback instanceof HTMLScriptElement ) {
            // callback function
            if ( typeof callback === "function" ) {
                var code = callback.toString().match( /^function\s*\([^\)]*\)\s*\{\s*((\S|\s)*\S)\s*\}$/ )[ 1 ];
            // script element
            } else {
                var code = callback.textContent.match( /^\s*(.+)\s*$/ )[ 1 ];
            }

            // code must not be empty
            if ( code === "" ) {
                throw new ThreadError( "could not create thread, script does not contain any commands" );
            }

            // create url for the blob object
            var url  = window.URL.createObjectURL( new Blob( [ code ], { "type": "application/javascript" } ) );
            delete code;
        // file namem
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
            throw new ThreadError( "could not create thread, passed argument is neither a function nor a script element nor a file" );
        }

        // status:
        // -- true: worker is running
        // -- false: worker terminated
        // -- null: worker terminated with an error
        var status = true;
        var worker = new Worker( url );

        worker.addEventListener( "error", function ( e ) {
            // terminate worker
            worker.terminate();
            // remove blob objects
            window.URL.revokeObjectURL( url );
            status = null;
        }, false );

        this.getStatus = function() {
            return status;
        };

        this.kill = function() {
            if ( status ) {
                worker.terminate();
                window.URL.revokeObjectURL( url );
                status = false;
                return true;
            } else {
                return null;
            }
        };

        this.postMessage = function ( message ) {
            if ( status ) {
                worker.postMessage( message );
            }
        };

        this.addEventListener = function ( type, listener, useCapture ) {
            if ( status ) {
                return worker.addEventListener( type, listener, useCapture );
            } else {
                return null;
            }
        };

        this.removeEventListener = function ( type, listener, useCapture ) {
            if ( status ) {
                return worker.removeEventListener( type, listener, useCapture );
            } else {
                return null;
            }
        };

        this.dispatchEvent = function ( event ) {
            if ( status ) {
                return worker.dispatchEvent( event );
            } else {
                return null;
            }
        };

        Object.defineProperty( this, "status", {
            "get": function() {
                return this.getStatus();
            }
        });

        Object.defineProperty( this, "running", {
            "get": function() {
                return (this.getStatus() === true);
            }
        });

        Object.defineProperty( this, "terminated", {
            "get": function() {
                return (this.getStatus() !== true);
            }
        });
    };

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

    //
    // @param   (string) message: error message
    //
    ThreadError = function ( message ) {
        message = message || "unknown error";
        
        this.toString = function() {
            return "ThreadError: " + message;
        };
    };
})();
