"use strict";
import { constant } from '/lib/constant.js';
import { HTML, logger, uid } from '/lib/extendVanilla.js';
import { resourceManager } from '/lib/resourceManager.js';
import { $client } from '/lib/browserUnifier.js';
const $locale = $client.i18n.getMessage;

class Controller extends EventTarget {
    constructor ( pageModule ) {
        super();
        Object.defineProperties( this, {
            clientUid: { value: uid(), writable: false, configurable: false, enumerable: false },
            pageModule: { value: pageModule, writable: false, configurable: false, enumerable: false },
            state: { value: constant.__loaded__, writable: true, configurable: false, enumerable: false },
            resource: { value: new resourceManager( $client.runtime.getURL( "" ).replace( /\/$/, "" ) ), writable: false, configurable: false, enumerable: false },
            UINode: { writable: true, configurable: true, enumerable: false },
        } );
        this.resource.load( "/ui/style.css" );
        this.init()
            .then( msg => this.constructUI( ) )
            .then( msg => this.activateUI( ) )
            .then( () => this.changeState( constant.__ready__ ) );
    }

    async chekcStorage ( rawData, holder ) {
        let info = await rawData;
        let { title, episode, raw } = info;
        raw = raw?.toFilename() || "";
        title = title?.toFilename() || "";
        episode = episode?.toFilename() || "";
        if ( raw ) {
            let stored = sessionStorage.getItem( "title" ) || "";
            if ( stored && title.match( stored ) && title.length > stored.length ) {
                episode = raw.replace( title = stored, "" ).toFilename();
            }
        }
        if ( title ) sessionStorage.setItem( "title", title );
        Object.assign( info, { title, episode, raw } );

        for ( let key of [ "saveOnLoad", "moveOnSave" ] )
            info[key] = JSON.parse( sessionStorage.getItem( key ) )?.value || false;
        for ( let key of [ "includeTitle", "autoCategorize", "autoRename" ] )
            info[key] = ( JSON.parse( localStorage.getItem( key ) )?.value !== undefined ? JSON.parse( localStorage.getItem( key ) )?.value : constant[key] );
        info.downloadFolder = localStorage.getItem( "downloadFolder" ) || "Downloaded Comics";

        holder.addEventListener( "infochange", ( { data: { key, value } } ) => {
            switch ( key ) {
                case "saveOnLoad": 
                case "moveOnSave": {
                    sessionStorage.setItem( key, JSON.stringify( { value } ) );
                    break;
                }
                case "title": {
                    sessionStorage.setItem( key, value );
                    break;
                }
                case "autoRename":
                case "autoCategorize":
                case "includeTitle": {
                    localStorage.setItem( key, JSON.stringify( { value } ) );
                    break;
                }
                case "downloadFolder": {
                    localStorage.setItem( key, value );
                    break;
                }
            }
        } );

        return info;
    }

    async init () {
        let { moveNext, movePrev, info, images, universal } = await this.pageModule();
        let holder = this;
        Object.defineProperties( this, {
            images: { value: await images, writable: true, configurable: false, enumerable: false },
            info: { value: new Proxy( ( await this.chekcStorage( info, holder ) ), { set: function ( obj, key, value ) {
                let event = new Event( "infochange" );
                if ( typeof value === "string" ) value = value.toFilename();
                event.data = { key, value };
                holder.dispatchEvent( event );
                return Reflect.set( obj, key, value );
            } } ), writable: true, configurable: false, enumerable: false },
            moveNext: { value: await moveNext, writable: false, configurable: false, enumerable: true },
            movePrev: { value: await movePrev, writable: false, configurable: false, enumerable: true },
        } );
        universal?.activateListener( holder );
        
        return "Data processing completed";
    }

    changeState ( state ) {
        this.state = state;
        this.dispatchEvent( new Event( "statechange" ) );
    }

