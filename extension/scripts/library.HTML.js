"use strict";
Object.defineProperties( Node.prototype, {
    appendChildren: {
        /**
         * @description Extends Node object for multi appending child node.
         * @param {NodeList} children - Nodes which are append to the target.
         * @returns {void}
         */
        value: function ( children ) {
            if ( children instanceof NodeList ) {
                for ( let item of [ ...children ] ) this.appendChild( item );
            } else {
                throw new TypeError( "Passed parameter on method appendChildren under Node must be a NodeList." );
            }
            return this;
        }
    }
} );
Object.defineProperties( Image.prototype, {
    fetchUri: {
        /**
         * @description Implants fetchUri method on Image object. The fetch method is an async function which retruns Promise object.
         * @param {String} uri - Image uri
         * @return {Promise} - Promise object which represents Blob of the loaded image.
         * 
         * @property {Promise<Blob>} binaryData - This property is Promise object which represents Blob of the loaded image when the image is successfully fetched.
         * 
         * @event Image#ProgressEvent:progress
         * @type {Object}
         * @property {Boolean} lengthComputable - Indicate whether is it available to show the target size.
         * @property {Number} total - The target size as bits. 0 when the target size is unknown.
         * @property {Number} loaded - Received target size as bits.
         */
        set: async function ( uri ) {
            let binaryData;
            Object.defineProperties( this, {
                binaryData: { value: new Promise( resolve => binaryData = resolve ), writable: false, configurable: true },
                fetchUri: { get: () => uri },
            } );
            const response = await fetch( uri.replace( /^https?:/i, "" ) );
            const contentType = response.headers.get( 'Content-Type' );
            let total = Number( response.headers.get( 'Content-Length' ) );
            const reader = await response.body.getReader();
            let loaded = new Uint8Array( total ), cursor = 0;
            do {
                const { done, value: bin } = await reader.read();
                if ( !bin ) break;
                if ( cursor + bin.length > total ) total = 0;
                if ( total === 0 ) {
                    let tmp = new Uint8Array( cursor + bin.length );
                    tmp.set( loaded, 0 );
                    tmp.set( bin, cursor );
                    loaded = tmp;
                }
                else loaded.set( bin, cursor );
                cursor += bin.length;
                this.dispatchEvent( new ProgressEvent( "progress", { lengthComputable: Boolean( total ), loaded: cursor, total } ) );
                if ( done ) break;
            } while ( cursor < total || total === 0 );
            reader.releaseLock();

            let blob = new Blob( [ loaded ], { type: await recognizeByFileSignature( loaded, contentType ) } );
            this.src = URL.createObjectURL( blob );
            this.addEventListener( "load", () => {
                this.dispatchEvent( new ProgressEvent( "progress", { lengthComputable: Boolean( total ), loaded: blob.size, total: blob.size } ) );
                URL.revokeObjectURL( this.src );
            }, { once: true } );
            binaryData( blob );

            return blob;
        }
    }
} );

/**
 * @description DOM creation helper. It has static method only.
 * @typedef {String} propertyName - Property name of HTMLElement object.
 * @typedef {String} tagName - Tag name for creation of HTMLElement object.
 * @typedef {{ propertyName: (String|Number), _child: (Array<Node|HTMLStructure>|NodeList), _todo: (Function|Array<Function>) }} HTMLProperties
 * @typedef {{ tagName: (HTMLProperties) }} HTMLStructure
 * @typedef {{ tagName: Function}} HTMLPreset
 */
