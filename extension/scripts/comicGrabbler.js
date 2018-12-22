"use strict";
import { StorageManager } from './library.util.js';
import './library.extend.js';
import { HTML } from './library.HTML.js';
import { ImageGrabbler } from './ImageGrabbler.js';

const Locale = {
    "ko-kr": {
        savePath: "저장 위치",
        comicTitle: "제목",
        comicSubTitle: "부제목",
        saveToLocal: "저장하기 (D)",
        saveOnLoad: "자동 저장",
        moveOnSave: "자동 이동",
        fillTextboxes: "입력 상자를 모두 채워주세요.",
        download: {
            onDuplicated: "이름 겹칠 때,",
            uniquify: "자동 수정",
            overwrite: "덮어 쓰기",
        }
    }
}

function randomWrite( storage ) {
    setTimeout( () => {
        storage[ crypto.getRandomValues( new Uint8Array(1) )[0].toString( 16 ) ] = crypto.getRandomValues( new Uint8Array(1) )[0].toString( 8 );
        console.log( JSON.stringify( storage ) );
        randomWrite( storage );
    }, Math.random() * 5000 + 500 );
}
//randomWrite( ( new StorageManager( localStorage, "extTest" ) ).storage );

class ComicGrabbler {
    constructor ( grabbler, Preset ) {
        Object.defineProperties( this, {
            grabbler: { value: grabbler },
            text: { value: { savePath: Preset.savePath, onConflict: Preset.onConflict }, writable: true },
            checkbox: { value: { saveOnLoad: Preset.saveOnLoad, moveOnSave: Preset.moveOnSave }, writable: true },
            move: { value: { next: Preset.moveNext, prev: Preset.movePrev }, writable: true },
        } );
        if ( Preset instanceof Object ) {
            this.injectController( Preset.lang );
            if ( Preset.subject ) {
                Object.assign( this.text, this.constructor.analyseInformation( Preset.subject ) );
            }
            if ( Preset.images ) {
                this.attachProgressEvent( grabbler.grabImages( document.querySelectorAll( Preset.images ) ) );
            }
        }
        this.syncModelView( "MtV" );
    }

    moveChapter ( selector ) {
        console.log( `%cTry to change chapter.`, $log );
        return ( button => ( button instanceof HTMLElement ? button.click() : false ) )( document.querySelector( selector ) );
    }

    attachProgressEvent ( images ) {
        let grabbler = this;
        let fn = function ( { lengthComputable, loaded, total } ) {
            Object.defineProperties( this, { progressEvent: { value: { lengthComputable, loaded, total }, writable: false, configurable: true }, } );
            grabbler.showProgress( images );
        };
        for ( let image of images ) image.addEventListener( "progress", fn );
    }

    showProgress ( images ) {
        let ref = {
            count: { loaded: 0, total: images.length },
            size: { loaded: 0, total: 0 },
            computable: { size: 0, count: 0 }
        };
        for ( let image of images ) {
            let p;
            if ( p = image.progressEvent ) {
                ref.size.loaded += p.loaded;
                ref.size.total += p.total;
                if ( p.loaded === p.total ) {
                    ref.count.loaded++;
                    ref.computable.count++;
                    ref.computable.size += p.total;
                }
                else {
                    if ( p.lengthComputable ) {
                        ref.computable.count++;
                        ref.computable.size += p.total;
                    }
                }
            }
        }
        if ( ref.count.total === ref.computable.count ) this.drawProgressCircle( ref.size.loaded / ref.size.total );
        else this.drawProgressCircle( ref.size.loaded / ( ( ref.computable.size / ref.computable.count ) * ref.count.total ) );

        if ( ref.size.loaded === ref.size.total ) {
            console.log( `%cEvery image was loaded.`, $log );
            console.log( `%cNow you can save images immediately.`, $inform );
            if ( this.checkbox.saveOnLoad ) {
                this.element.querySelector( ".row .checkbox#saveToLocal" ).click();
            }
        }
    }

