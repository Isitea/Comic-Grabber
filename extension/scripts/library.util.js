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

class accumulator {
    constructor ( compile = () => {}, init = {}, delay = 250 ) {
        Object.defineProperties( this, {
            __clock: { writable: true },
            __delay: { value: delay },
            __log: { value: init },
            __compile: { value: compile }
        } );
    }
    
    log ( object ) {
        clearTimeout( this.__clock );
        let pointer = this.__log;
        let [ [ key, value ] ] = Object.entries( object );
        let [ { __constructor } ] = [ object ];
        while ( __constructor !== undefined ) {
            if ( !( key in pointer && pointer[ key ] === value && __constructor === pointer[ key ].constructor.name ) ) {
                pointer[ key ] = new window[ __constructor ]();
            }
            pointer = pointer[ key ];
            [ { __constructor } ] = [ value ];
            [ [ key, value ] ] = Object.entries( value );
        }
        pointer[ key ] = value;
        this.__clock = setTimeout( () => this.compile(), this.__delay );
    }

    compile () {
        this.__compile( this.__log );
    }
}

class StorageManager extends customEventTarget {
    constructor ( area, id = secureRandom(), init = {}, cleanUp = true ) {
        super();
        Object.defineProperties( this, {
            area: { value: area },
            id: { value: id },
            ACC: { value: new accumulator( data => this.update( data ) ) }
        } );
        this.constructor.init.call( this, init );
        if ( cleanUp ) window.addEventListener( "beforeunload", () => {
            this.area.removeItem( `${this.id}__UPDATE` );
            this.area.removeItem( this.id );
        } );
        window.addEventListener( "storage", ( { key, newValue, oldValue, storageArea, url } ) => {
            if ( storageArea === this.area && key === `${this.id}__UPDATE` && newValue && newValue.length ) {
                for ( const [ key, value ] of Object.entries( JSON.parse( newValue ) ) ) {
                    this._Stored[ key ] = value;
                }
            }
        } );
    }

    static init ( init ) {
        this._Stored = tracedObject( {}, {
            changed: changed => this.ACC.log( changed ),
            removed: removed => this.ACC.log( removed )
        } );
        for ( const [ key, value ] of Object.entries( JSON.parse( this.area.getItem( this.id ) || JSON.stringify( init ) ) ) ) {
            this._Stored[ key ] = value;
        }
    }

    update ( data ) {
        this.area.setItem( `${this.id}__UPDATE`, JSON.stringify( data ) );
        this.area.setItem( this.id, JSON.stringify( this._Stored ) );
        console.log( data );
    }

    get storage () {
        return this._Stored;
    }

    set storage ( invalid ) {
        return null;
    }
}

function tracedObject ( init, { changed = changed => console.log( changed ), removed = removed => console.log( removed ) } ) {
    const recursiveProxy = {
        set: function ( obj, prop, value, __Proxy ) {
            let proxy;
            if ( typeof value === "object" && value !== null ) {
                let container = new window[ value.constructor.name ]();
                Object.defineProperties( container, {
                    __treeChanged: { value: function ( value ) {
                        this.__parent.__treeChanged( { [[this.__key]]: value, __constructor: this.constructor.name } );
                    } },
                    __treeRemoved: { value: function ( value ) {
                        this.__parent.__treeRemoved( { [[this.__key]]: value } );
                    } },
                    __key: { value: prop },
                    __parent: { value: obj },
                } );
                proxy = new Proxy( container, recursiveProxy );
                for ( const [ key, kayPair ] of Object.entries( value ) ) { proxy[ key ] = kayPair; }
            }
            else {
                if ( value === undefined ) {
                    return this.deleteProperty( obj, prop );
                }
                if ( obj[ prop ] !== value ) obj.__treeChanged( { [[prop]]: value } );
            }
            return Reflect.set( obj, prop, proxy || value );
        },
        deleteProperty: function ( obj, prop ) {
            obj.__treeRemoved( { [[prop]]: undefined } );
            return Reflect.deleteProperty( obj, prop );
        }
    }
    
    Object.defineProperties( init, {
        __treeChanged: { value: changed },
        __treeRemoved: { value: removed },
     } );

     return new Proxy( init, recursiveProxy );
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

export { customEventTarget, StorageManager, tracedObject, secureRandom };
