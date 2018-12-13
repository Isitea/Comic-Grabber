"use strict";
class customEventTarget {
    constructor () {
        Object.defineProperties( this, {
            listeners: { value: {} },
        } );
    }

    addEventListener ( type, listener, { once = false, prior = false, passive = false, expire = 0 } = {} ) {
        if ( !( type in this.listeners ) ) { this.listeners[ type ] = []; }
        if ( expire > 0 ) expire += performance.now();

        let item;
        if ( !( item = this.listeners[ type ].find( item => item.listener === listener ) ) ) {
            item = { listener, once, passive, expire, id: '_' + secureRandom() };
            if ( prior ) this.listeners[ type ].unshift( item );
            else this.listeners[ type ].push( item );
        }
        return item.id;
    }

    removeEventListenerAll ( type ) {
        if ( type in this.listeners ) {
            this.listeners[ type ] = [];
        }

        return this;
    }

    removeEventListener ( type, item ) {
        let { listener, id } = item;
        if ( item instanceof Function ) [ listener, id ] = [ item, false ];

        if ( type in this.listeners ) {
            let finder = item => ( ( listener && item.listener === listener ) || ( id && item.id === id ) );
            let stack = this.listeners[ type ], index;
            if ( ( index = stack.findIndex( finder ) ) > -1 ) stack.splice( index, 1 );
        }

        return this;
    }

    dispatchEvent ( event ) {
        if ( !( event instanceof Event || event instanceof iEvent ) ) throw Error( "TypeError" );
        if ( event.type in this.listeners ) {
            let stack = this.listeners[ event.type ];
            const preventDefault = event.defaultPrevented;
            for ( let item of stack ) {
                if ( item.expire > 0 && item.expire < performance.now() ) {
                    this.removeEventListener( event.type, item );
                    continue;
                }
                
                let listener = item.listener;

                if ( typeof listener === "function" ) listener.call( this, event );
                else if ( typeof listener.handleEvent === "function" ) listener.handleEvent.call( this, event );

                if ( item.passive ) event.defaultPrevented = preventDefault;
                if ( item.once ) this.removeEventListener( event.type, item );

                if ( event.cancelBubble ) return !event.defaultPrevented;
            }
        }

        return !event.defaultPrevented;
    }
}

class HTMLExtender {
    static extend ( fnList = [] ) {
        for ( let fn of fnList ) this[fn]();
    }

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

class HTML {
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
                        if ( !( attributes._todo instanceof Array ) ) { attributes._todo = []; }
                        attributes._todo.unshift( preset[name] );
                    }
                    node = this.setAttributes( document.createElement( name ), attributes );
                }
                if ( node ) fragment.appendChild( node );
            }
        }

        return fragment.childNodes;
    }

    static setAttributes ( node, attributes ) {
        const children = this.render( attributes._child );
        for ( const [ key, value ] of Object.entries( attributes ) ) {
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
                    let AttributeNode = document.createAttribute( key );
                    if ( value !== "" ) AttributeNode.value = value;
                    node.setAttributeNode( AttributeNode );
                }
            }
        }
        if ( children.length ) { node.appendChildren( children ); }

        return ( attributes._todo || [] ).reduce( ( node, fn ) => fn( node ), node );
    }

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

class ImageGrabbler {
    constructor ( storage ) {
        
    }


}

const recursiveProxy = {
    set: function ( obj, prop, value ) {
        let proxy;
        if ( typeof value === "object" ) {
            let container = new window[value.constructor.name]();
            Object.defineProperties( container, { __parent: obj } );
            proxy = Proxy.revocable( container, recursiveProxy );
            for ( const [ key, value ] of Object.entries( value ) ) { proxy[key] = value; }
        }
        else {
            proxy = value;
        }
        Reflect.set( obj, prop, proxy );
    },
    deleteProperty: function ( obj, prop ) {
        obj[ prop ].revoke();
        Reflect.defineProperty( obj, prop );
    }
}

class StorageManager extends customEventTarget {
    constructor ( area, id = secureRandom(), init ) {
        super();
        Object.defineProperties( this, { area: { value: area }, id: { value: id } } );
        this.init( init )
    }

    init ( init = {} ) {
        let obj = {};
        Object.defineProperties( obj, { __treeChanged: { value: () => this.storage() } } );
        this._Stored = new Proxy( obj, recursiveProxy );
        for ( const [ key, value ] of Object.entries( JSON.parse( this.area.getItem( this.id ) || init ) ) ) {
            this._Stored[ key ] = value;
        }
    }

    update () {

    }

    get storage () {
        return this._Stored;
    }

    storage () {
        this.area.setItem( this.id, JSON.stringify( this._Stored ) )
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

const uniqueSeed = new Uint8Array( 12 );
function secureRandom () {
    let randomValue = 0;
    for ( let i = 0; i < 5; i++ ) {
        crypto.getRandomValues( uniqueSeed );
        randomValue += Number( uniqueSeed.join( "" ) ) / Number( uniqueSeed.reverse().join( "" ) );
    }
    
    return randomValue.toString( 32 ).substr( 2 );
}

export { customEventTarget, HTMLExtender, HTML, CommicViewer, recognizeByFileSignature, secureRandom };