    async constructUI () {
        if ( this.UINode ) return "UI already generated";
        let [ node, notification ] = HTML.render( [
            {
                div: {
                    class: [ "ComicGrabber", "CG-menu" ],
                    _child: [
                        {
                            div: {
                                class: [ "CG-moveChapter" ],
                                id: "movePrev",
                                title: $locale( "movePrev" )
                            }
                        },
                        {
                            div: {
                                class: [ "CG-list" ],
                                _child: [
                                    {
                                        div: {
                                            class: [ "CG-item" ],
                                            _child: [
                                                {
                                                    div: {
                                                        class: [ "CG-label" ],
                                                        _child: [ { label: { htmlFor: "downloadFolder", textContent: $locale( "downloadFolder" ) } } ]
                                                    }
                                                },
                                                {
                                                    div: {
                                                        class: [ "CG-text" ],
                                                        _child: [ { input: { id: "downloadFolder", type: "text" } } ]
                                                    }
                                                }
                                            ]
                                        }
                                    },
                                    {
                                        div: {
                                            class: [ "CG-item" ],
                                            _child: [
                                                {
                                                    div: {
                                                        class: [ "CG-label" ],
                                                        _child: [ { label: { htmlFor: "title", textContent: $locale( "comicTitle" ) } } ]
                                                    }
                                                },
                                                {
                                                    div: {
                                                        class: [ "CG-text" ],
                                                        _child: [ { input: { id: "title", type: "text" } } ]
                                                    }
                                                }
                                            ]
                                        }
                                    },
                                    {
                                        div: {
                                            class: [ "CG-item" ],
                                            _child: [
                                                {
                                                    div: {
                                                        class: [ "CG-label" ],
                                                        _child: [ { label: { htmlFor: "episode", textContent: $locale( "comicEpisode" ) } } ]
                                                    }
                                                },
                                                {
                                                    div: {
                                                        class: [ "CG-text" ],
                                                        _child: [ { input: { id: "episode", type: "text" } } ]
                                                    }
                                                }
                                            ]
                                        }
                                    },
                                    {
                                        div: {
                                            class: [ "CG-item" ],
                                            _child: [
                                                {
                                                    div: {
                                                        class: [ "CG-icon" ],
                                                        id: "saveToLocal",
                                                        _child: [
                                                            { div: { class: [ "CG-static", "images", "download" ], dataset: { for: "saveToLocal" }, title: $locale( "saveToLocal" ) } }
                                                        ]
                                                    }
                                                }
                                            ]
                                        }
                                    },
                                    {
                                        div: {
                                            class: [ "CG-item" ],
                                            _child: [
                                                {
                                                    div: {
                                                        class: [ "CG-icon" ],
                                                        id: "autoRename",
                                                        _child: [
                                                            { div: { class: [ "CG-static", "images", "autoRename" ], dataset: { for: "autoRename" }, title: $locale( "autoRename" ) } }
                                                        ]
                                                    }
                                                }
                                            ]
                                        }
                                    },
                                    {
                                        div: {
                                            class: [ "CG-item" ],
                                            _child: [
                                                {
                                                    div: {
                                                        class: [ "CG-icon" ],
                                                        id: "includeTitle",
                                                        _child: [
                                                            { div: { class: [ "CG-rotate", "images", "circle" ] } },
                                                            { div: { class: [ "CG-static", "images", "includeTitle" ], dataset: { for: "includeTitle" }, title: $locale( "includeTitle" ) } }
                                                        ]
                                                    }
                                                }
                                            ]
                                        }
                                    },
                                    {
                                        div: {
                                            class: [ "CG-item" ],
                                            _child: [
                                                {
                                                    div: {
                                                        class: [ "CG-icon" ],
                                                        id: "autoCategorize",
                                                        _child: [
                                                            { div: { class: [ "CG-rotate", "images", "circle" ] } },
                                                            { div: { class: [ "CG-static", "images", "category" ], dataset: { for: "autoCategorize" }, title: $locale( "autoCategorize" ) } }
                                                        ]
                                                    }
                                                }
                                            ]
                                        }
                                    },
                                    {
                                        div: {
                                            class: [ "CG-item" ],
                                            _child: [
                                                {
                                                    div: {
                                                        class: [ "CG-icon" ],
                                                        id: "saveOnLoad",
                                                        _child: [
                                                            { div: { class: [ "CG-rotate", "images", "circle" ] } },
                                                            { div: { class: [ "CG-static", "images", "download" ], dataset: { for: "saveOnLoad" }, title: $locale( "downloadOnLoad" ) } }
                                                        ]
                                                    }
                                                }
                                            ]
                                        }
                                    },
                                    {
                                        div: {
                                            class: [ "CG-item" ],
                                            _child: [
                                                {
                                                    div: {
                                                        class: [ "CG-icon" ],
                                                        id: "moveOnSave",
                                                        _child: [
                                                            { div: { class: [ "CG-rotate", "images", "circle" ] } },
                                                            { div: { class: [ "CG-static", "images", "move" ], dataset: { for: "moveOnSave" }, title: $locale( "moveOnDownload" ) } }
                                                        ]
                                                    }
                                                }
                                            ]
                                        }
                                    },
                                ]
                            }
                        },
                        {
                            div: {
                                class: [ "CG-moveChapter" ],
                                id: "moveNext",
                                title: $locale( "moveNext" )
                            }
                        },
                    ],
                }
            },
            {
                div: {
                    class: [ "CG-notification" ],
                    id: "CG-notification",
                    dataset: { count: 0 },
                }
            }
        ] );
        this.UINode = node;
        this.nBox = notification;
        return "UI structure generated";
    }