    drawProgressCircle ( progress ) {
        let canvas = this.element.querySelector( ".load-progress" );
        let context = canvas.getContext( "2d" );
        context.strokeStyle = "rgba( 0, 255, 0, 0.75 )";
        context.lineWidth = 4;
        context.clearRect( 0, 0, canvas.width, canvas.height );
        context.beginPath();
        context.arc( canvas.width / 2, canvas.height / 2, ( canvas.height - context.lineWidth ) / 2 + 1, -0.5 * Math.PI, ( progress * 2 - 0.5 ) * Math.PI );
        context.stroke();
    }

    syncModelView ( syncWay ) {
        let el = this.element;
        switch ( syncWay ) {
            case "MtV": {
                for ( let [ key, value ] of Object.entries( this.text ) ) {
                    el.querySelector( `.menu #${key}` ).value = value;
                }
                for ( let [ key, value ] of Object.entries( this.checkbox ) ) {
                    if ( value ) el.querySelector( `.menu .row .checkbox#${key}` ).classList.add( "checked" );
                    else el.querySelector( `.menu .row .checkbox#${key}` ).classList.remove( "checked" );
                }
                break;
            }
            case "VtM": {
                for ( let [ key, value ] of Object.entries( this.text ) ) {
                    this.text[ key ] = el.querySelector( `.menu #${key}` ).value;
                }
                for ( let [ key, value ] of Object.entries( this.checkbox ) ) {
                    this.checkbox[ key ] = el.querySelector( `.menu .row .checkbox#${key}` ).classList.contains( "checked" );
                }
                break;
            }
        }
        this.toggleAlert();
    }

    toggleAlert () {
        if ( !( this.text.savePath && this.text.title && this.text.subTitle ) ) {
            console.log( `%cSome configuration has an error.`, $alert );
            this.element.querySelector( ".menu-button" ).classList.add( "alert" );
        }
        else {
            console.log( `%cAll configuration is correct.`, $inform );
            this.element.querySelector( ".menu-button" ).classList.remove( "alert" );
        }
    }

