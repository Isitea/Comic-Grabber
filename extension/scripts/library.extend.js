"use strict";
Object.defineProperties( Object.prototype, {
    readProperty: {
        /**
         * Follow propertyChain and return value. But when there is no matched property name, it is ignored.
         * @example
         * // returns document.body.innerHTML
         * document.readProperty( "body.innerHTML" );
         * @example
         * // returns document.body.childNodes
         * document.readProperty( ".body.childNodes" );
         * @example
         * // returns document.body.innerHTML
         * document.readProperty( "body.innerHTML.IGNORED" );
         * @example
         * // returns document.body.childNodes
         * document.readProperty( ".body.IGNORED.childNodes" );
         * @param {String} propertyChain 
         * @returns {*}
         */
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
         * Converts Array object to NodeList object with filter.
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
        /**
         * Escape characters in String object for FileSystem
         * @returns {String}
         */
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