    async activateUI () {
        if ( !this.UINode ) throw "UI not ready";
        document.body.appendChild( this.UINode );
        document.body.appendChild( this.nBox );

        let holder = this;
        let ui = holder.UINode;
        if ( holder.state === constant.__loaded__ ) {
            //Attach event listeners
            function bind ( id, holder ) {
                let contentBox = holder.UINode.querySelector( `#${id}` );
                contentBox.value = holder.info[id];
                holder.addEventListener( "infochange", ( { data: { key, value } } ) => { if ( key === id ) { contentBox.value = value; } } );
                contentBox.addEventListener( "change", ( { target } ) => holder.info[id] = target.value.toFilename() );
            }
            function toggle ( { target }, force ) {
                let id = target.id || target.dataset.for, ui = holder.UINode;
                holder.info[id] = ui.querySelector( `#${id}` ).toggleAttribute( "active", force );
                if ( id === "includeTitle" && !holder.info.includeTitle )
                    toggle( { target: ui.querySelector( '#autoCategorize' ) } , holder.info.autoCategorize = true );
                if ( id === "autoCategorize" && !holder.info.autoCategorize )
                    toggle( { target: ui.querySelector( '#includeTitle' ) } , holder.info.includeTitle = true );
            }

            bind( "title", holder );
            bind( "episode", holder );
            bind( "downloadFolder", holder );

            ui.querySelector( `#movePrev` ).addEventListener( "click", holder.movePrev );
            ui.querySelector( `#moveNext` ).addEventListener( "click", holder.moveNext );
            for ( let id of [ "saveOnLoad", "moveOnSave", "includeTitle", "autoCategorize", "autoRename" ] ) {
                let node = ui.querySelector( `#${id}` );
                toggle( { target: node }, holder.info[id] );
                node.addEventListener( "click", toggle );
            }
            ui.querySelector( `#saveToLocal` ).addEventListener( "click", ( { target } ) => {
                let id = target.dataset.for;
                holder.downloadImages( {}, ui.querySelector( `#${id}` ) )
                    .then( filename => {
                        holder.notify( { brief: "Download completed", msg: `${filename} is downloded` } );
                        if ( holder.info.moveOnSave ) return holder.moveNext();
                    } )
                    .catch( filename => holder.notify( { brief: "Download failed", msg: `Failed to download. Reason: ${filename}` } ) );
            } );
        }
        holder.addEventListener( "statechange", ( { target: { state } } ) => {
            switch ( state ) {
                case constant.__downloading__: {
                    ui.querySelector( `#saveToLocal` ).toggleAttribute( "active", true );
                    break;
                }
                case constant.__ready__: {
                    ui.querySelector( `#saveToLocal` ).toggleAttribute( "active", false );
                    break;
                }
            }
        } );
        holder.addEventListener( "statechange", ( { target: { state } } ) => {
            if ( holder.info.saveOnLoad && state === constant.__ready__ ) ui.querySelector( `#saveToLocal` ).click();
        }, { once: true } );

        $client.runtime.onMessage.addListener( ( { action, data } ) => {
            if ( action === constant.__caution__ ) holder.notify( data, "CG-Caution" );
        } );
//        window.addEventListener( "keydown", ( { code, repeat } ) => { if ( !repeat && code == "F4" ) { this.resource.unload(); this.resource.load( "/ui/style.css" ); } } );
        return "UI activated";
    }

