"use strict";
import { StorageManager } from './library.util.js';
import './library.extend.js';
import { HTML } from './library.HTML.js';
import { ImageGrabbler } from './ImageGrabbler.js';
import { Locale } from './ImageGrabbler.locale.js';

class ComicGrabbler {
    constructor ( grabbler, { $session, $local, configuration } ) {
        Object.defineProperties( this, {
            grabbler: { value: grabbler },
            $session: { value: $session.storage },
            $local: { value: $local.storage },
            $memory: { value: { title: "", subTitle: "" }, writable: true },
            checkbox: { value: { saveOnLoad: configuration.saveOnLoad, moveOnSave: configuration.moveOnSave }, writable: true },
            move: { value: { next: configuration.moveNext, prev: configuration.movePrev }, writable: true },
        } );
        if ( configuration instanceof Object ) {
            this.injectController( configuration.lang );
            if ( configuration.subject ) {
                Object.assign( this.$memory, this.constructor.analyseInformation( configuration.subject ) );
            }
            if ( configuration.images ) {
                this.attachProgressEvent( grabbler.grabImages( document.querySelectorAll( configuration.images ) ) );
            }
        }
        $local.addEventListener( "updated", () => this.syncModelView( "MtV" ) );
        $session.addEventListener( "updated", () => this.syncModelView( "MtV" ) );
        this.syncModelView( "MtV" );
    }

    moveChapter ( selector ) {
        console.log( `%cTry to change chapter.`, $log );
        return ( button => ( button instanceof HTMLElement ? button.click() : false ) )( document.querySelector( selector ) );
    }

    attachProgressEvent ( images ) {
        function showProgress ( images ) {
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
                if ( this.$session.saveOnLoad ) {
                    this.element.querySelector( ".row-CG .checkbox-CG#saveToLocal" ).click();
                }
            }
        }
    
