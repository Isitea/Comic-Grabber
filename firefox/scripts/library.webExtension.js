"use strict";
class CommunicationTunnel {
    /**
     * @param {*} client - Browser specific global object like 'chrome' in Chrome or 'browser' in Firefox.
     */
    constructor () {
        Object.defineProperties( this, {
            listener: { value: [] },
        } );
        window.addEventListener(
            "message",
            ( { source, data: { type, event } = {} } ) => {
                if ( source !== window ) return null;
                this.listener
                    .filter( listener => listener.type === type )
                    .forEach( ( { listener } ) => listener( event ) );
            }
        );
    }

    /**
     * Post message to content script using Window.postMessage.
     * @param {String} type - Event type
     * @param {Object} event - Transferable data
     */
    broadcast ( type, event ) {
        return window.postMessage( { type, event }, "*" );
    }

    /**
     * Add event handler.
     * @param {String} type 
     * @param {Function} listener 
     */
    addListener ( type, listener ) {
        if ( this.listener.findIndex( event => event.fn === listener ) > -1 ) return false;
        return this.listener.push( { type, listener } );
    }

    /**
     * Remove event handler.
     * @param {Function} listener 
     */
    removeListener ( listener ) {
        let removed = [];
        while ( this.listener.findIndex( event => event.fn === listener ) > -1 ) {
            removed.push( this.listener.splice( this.listener.findIndex( event => event.fn === listener ), 1 ) );
        }
        return removed;
    }
}

export { CommunicationTunnel };