    async deactivateUI () {
        if ( !this.UINode.parentNode ) return "Already inactive";
        this.UINode.remove();
        this.resource.unload();

        return "UI deactivated";
    }

    notify ( msg, errFlag = "" ) {
        let nBox = this.nBox;
        ( function ( n, { brief, msg, src } ) {
            let [ layer ] = HTML.render( {
                div: {
                    class: ( errFlag.length ? [ "CG-message", errFlag ] : [ "CG-message" ] ),
                    _child: [
                        { div: { class: [ "notiTitle" ], _child: [ brief ] } },
                        { div: { class: [ "notiMsg" ], _child: [ msg, ( src ? { img: { src, CGNode: 1 } } : [] ) ] } },
                    ],
                    dataset: { n },
                    _todo: [
                        function ( node ) {
                            node.addEventListener( "animationend", () => {
                                node.remove();
                                nBox.toggleAttribute( "active", nBox.childNodes.length );
                            }, { once: true } );
                        }
                    ]
                }
            } );
            nBox.appendChild( layer );
            nBox.toggleAttribute( "active", nBox.childNodes.length );
        } )( ++nBox.dataset.count, msg );
    }

    downloadImages ( { filename, conflictAction, uri = document.URL, referer = location.hostname } ) {
        if ( !filename ) {
            if ( this.info.title === this.info.episode || this.info.episode === "" ) filename = `${this.info.downloadFolder}/${this.info.title}.zip`;
            else if ( this.info.autoCategorize && this.info.includeTitle ) filename = `${this.info.downloadFolder}/${this.info.title}/${this.info.title} ${this.info.episode}.zip`;
            else if ( !this.info.autoCategorize && this.info.includeTitle ) filename = `${this.info.downloadFolder}/${this.info.title} ${this.info.episode}.zip`;
            else filename = `${this.info.downloadFolder}/${this.info.title}/${this.info.episode}.zip`;
        }
        if ( this.info.autoRename ) conflictAction = "uniquify";
        switch ( this.state ) {
            case constant.__loaded__:
            case constant.__downloading__: {
                return Promise.reject( this.state );
            }
            case constant.__ready__: {
                if ( !this.images?.length ) return Promise.reject( constant.__nothing__ );
                this.changeState( constant.__downloading__ );
                return new Promise( ( resolve, reject ) => {
                    let holder = this;
                    holder.notify( { brief: "Download started", msg: `${filename}` } );
                    function listener ( { action, clientUid, data: { result, filename } }, sender ) {
                        if ( clientUid === holder.clientUid && action === "download" ) {
                            switch ( result ) {
                                case "Invalid filename":
                                case "interrupted": {
                                    reject( result );
                                    break;
                                }
                                case "complete": {
                                    resolve( filename );
                                    break;
                                }
                                default:{ return; }
                            }
                            $client.runtime.onMessage.removeListener( listener );
                            holder.changeState( constant.__ready__ );
                        }
                    }
                    $client.runtime.sendMessage( { message: Date.now(), clientUid: this.clientUid, action: "download", data: { filename, conflictAction, referer, images: this.images, uri } } );
                    $client.runtime.onMessage.addListener( listener );
                } );
            }
        }
    }

    ready ( msg ) {
        return new Promise( response => {
            function listener ( event ) {
                if ( event.target.state === constant.__ready__ ) response();
                else event.target.addEventListener( "statechange", listener, { once: true } );
            }
            if ( this.state === constant.__ready__ ) response();
            else {
                this.addEventListener( "statechange", listener, { once: true } );
            }
        } )
            .then( () => msg );
    }
}

export { Controller };
