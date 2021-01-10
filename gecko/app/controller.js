"use strict";
const { baseUri, pageUid } = ( () => {
    try { throw new Error() }
    catch ( { fileName } ) { return fileName.match( /(?<baseUri>^.+?\/\/.+?\/).*\#(?<pageUid>.+)/ ).groups; }
} )();
import { constant } from '/lib/constant.js';
import { HTML, logger, uid } from '/lib/extendVanilla.js';
import { resourceManager } from '/lib/resourceManager.js';
let $client, $locale;

class Controller extends EventTarget {
    constructor ( pageModule ) {
        super();
        Object.defineProperties( this, {
            clientUid: { value: uid(), writable: false, configurable: false, enumerable: false },
            pageModule: { value: pageModule, writable: false, configurable: false, enumerable: false },
            state: { value: constant.__loaded__, writable: true, configurable: false, enumerable: false },
            resource: { value: new resourceManager( baseUri ), writable: false, configurable: false, enumerable: false },
            UINode: { writable: true, configurable: true, enumerable: false },
        } );
        this.init()
            .then( msg => this.constructUI( ) )
            .then( msg => this.activateUI( ) )
            //.then( msg => logger.log( `UI for ${$client.runtime.getManifest().name } is activated.` ) )
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

        for ( let key of [ "saveOnLoad", "moveOnSave" ] ) info[key] = JSON.parse( sessionStorage.getItem( key ) )?.value || false;
        for ( let key of [ "includeTitle" ] ) info[key] = JSON.parse( localStorage.getItem( key ) )?.value || false;
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
        $client = ( await import( `/lib/browserUnifier.js#${pageUid}` ) ).$client;
        await $client.complete; //Polyfill browser api for Firefox
        $locale = $client.i18n.getMessage;
        let { moveNext, movePrev, info, images } = await this.pageModule();
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
                    className: "ComicGrabber CG-menu",
                    _child: [
                        {
                            div: {
                                className: "CG-menuButton",
                                id: "menuButton"
                            }
                        },
                        {
                            div: {
                                className: "CG-moveChapter",
                                id: "movePrev",
                                textContent: $locale( "movePrev" )
                            }
                        },
                        {
                            div: {
                                className: "CG-list",
                                _child: [
                                    {
                                        div: {
                                            className: "CG-item",
                                            _child: [
                                                {
                                                    div: {
                                                        className: "CG-label",
                                                        _child: [ { label: { htmlFor: "downloadFolder", textContent: $locale( "downloadFolder" ) } } ]
                                                    }
                                                },
                                                {
                                                    div: {
                                                        className: "CG-text",
                                                        _child: [ { input: { id: "downloadFolder", type: "text" } } ]
                                                    }
                                                }
                                            ]
                                        }
                                    },
                                    {
                                        div: {
                                            className: "CG-item",
                                            _child: [
                                                {
                                                    div: {
                                                        className: "CG-label",
                                                        _child: [ { label: { htmlFor: "title", textContent: $locale( "comicTitle" ) } } ]
                                                    }
                                                },
                                                {
                                                    div: {
                                                        className: "CG-text",
                                                        _child: [ { input: { id: "title", type: "text" } } ]
                                                    }
                                                }
                                            ]
                                        }
                                    },
                                    {
                                        div: {
                                            className: "CG-item",
                                            _child: [
                                                {
                                                    div: {
                                                        className: "CG-label",
                                                        _child: [ { label: { htmlFor: "episode", textContent: $locale( "comicEpisode" ) } } ]
                                                    }
                                                },
                                                {
                                                    div: {
                                                        className: "CG-text",
                                                        _child: [ { input: { id: "episode", type: "text" } } ]
                                                    }
                                                }
                                            ]
                                        }
                                    },
                                    {
                                        div: {
                                            className: "CG-item",
                                            _child: [
                                                {
                                                    div: {
                                                        className: "CG-row", id: "filenameRuleResult", _child: [ { label: {} }, { label: {} }, ]
                                                    }
                                                }
                                            ]
                                        }
                                    },
                                    {
                                        div: {
                                            className: "CG-item",
                                            _child: [
                                                {
                                                    div: {
                                                        className: "CG-row",
                                                        _child: [ { label: { className: "CG-checkbox", id: "saveToLocal", textContent: $locale( "downloadImages" ) } } ]
                                                    }
                                                }
                                            ]
                                        }
                                    },
                                    {
                                        div: {
                                            className: "CG-item",
                                            _child: [
                                                {
                                                    div: {
                                                        className: "CG-row",
                                                        _child: [ { label: { className: "CG-checkbox", id: "includeTitle", textContent: $locale( "includeTitle" ) } } ]
                                                    }
                                                }
                                            ]
                                        }
                                    },
                                    {
                                        div: {
                                            className: "CG-item",
                                            _child: [
                                                {
                                                    div: {
                                                        className: "CG-row",
                                                        _child: [ { label: { className: "CG-checkbox", id: "saveOnLoad", textContent: $locale( "downloadOnLoad" ) } } ]
                                                    }
                                                }
                                            ]
                                        }
                                    },
                                    {
                                        div: {
                                            className: "CG-item",
                                            _child: [
                                                {
                                                    div: {
                                                        className: "CG-row",
                                                        _child: [ { label: { className: "CG-checkbox", id: "moveOnSave", textContent: $locale( "moveOnDownload" ) } } ]
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
                                className: "CG-moveChapter",
                                id: "moveNext",
                                textContent: $locale( "moveNext" )
                            }
                        },
                    ],
                }
            },
            {
                div: {
                    className: "CG-notification",
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
        this.resource.load( "/ui/style.css" );
        let holder = this;
        if ( holder.state === constant.__loaded__ ) {
            //Attach event listeners
            function bind ( id, holder ) {
                let contentBox = holder.UINode.querySelector( `#${id}` );
                contentBox.value = holder.info[id];
                holder.addEventListener( "infochange", ( { data: { key, value } } ) => { if ( key === id ) { contentBox.value = value; } } );
                contentBox.addEventListener( "change", ( { target } ) => holder.info[id] = target.value.toFilename() );
            }
            function toggle ( { target }, force ) {
                holder.info[target.id] = target.toggleAttribute( "active", force );
            }

            bind( "title", holder );
            bind( "episode", holder );
            bind( "downloadFolder", holder );

            holder.UINode.querySelector( `#movePrev` ).addEventListener( "click", holder.movePrev );
            holder.UINode.querySelector( `#moveNext` ).addEventListener( "click", holder.moveNext );
            for ( let id of [ "saveOnLoad", "moveOnSave", "includeTitle" ] ) {
                let node = holder.UINode.querySelector( `#${id}` );
                toggle( { target: node }, holder.info[id] );
                node.addEventListener( "click", toggle );
            }
            holder.UINode.querySelector( `#saveToLocal` ).addEventListener( "click", ( { target} ) => {
                target.toggleAttribute( "active" );
                holder.downloadImages( {} )
                    .then( filename => {
                        holder.notify( { brief: "Download completed", msg: `${filename} is downloded` } );
                        if ( holder.info.moveOnSave ) return holder.moveNext();
                    } )
                    .catch( filename => holder.notify( { brief: "Download failed", msg: `Failed to download. Reason: ${filename}` } ) )
                    .finally( () => target.toggleAttribute( "active" ) )
            } );
        }
        holder.addEventListener( "statechange", ( { target: { state } } ) => {
            if ( holder.info.saveOnLoad && state === constant.__ready__ ) holder.UINode.querySelector( `#saveToLocal` ).click();
        }, { once: true } );

        document.body.appendChild( this.UINode );
        document.body.appendChild( this.nBox );

        return "UI activated";
    }

    async deactivateUI () {
        if ( !this.UINode.parentNode ) return "Already inactive";
        this.UINode.remove();
        this.resource.unload();

        return "UI deactivated";
    }

    notify ( msg, duration = 5000 ) {
        let nBox = this.nBox;
        ( function ( n, { brief, msg } ) {
            let [ layer ] = HTML.render( {
                div: {
                    className: "message",
                    _child: [
                        { div: { className: "notiTitle", _child: [ brief ] } },
                        { div: { className: "notiMsg", _child: [ msg ] } }
                    ],
                    dataset: { n },
                    _todo: [
                        function ( node ) {
                            setTimeout( () => {
                                //node.remove();
                                nBox.toggleAttribute( "active", nBox.childNodes.length );
                            }, duration );
                        }
                    ]
                }
            } );
            nBox.appendChild( layer );
            nBox.toggleAttribute( "active", nBox.childNodes.length );
        } )( ++nBox.dataset.count, msg );
    }

    downloadImages ( { filename, conflictAction, uri = document.URL } ) {
        if ( !filename ) {
            if ( this.info.title === this.info.episode ) filename = `${this.info.downloadFolder}/${this.info.title}.zip`;
            else if ( this.info.includeTitle ) filename = `${this.info.downloadFolder}/${this.info.title}/${this.info.title} ${this.info.episode}.zip`;
            else filename = `${this.info.downloadFolder}/${this.info.title}/${this.info.episode}.zip`;
        }
        switch ( this.state ) {
            case constant.__loaded__:
            case constant.__downloading__: {
                return Promise.reject( this.state );
            }
            case constant.__ready__: {
                if ( !this.images.length ) return Promise.reject( constant.__nothing__ );
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
                    $client.runtime.sendMessage( { message: Date.now(), clientUid: this.clientUid, action: "download", data: { filename, conflictAction, images: this.images, uri } } );
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
