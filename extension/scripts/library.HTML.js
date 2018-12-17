"use strict";
class HTMLExtender {
    static extend ( fnList = [] ) {
        for ( let fn of fnList ) this[fn]();
    }

   /**
    * @description Extends Node object for multi appending child node.
    * @param {NodeList} children - Nodes which are append to the target.
    * @returns {void}
    */
    static appendChildren () {
        if ( !Node.prototype.appendChildren ) {
            Node.prototype.appendChildren = function ( children ) {
                if ( children instanceof NodeList ) {
                    for ( let item of [ ...children ] ) this.appendChild( item );
                } else {
                    throw new TypeError( "Passed parameter on method appendChildren under Node must be a NodeList." );
                }
            }
        }
    }

    /**
     * @description Implants fetchUri method on Image object. The fetch method is an async function which retruns Promise object.
     * @param {String} uri - Image uri
     * @return {Promise} - Promise object which represents Blob of the loaded image.
     * 
     * @property {Blob} binaryData - This property is set when the image is successfully fetched.
     * 
     * @event Image#ProgressEvent:progress
     * @type {Object}
     * @property {Boolean} lengthComputable - Indicate whether is it available to show the target size.
     * @property {Number} total - The target size as bits. 0 when the target size is unknown.
     * @property {Number} loaded - Received target size as bits.
     */
    static fetchUri () {
        if ( !Image.prototype.fetchUri ) {
            Object.defineProperty( Image.prototype, "fetchUri", {
                set: async function ( uri ) {
                    Object.defineProperties( this, {
                        binaryData: { value: null, writable: false, configurable: true },
                    } );
                    const response = await fetch( uri.replace( /^https?:/i, "" ), { redirect: "manual" } );
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
            
                    let blob = new Blob( [ loaded ], { type: contentType || recognizeByFileSignature( loaded ) } );
                    this.src = URL.createObjectURL( blob );
                    Object.defineProperties( this, { binaryData: { value: blob } } );
                    this.addEventListener( "load", () => URL.revokeObjectURL( this.src ), { once: true } );
            
                    return blob;
                }
            } );
        }
    }
}

/**
 * DOM creation helper. It has static method only.
 * Use HTML.extend() before using other method.
 * 
 * Method setProperties ( node, attributes ) returns passed node after set properties.
 * node: Node object.
 * attributes: {
 *  propertyName: propertyValue,
 *  style: String - CSS,
 *  _child: structure or Array of structure,
 *  _todo: Function or Array of Function (Any element which is not Function object is ignored.),
 *  Listeners: [
 *      {
 *          type: eventName,
 *          listener: Function ( event ) { something to do }
 *          options: eventOptions
 *      }
 *  ]
 * }
 * 
 * Method render( structure or Array of structure [, preset ] ) returns rendered structure as NodeList.
 * structure: {
 *  tagName: attributes
 * }
 * preset: {
 *  tagName: Function ( node ) {
 *      something to do after an element node is made.
 *      return node;
 *  }
 * }
 * 
 */
class HTML {
    /**
     * Add method appendChildren on NodeList.
     * Add Progress Event on Image and make able to access on binary data of a loaded image.
     */
    static extend () {
        HTMLExtender.extend( [ 'appendChildren', 'xhrImageLoader' ] );
    }

    /**
     * 
     * @param {*} structure 
     * @param {*} preset 
     */
    static render ( structure, preset = {} ) {
        if ( Node.appendChildren === undefined ) { HTMLExtender.appendChildren(); }
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
                    if ( name in preset ) {
                        if ( !( attributes._todo instanceof Array ) ) {
                            if ( !( attributes._todo instanceof Function ) ) attributes._todo = [ attributes._todo ];
                            else attributes._todo = [];
                        }
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
     * 
     * @param {Node} node 
     * @param {*} properties 
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

function recognizeByFileSignature ( arraybuffer ) {
    //File signature information ( https://en.wikipedia.org/wiki/List_of_file_signatures )
    //File signature information ( http://forensic-proof.com/archives/300 )
    //File signature information ( https://www.filesignatures.net/ )
    const signatures = {
        "image/png": [ "89504E470D0A1A0A" ],
        "image/jpeg": [ "FFD8FFE[0-9]" ],
        "image/gif": [ "47494638" ],
        "image/tiff": [ "49492A00", "4D4D002[AB]", "492049" ],
        "image/bmp": [ "424D" ],
        "image/webp": [ "52494646[0-9A-F]{6,6}57454250" ],
    };
    //Read signature from binary
    const binSign = ( new Uint8Array( arraybuffer.slice( 0, 24 ) ) ).reduce( ( hex, bin ) => hex + bin.toString( 16 ), "" ).toUpperCase();
    //Compare signatures
    for ( const [ category, sign ] of Object.entries( signatures ) ) {
        if ( binSign.match( new RegExp( `^${sign.join( "|^" )}` ) ) ) return category;
    }
    //When none of the heading signatures was matched.
    return "application/octet-strem";
}

export { HTMLExtender, HTML, recognizeByFileSignature };
