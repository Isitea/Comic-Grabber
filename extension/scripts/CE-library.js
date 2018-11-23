"use strict";
import { secureRandom as uniquId } from './uniqueId.js';
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
    constructor ( fnList = [] ) {
        for ( let fn of fnList ) {
            this[fn]();
        }
    }

    appendChildren () {
        if ( !Node.prototype.appendChildren ) {
            Node.prototype.appendChildren = function ( children ) {
                if ( children instanceof NodeList ) {
                    while ( children.length > 0 ) {
                        this.appendChild( children[0] );
                    }
                } else {
                    throw new TypeError( "Passed parameter on method appendChildren under Node must be a NodeList." );
                }
            }
        }
    }

    xhrImageLoader () {
        if ( !Image.prototype.xhrUri ) {
            Object.defineProperty( Image.prototype, "xhrUri", {
                set: function ( uri ) {
                    let xhr = new XMLHttpRequest();
                    Object.defineProperties( this, {
                        xhr: { value: xhr },
                        lengthComputable: { value: true },
                        loaded: { value: 0 },
                        total: { value: 0 }
                    } );
                    xhr.responseType = "blob";
                    xhr.open( 'get', uri, true );
                    xhr.addEventListener( "load", e => {
                        if ( xhr.status === 200 && xhr.response.type.match( 'image' ) ) {
                            this.blob = xhr.response;
                            this.src = URL.createObjectURL( this.blob );
                            this.mime = this.blob.type;
                        } else {
                            this.dispatchEvent( Object.assign( new Event( "error" ), { status: xhr.status, mime: xhr.response.type } ) );
                        }
                    } );
                    xhr.addEventListener( "progress", e => {
                        let event = new ProgressEvent( "progress", { lengthComputable: e.lengthComputable, loaded: e.loaded, total: e.total } );
                        Object.defineProperties( this, {
                            lengthComputable: { value: e.lengthComputable },
                            loaded: { value: e.loaded },
                            total: { value: e.total }
                        } );
                        this.dispatchEvent( event );
                    } );
                    xhr.send();
                    this.async = new Promise( ( resolve, reject ) => {
                        this.addEventListener( "load", () => { resolve( this.blob ); }, { once: true } );
                        this.addEventListener( "error", reject, { once: true } );
                    } );
                },
                get: function () {
                    return this.xhr;
                }
            } );
        }
    }
}

class HTML {
    static fillAppendChildren () {
        if ( !Node.prototype.appendChildren ) {
            Node.prototype.appendChildren = function ( children ) {
                if ( children instanceof NodeList ) {
                    while ( children.length > 0 ) {
                        this.appendChild( children[0] );
                    }
                } else {
                    throw new TypeError( "Passed parameter on method appendChildren under Node must be a NodeList." );
                }
            }
        }
    }

    static render ( structure, preset ) {
        this.fillAppendChildren();
        if ( structure instanceof Node || structure instanceof NodeList ) return structure;
        let fragment = document.createDocumentFragment();
        if ( structure instanceof Object ) {
            if ( !( structure instanceof Array ) ) { structure = [ structure ]; }
            for ( const item of structure ) {
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
                    if ( value === "true" ) { node.setAttributeNode( document.createAttribute( key ) ); }
                    else { node[key] = value; }
                    
                }
            }
        }
        if ( children.length ) { node.appendChildren( children ); }

        return ( attributes._todo || [] ).reduce( ( node, fn ) => fn( node ), node );
    }

    static remove ( node, uncover = false ) {
        if ( !node.parentNode ) return false;
        if ( uncover ) {
            for ( let item of [ ...node.parentNode.childNodes ] ) {
                if ( item === node ) { for ( let child of [ ...node ] ) { node.parentNode.appendChild( child ); } }
                else { node.parentNode.appendChild( item ); }
            }
            node.parentNode.removeChild( node );
        }
        else { node.parentNode.removeChild( node ); }
    }
}

class ComicViewer {

}

export { customEventTarget, HTMLExtender, HTML, CommicViewer };