        let grabbler = this;
        let fn = function ( { lengthComputable, loaded, total } ) {
            Object.defineProperties( this, { progressEvent: { value: { lengthComputable, loaded, total }, writable: false, configurable: true }, } );
            showProgress.call( grabbler, images );
        };
        for ( let image of images ) image.addEventListener( "progress", fn );
    }

    drawProgressCircle ( progress ) {
        let canvas = this.element.querySelector( ".load-progress-CG" );
        let context = canvas.getContext( "2d" );
        context.strokeStyle = "rgba( 0, 255, 0, 0.75 )";
        context.lineWidth = 4;
        context.clearRect( 0, 0, canvas.width, canvas.height );
        context.beginPath();
        context.arc( canvas.width / 2, canvas.height / 2, ( canvas.height - context.lineWidth ) / 2 + 1, -0.5 * Math.PI, ( progress * 2 - 0.5 ) * Math.PI );
        context.stroke();
    }

    syncModelView ( syncWay, { cK, cV } = {} ) {
        let el = this.element;
        switch ( syncWay ) {
            case "MtV": {
                for ( const item of el.querySelectorAll( '.menu-CG .item-CG .text-CG [id]' ) ) {
                    if ( item.id in this.$memory ) item.value = this.$memory[ item.id ];
                    else if ( item.id in this.$session ) item.value = this.$session[ item.id ];
                    else if ( item.id in this.$local ) item.value = this.$local[ item.id ];
                }
                for ( const item of el.querySelectorAll( '.menu-CG .item-CG .checkbox-CG[id]' ) ) {
                    let value;
                    if ( item.id in this.$memory ) value = this.$memory[ item.id ];
                    else if ( item.id in this.$session ) value = this.$session[ item.id ];
                    else if ( item.id in this.$local ) value = this.$local[ item.id ];
                    else continue;

                    if ( value ) item.classList.add( "checked" );
                    else item.classList.remove( "checked" );
                }
                break;
            }
            case "VtM": {
                if ( cK in this.$memory ) this.$memory[ cK ] = cV;
                else if ( cK in this.$session ) this.$session[ cK ] = cV;
                else if ( cK in this.$local ) this.$local[ cK ] = cV;
                break;
            }
        }

        //Toggle alert
        if ( !( this.$local.savePath && this.$memory.title && this.$memory.subTitle ) ) {
            console.log( `%cSome configuration has an error.`, $alert );
            this.element.querySelector( ".menu-button-CG" ).classList.add( "alert" );
        }
        else {
            console.log( `%cAll configuration is correct.`, $inform );
            this.element.querySelector( ".menu-button-CG" ).classList.remove( "alert" );
        }
    }

    injectController ( lang = "ko-kr" ) {
        if ( this.element ) throw "Already inserted";
        console.log( `%cBuild controller.`, $log );
        let localized = Locale[lang];
        let [ node ] = HTML.render( {
            div: {
                className: "ComicGrabbler menu-CG",
                _child: [
                    {
                        div: {
                            className: "list-CG",
                            _child: [
                                {
                                    div: {
                                        className: "item-CG",
                                        _child: [
                                            {
                                                div: {
                                                    className: "label-CG",
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
                                                    className: "text-CG",
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
                                        className: "item-CG",
                                        _child: [
                                            {
                                                div: {
                                                    className: "label-CG",
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
                                                    className: "text-CG",
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
                                        className: "item-CG",
                                        _child: [
                                            {
                                                div: {
                                                    className: "label-CG",
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
                                                    className: "text-CG",
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
                                        className: "item-CG",
                                        _child: [
                                            {
                                                div: {
                                                    className: "row-CG",
                                                    _child: [
                                                        {
                                                            label: {
                                                                className: "checkbox-CG",
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
                                        className: "item-CG",
                                        _child: [
                                            {
                                                div: {
                                                    className: "row-CG",
                                                    _child: [
                                                        {
                                                            label: {
                                                                className: "checkbox-CG",
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
                                        className: "item-CG",
                                        _child: [
                                            {
                                                div: {
                                                    className: "row-CG",
                                                    _child: [
                                                        {
                                                            label: {
                                                                className: "checkbox-CG",
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
                                        className: "item-CG",
                                        _child: [
                                            {
                                                div: {
                                                    className: "label-CG",
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
                                                    className: "text-CG",
                                                    _child: [
                                                        {
                                                            select: {
                                                                className: "select-CG",
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
                                {
                                    div: {
                                        className: "item-CG",
                                        _child: [
                                            {
                                                div: {
                                                    className: "row-CG",
                                                    _child: [
                                                        {
                                                            label: {
                                                                className: "moveChapter-CG",
                                                                id: "movePrev",
                                                                textContent: localized.movePrev
                                                            }
                                                        },
                                                        {
                                                            label: {
                                                                className: "moveChapter-CG",
                                                                id: "moveNext",
                                                                textContent: localized.moveNext
                                                            }
                                                        },
                                                    ]
                                                }
                                            }
                                        ]
                                    }
                                },
                            ]
                        }
                    },
                    { div: { className: "bottom-padding-CG" } },
                    { div: { className: "menu-button-CG" } },
                    { canvas: { className: "load-progress-CG" } },
                ],
                _todo: node => {
                    for ( const item of node.querySelectorAll( "input[type=text], select" ) ) {
                        item.addEventListener( "change", () => this.syncModelView( "VtM", { cK: item.id, cV: item.value } ) );
                    }
                    for ( const item of node.querySelectorAll( ".row-CG .checkbox-CG:not(#saveToLocal)" ) ) {
                        item.addEventListener( "click", () => {
                            item.classList.toggle( "checked" );
                            this.syncModelView( "VtM", { cK: item.id, cV: item.classList.contains( "checked" ) } );
                        } );
                    }
                    let saveToLocal = () => {
                        console.log( `%cSave images to local as zip archive.`, $log );
                        if ( this.element.querySelector( ".menu-button-CG" ).classList.contains( "alert" ) ) return alert( localized.fillTextboxes );
                        node.querySelector( ".row-CG .checkbox-CG#saveToLocal" ).classList.toggle( "checked" );
                        node.querySelector( ".row-CG .checkbox-CG#saveToLocal" ).removeEventListener( "click", saveToLocal );
                        this.saveToLocal(
                            {
                                localPath: this.$local.savePath,
                                onConflict: this.$local.onConflict,
                                title: this.$memory.title,
                                subTitle: this.$memory.subTitle
                            }
                        )
                        .then( download => {
                            console.log( `%cSend download information to downloader.`, $log );
                            $tunnel.broadcast( "ComicGrabbler.saveArchive", download );

                            return new Promise( resolve => $tunnel.addListener( "ComicGrabbler.archiveSaved", resolve ) );
                        } )
                        .then( () => {
                            console.log( `%cArchive saved.`, $inform );
                            if ( this.$session.moveOnSave ) this.moveChapter( this.move.next );
                        } );
                    };
                    node.querySelector( ".row-CG #moveNext" ).addEventListener( "click", () => this.moveChapter( this.move.next ) );
                    node.querySelector( ".row-CG #movePrev" ).addEventListener( "click", () => this.moveChapter( this.move.prev ) );
                    node.querySelector( ".row-CG .checkbox-CG#saveToLocal" ).addEventListener( "click", saveToLocal );
                    return node;
                },
            }
        } );
        document.body.appendChild( node );
        let getRealSize = () => {
            let menu = node.querySelector( ".menu-button-CG" );
            if ( menu.clientHeight && menu.clientWidth ) {
                let canvas = node.querySelector( ".load-progress-CG" );
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
                let $subTitle = document.querySelector( subTitle.selector ).readProperty( subTitle.propertyChain ).toFilename().replace( new RegExp( subTitle.exp || "(.+)" ), "$1" );
                result = {
                    title: document.querySelector( title.selector ).readProperty( title.propertyChain ).replace( $subTitle, "" ).toFilename().replace( new RegExp( title.exp || "(.+)" ), "$1" ),
                    subTitle: $subTitle
                };
            }
            else {
                result = document.querySelector( title.selector ).readProperty( title.propertyChain ).toFilename().match( new RegExp( generalExp ) ).groups;
            }
            console.log( `%cSuccessfully recognized.`, $log );
        } catch ( e ) {
            console.log( e );
            console.log( `%cRecognition failed.`, $alert );
        }

        return result;
    }

    /**
     * Make download option object for download api.
     * @param {{ localPath: String, onConflict: String, title: String, subTitle: String }}
     * @returns {Promise<Object>}
     */
    async saveToLocal ( { localPath, onConflict, title, subTitle } ) {
        console.log( `%cSolidates image data as a zip archive.`, $log );
        let zip = await this.grabbler.solidateImages();
        zip.file( 'Downloaded from.txt', new Blob( [ document.URL ], { type: 'text/plain' } ) );
        let blob = await zip.generateAsync( { type: "blob" } );
        console.log( `%cSolidation completed.`, $inform );

        return {
            blob,
            url: URL.createObjectURL( blob ),
            filename: `${localPath}/${title}/${subTitle}.zip`,
            conflictAction: onConflict
        }
    }
}

class CommunicationTunnel {
    /**
     * @param {*} client - Browser specific global object like 'chrome' in Chrome or 'browser' in Firefox.
     */
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

function activateExtension ( { keyboard, configuration, session, local } ) {
    console.log( `%cRead previous configuration from sessionStorage.`, $log );
    const $session = new StorageManager(
        sessionStorage,
        "ComicGrabbler",
        session
    );
    console.log( `%cRead previous configuration from localStorage.`, $log );
    const $local = new StorageManager(
        localStorage,
        "ComicGrabbler",
        local
    );
    console.log( `%cRecognition data received.`, $log );
    const comic = new ComicGrabbler( new ImageGrabbler(), { $session, $local, configuration } );
    return;
    window.addEventListener( "keydown", function ( { code, altKey, ctrlKey, shiftKey } ) {
        switch ( code ) {
            case keyboard.download: {
                if ( !( altKey || ctrlKey || shiftKey ) ) comic.element.querySelector( "#saveToLocal" ).click();
                break;
            }
            case keyboard.moveNext: {
                if ( !( altKey || ctrlKey || shiftKey ) ) comic.element.querySelector( "#moveNext" ).click();
                break;
            }
            case keyboard.movePrev: {
                if ( !( altKey || ctrlKey || shiftKey ) ) comic.element.querySelector( "#movePrev" ).click();
                break;
            }
        }
    }, { passive: true } );
}

const $log = `font-size: 12px; color: rgba( 75, 223, 198, 0.75 );`;
const $alert = `font-size: 12px; color: rgba( 255, 32, 64, 1 );`;
const $inform = `font-size: 12px; color: rgba( 114, 20, 214, 0.75 );`;
console.log( `%cAll components loaded.`, $log );

const $tunnel = new CommunicationTunnel( ( () => { try { return browser; } catch ( e ) { return chrome; } } )() );
$tunnel.addListener( "ComicGrabbler.activateExtension", activateExtension );
console.log( `%cRequest recognition data.`, $log );
$tunnel.broadcast( "ComicGrabbler.readyExtension" );

