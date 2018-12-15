"use strict";
class HTMLExtender {
    static extend ( fnList = [] ) {
        for ( let fn of fnList ) this[fn]();
    }

   /**
    * Extends Node method for multi appending child node.
    * Node.appendChildren only accepts NodeList.
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
     * Make progress event on Image tag via XMLHttpRequest.
     * Following properties are enchanted to Image class.
     * Image.xhrUri: get - Return XMLHttpRequest which was used for loading image.
     * Image.xhrUri: get - Return XMLHttpRequest which was used for loading image.
     * Image.binaryData: Blob form of image data. It is set when XMLHttpRequest is successfully done.
     * Image.lengthComputable, Image.loaded, Image.total: Progress information. It is refreshed with Progress event.
     * 
     * Added events
     * Image - Progress event: This event is a clone of one of XMLHttpRequest.
     */
    static xhrImageLoader () {
        if ( !Image.prototype.xhrUri ) {
            Object.defineProperty( Image.prototype, "xhrUri", {
                set: function ( uri ) {
                    this.async = new Promise( ( resolve, reject ) => {
                        this.addEventListener( "load", () => { resolve( this.binaryData ); }, { once: true } );
                        this.addEventListener( "error", reject, { once: true } );
                    } );
                    let xhr = new XMLHttpRequest();
                    Object.defineProperties( this, {
                        xhr: { value: xhr, writable: false, configurable: true },
                        lengthComputable: { value: true, writable: false, configurable: true },
                        loaded: { value: 0, writable: false, configurable: true },
                        total: { value: 0, writable: false, configurable: true },
                        binaryData: { writable: false, configurable: true },
                    } );
                    xhr.responseType = "blob";
                    xhr.open( 'get', uri, true );
                    xhr.addEventListener( "load", async () => {
                        let blob;
                        if ( xhr.response.type.match( 'image' ) ) { blob = xhr.response; }
                        else {
                            blob = await new Promise( resolve => {
                                let fileReader = new FileReader();
                                fileReader.addEventListener( "load", evt => {
                                    const arraybuffer = evt.target.result;
                                    resolve( new Blob( [ arraybuffer ], { type: recognizeByFileSignature( arraybuffer ) } ) );
                                } );
                                fileReader.readAsArrayBuffer( xhr.response );
                            } );
                        }
                        if ( blob.type.match( 'image' ) ) {
                            Object.defineProperties( this, {
                                binaryData: { value: blob },
                            } );
                            this.src = URL.createObjectURL( blob );
                            this.addEventListener( "load", () => URL.revokeObjectURL( this.src ), { once: true } );
                        }
                        else {
                            Object.defineProperties( this, { lengthComputable: { value: true }, loaded: { value: 0 }, total: { value: 0 } } );
                            this.dispatchEvent( Object.assign( new Event( "error" ), { status: xhr.status, blob, statusText: "Content which URI indicated is not an image." } ) );
                        }
                    } );
                    xhr.addEventListener( "progress", ( { lengthComputable, loaded, total } ) => {
                        Object.defineProperties( this, {
                            lengthComputable: { value: lengthComputable },
                            loaded: { value: loaded },
                            total: { value: total }
                        } );
                        this.dispatchEvent( new ProgressEvent( "progress", { lengthComputable, loaded, total } ) );
                    } );
                    xhr.send();
                },
                get: function () {
                    return this.xhr;
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
 *  propertyName: propertyValue (When propertyValue is "", just made attribute node and add it on the node.),
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
    const signatures = {
        "image/png": [ "89504E470D0A1A0A" ],
        "image/jpeg": [ "FFD8FFDB", "FFD9FFE000104A4649460001", "FFD8FFEE", "FFD8FFE1[A-F0-9]{4,4}457869660000" ],
        "image/gif": [ "474946383761", "474946383961" ],
        "image/tiff": [ "49492A00", "4D4D002A" ],
        "image/bmp": [ "424D" ],
        "image/webp": [ "52494646[A-F0-9]{8,8}57454250" ],
    };
    //Read signature from binary
    const binSign = ( new Uint8Array( arraybuffer.slice( 0, 24 ) ) ).reduce( ( hex, bin ) => hex + bin.toString( 16 ), "" ).toUpperCase();
    //Compare signatures
    for ( const [ category, sign ] of Object.entries( signatures ) ) {
        if ( binSign.match( new RegExp( `^${sign.join( "|^" )}` ) ) ) return category;
    }
    return "application/octet-strem";
}

export { HTMLExtender, HTML, recognizeByFileSignature };
