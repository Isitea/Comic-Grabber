"use strict";
Object.defineProperties( Object.prototype, {
    readProperty: {
        value: function ( propertyChain = "" ) {
            let value = this;
            for ( let prop of propertyChain.split( "." ) ) {
                if ( prop in value ) value = value[prop];
            }
            return value;
        }
    }
} );
Object.defineProperties( Array.prototype, {
    toNodeList: {
        /**
         * Converts Array object to NodeList object
         * @returns {NodeList}
         */
        value: function () {
            let nodelist;
            {
                class NodeList extends Array {
                    constructor ( array ) {
                        super( array.filter( item => item instanceof Node ) );
                    }
                }
                nodelist = new NodeList( this );
            }
            Object.setPrototypeOf( nodelist, NodeList.prototype );
        
            return nodelist;
        }
    }
} );
Object.defineProperties( String.prototype, {
    toFilename: {
        value: function () {
            let decoder = document.createElement( "div" );
            decoder.innerHTML = this;

            return decoder.textContent
                .replace( /\.\.+/g, "⋯" )
                .replace( /!+/g, "！" )
                .replace( /\?+/g, "？" )
                .replace( /\/+/g, "／" )
                .replace( /\\+/g, "＼" )
                .replace( /:+/g, "：" )
                .replace( /~+/g, "∼" )
                .replace( /<+/g, "＜" )
                .replace( />+/g, "＞" )
                .replace( /\|+/g, "｜" )
                .replace( /(！？)+！?/g, "⁉" )
                .replace( /？⁉|(？！)+/g, "⁈" )
                .replace( /[\r\n\s]+/g, " " )
                .replace( /\u200b+/g, "" )
                .replace( /^[.\s]*|[.\s]*$/g, "" )
        }
    }
} );