    injectController ( lang = "ko-kr" ) {
        if ( this.element ) throw "Already inserted";
        console.log( `%cBuild controller.`, $log );
        let localized = Locale[lang];
        let [ node ] = HTML.render( {
            div: {
                className: "ComicGrabbler menu",
                _child: [
                    {
                        div: {
                            className: "list",
                            _child: [
                                {
                                    div: {
                                        className: "item",
                                        _child: [
                                            {
                                                div: {
                                                    className: "label",
                                                    _child: [
                                                        {
                                                            label: {
                                                                htmlFor: "savePath",
                                                                textContent: localized.savePath
                                                            }
                                                        }
                                                    ]
                                                }
                                            },
                                            {
                                                div: {
                                                    className: "textInput",
                                                    _child: [
                                                        {
                                                            input: {
                                                                id: "savePath",
                                                                type: "text"
                                                            }
                                                        }
                                                    ]
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    div: {
                                        className: "item",
                                        _child: [
                                            {
                                                div: {
                                                    className: "label",
                                                    _child: [
                                                        {
                                                            label: {
                                                                htmlFor: "title",
                                                                textContent: localized.comicTitle
                                                            }
                                                        }
                                                    ]
                                                }
                                            },
                                            {
                                                div: {
                                                    className: "textInput",
                                                    _child: [
                                                        {
                                                            input: {
                                                                id: "title",
                                                                type: "text"
                                                            }
                                                        }
                                                    ]
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    div: {
                                        className: "item",
                                        _child: [
                                            {
                                                div: {
                                                    className: "label",
                                                    _child: [
                                                        {
                                                            label: {
                                                                htmlFor: "subTitle",
                                                                textContent: localized.comicSubTitle
                                                            }
                                                        }
                                                    ]
                                                }
                                            },
                                            {
                                                div: {
                                                    className: "textInput",
                                                    _child: [
                                                        {
                                                            input: {
                                                                id: "subTitle",
                                                                type: "text"
                                                            }
                                                        }
                                                    ]
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    div: {
                                        className: "item",
                                        _child: [
                                            {
                                                div: {
                                                    className: "row",
                                                    _child: [
                                                        {
                                                            label: {
                                                                className: "checkbox",
                                                                id: "saveToLocal",
                                                                textContent: localized.saveToLocal
                                                            }
                                                        }
                                                    ]
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    div: {
                                        className: "item",
                                        _child: [
                                            {
                                                div: {
                                                    className: "row",
                                                    _child: [
                                                        {
                                                            label: {
                                                                className: "checkbox",
                                                                id: "saveOnLoad",
                                                                textContent: localized.saveOnLoad
                                                            }
                                                        }
                                                    ]
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    div: {
                                        className: "item",
                                        _child: [
                                            {
                                                div: {
                                                    className: "row",
                                                    _child: [
                                                        {
                                                            label: {
                                                                className: "checkbox",
                                                                id: "moveOnSave",
                                                                textContent: localized.moveOnSave
                                                            }
                                                        }
                                                    ]
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    div: {
                                        className: "item",
                                        _child: [
                                            {
                                                div: {
                                                    className: "label",
                                                    _child: [
                                                        {
                                                            label: {
                                                                htmlFor: "onConflict",
                                                                textContent: localized.download.onDuplicated
                                                            }
                                                        }
                                                    ]
                                                }
                                            },
                                            {
                                                div: {
                                                    className: "textInput",
                                                    _child: [
                                                        {
                                                            select: {
                                                                className: "select",
                                                                id: "onConflict",
                                                                _child: [
                                                                    {
                                                                        option: {
                                                                            value: "uniquify",
                                                                            textContent: localized.download.uniquify
                                                                        }
                                                                    },
                                                                    {
                                                                        option: {
                                                                            value: "overwrite",
                                                                            textContent: localized.download.overwrite
                                                                        }
                                                                    },
                                                                ]
                                                            }
                                                        }
                                                    ]
                                                }
                                            }
                                        ]
                                    }
                                },
                            ]
                        }
                    },
                    { div: { className: "bottom-padding" } },
                    { div: { className: "menu-button" } },
                    { canvas: { className: "load-progress" } },
                ],
                _todo: node => {
                    for ( const item of node.querySelectorAll( "input[type=text], select" ) ) {
                        item.addEventListener( "change", () => this.syncModelView( "VtM" ) );
                    }
                    for ( const item of node.querySelectorAll( ".row .checkbox:not(#saveToLocal)" ) ) {
                        item.addEventListener( "click", () => {
                            item.classList.toggle( "checked" );
                            this.syncModelView( "VtM" );
                        } );
                    }
                    let saveToLocal = () => {
                        console.log( `%cSave images to local as zip archive.`, $log );
                        if ( this.element.querySelector( ".menu-button" ).classList.contains( "alert" ) ) return alert( localized.fillTextboxes );
                        node.querySelector( ".row .checkbox#saveToLocal" ).classList.toggle( "checked" );
                        node.querySelector( ".row .checkbox#saveToLocal" ).removeEventListener( "click", saveToLocal );
                        this.saveToLocal( { localPath: this.text.savePath, onConflict: this.text.onConflict } )
                            .then( download => {
                                console.log( `%cSend download information to downloader.`, $log );
                                $tunnel.broadcast( "ComicGrabbler.saveArchive", download );

                                return new Promise( resolve => $tunnel.addListener( "ComicGrabbler.archiveSaved", resolve ) );
                            } )
                            .then( () => {
                                console.log( `%cArchive saved.`, $inform );
                                if ( this.checkbox.moveOnSave ) this.moveChapter( this.move.next );
                            } );
                    };
                    node.querySelector( ".row .checkbox#saveToLocal" ).addEventListener( "click", saveToLocal );
                    return node;
                },
            }
        } );
        document.body.appendChild( node );
        let getRealSize = () => {
            let menu = node.querySelector( ".menu-button" );
            if ( menu.clientHeight && menu.clientWidth ) {
                let canvas = node.querySelector( ".load-progress" );
                canvas.width = menu.clientWidth;
                canvas.height = menu.clientHeight;
            }
            else setTimeout( getRealSize, 100 );
        };
        setTimeout( getRealSize, 0 );

        Object.defineProperties( this, { element: { value: node } } );
    }

    /**
     * Analyse title and sub-title of this page.
     * @param {{ title: { selector: String, propertyChain: String, exp: String }, subTitle: { selector: String, propertyChain: String, exp: String }, generalExp: String }}
     * @returns {{ title: string, subTitle: string }}
     */
    static analyseInformation ( { title, subTitle, generalExp } ) {
        console.log( `%cTry to recognize title and sub-title.`, $log );
        let result = {};
        try {
            if ( title && subTitle ) {
                result = {
                    title: document.querySelector( title.selector ).readProperty( title.propertyChain ).toFilename().replace( new RegExp( title.exp || "(.+)" ), "$1" ),
                    subTitle: document.querySelector( subTitle.selector ).readProperty( subTitle.propertyChain ).toFilename().replace( new RegExp( subTitle.exp || "(.+)" ), "$1" )
                };
            }
            else {
                result = document.querySelector( title.selector ).readProperty( title.propertyChain ).toFilename().match( new RegExp( generalExp ) ).groups;
            }
            console.log( `%cSuccessfully recognized.`, $log );
        } catch ( e ) {
            console.log( `%cRecognition failed.`, $alert );
        }

        return result;
    }

    /**
     * 
     * @param {{ localPath: String, onConflict: String }}
     * @returns {Promise<Object>}
     */
    async saveToLocal ( { localPath, onConflict } ) {
        console.log( `%cSolidates image data as a zip archive.`, $log );
        let zip = await this.grabbler.solidateImages();
        zip.file( 'Downloaded from.txt', new Blob( [ document.URL ], { type: 'text/plain' } ) );
        let blob = await zip.generateAsync( { type: "blob" } );
        console.log( `%cSolidation completed.`, $inform );

        return {
            blob,
            url: URL.createObjectURL( blob ),
            filename: `${localPath}/${this.text.title}/${this.text.subTitle}.zip`,
            conflictAction: onConflict
        }
    }
}

class CommunicationTunnel {
    constructor ( client ) {
        Object.defineProperties( this, {
            listener: { value: [] },
            client: { value: client },
        } );
        window.addEventListener(
            "message",
            ( { source, data: { type, event } } ) => {
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

function activateExtension ( config ) {
    console.log( `%cRecognition data received.`, $log );
    const comic = new ComicGrabbler( new ImageGrabbler(  ), config );
    window.addEventListener( "keydown", function ( { code, altKey, ctrlKey, shiftKey } ) {
        console.log( arguments );
        switch ( code ) {
            case "KeyD": {
                if ( !( altKey || ctrlKey || shiftKey ) ) comic.element.querySelector( "#saveToLocal" ).click();
            }
        }
    } );
}

const $log = `font-size: 12px; color: rgba( 75, 223, 198, 0.75 );`;
const $alert = `font-size: 12px; color: rgba( 255, 32, 64, 1 );`;
const $inform = `font-size: 12px; color: rgba( 32, 255, 64, 1 );`;
console.log( `%cAll components loaded.`, $log );
const $tunnel = new CommunicationTunnel( ( () => { try { return browser; } catch ( e ) { return chrome; } } )() );
$tunnel.addListener( "ComicGrabbler.activateExtention", activateExtension );
console.log( `%cRequest recognition data.`, $log );
$tunnel.broadcast( "ComicGrabbler.readyExtention" );