class HTML {
    /**
     * Create HTMLElement as passed HTMLStructure object
     * @param {HTMLStructure} structure
     * @param {HTMLPreset} preset
     * @returns {NodeList} Rendered DOM structure as NodeList
     */
    static render ( structure, preset = {} ) {
        if ( structure instanceof NodeList ) return structure;
        let fragment = document.createDocumentFragment();
        if ( structure instanceof Node ) { fragment.appendChild( structure ); }
        else if ( structure instanceof Object ) {
            let list;
            if ( !( structure instanceof Array ) ) { list = [ structure ]; }
            else { list = [ ...structure ]; }
            for ( const item of list ) {
                let node;
                if ( item instanceof Node ) { node = item; }
                else if ( typeof item === "string" ) { node = document.createTextNode( item ); }
                else if ( !( item instanceof Array ) && item instanceof Object ) {
                    const [[ name, attributes ]] = Object.entries( item );
                    if ( !( attributes._todo instanceof Array ) ) {
                        if ( attributes._todo instanceof Function ) attributes._todo = [ attributes._todo ];
                        else attributes._todo = [];
                    }
                    if ( name in preset ) {
                        attributes._todo.unshift( preset[name] );
                    }
                    node = this.setProperties( document.createElement( name ), attributes );
                }
                if ( node ) fragment.appendChild( node );
            }
        }

        return fragment.childNodes;
    }

    /**
     * Set properties on passed Node object
     * @param {Node} node
     * @param {HTMLProperties} properties 
     * @returns {Node} Same as passed and it has properties.
     */
    static setProperties ( node, properties ) {
        const children = this.render( properties._child );
        for ( const [ key, value ] of Object.entries( properties ) ) {
            switch ( key ) {
                case "_child":
                case "_todo": {
                    break;
                }
                case "Listeners": {
                    for ( const { type, listener, options } of value ) { node.addEventListener( type, listener, options || {} ); }
                    break;
                }
                case "dataset": {
                    Object.assign( node.dataset, value );
                    break;
                }
                case "style": {
                    node.style.cssText = value;
                    break;
                }
                default: {
                    node[ key ] = value;
                }
            }
        }
        if ( children.length ) { node.appendChildren( children ); }

        return ( properties._todo || [] ).reduce( ( node, fn ) => ( fn instanceof Function ? fn( node ) : node ) , node );
    }

    /**
     * Remove Node from its parent node.
     * @param {Node} node - Node which will be removed.
     * @param {Boolean} uncover - When it is true, replace the target node with its child nodes before removing the target.
     * @returns {Node} Removed node.
     */
    static remove ( node, uncover = false ) {
        if ( !node.parentNode ) return null;
        if ( uncover ) {
            for ( let item of [ ...node.parentNode.childNodes ] ) {
                if ( item === node ) { node.parentNode.appendChildren( node.childNodes ); }
                else { node.parentNode.appendChild( item ); }
            }
        }
        return node.parentNode.removeChild( node );
    }
}

/**
 * Recognize file type based on magic number
 * @param {ArrayBuffer} arraybuffer 
 */
async function recognizeByFileSignature ( arraybuffer, contentType ) {
    //File signature information ( https://en.wikipedia.org/wiki/List_of_file_signatures )
    //File signature information ( http://forensic-proof.com/archives/300 )
    //File signature information ( https://www.filesignatures.net/ )
    const signatures = {
        "image/png": [ "89504e470D0a1a0a" ],
        "image/jpeg": [ "ffd8ffe[0-9]" ],
        "image/gif": [ "47494638" ],
        "image/tiff": [ "49492a00", "4d4d002[ab]", "492049" ],
        "image/bmp": [ "424d" ],
        "image/webp": [ "52494646[0-9a-f]{6,6}57454250" ],
    };
    //Read signature from binary
    const binSign = ( new Uint8Array( arraybuffer.slice( 0, 24 ) ) ).reduce( ( hex, bin ) => hex + bin.toString( 16 ).padStart( 2, "0" ), "" );
    //Compare signatures
    for ( const [ category, sign ] of Object.entries( signatures ) ) {
        if ( binSign.match( new RegExp( `^${sign.join( "|^" )}` ) ) ) return category;
    }
    //When none of the heading signatures was matched.
    console.log( `Unknown file header: ${binSign}` );
    return contentType || "application/octet-strem";
}

export { HTML, recognizeByFileSignature };
