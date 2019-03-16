"use strict";
import 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.5/jszip.js';
import { StorageManager } from './library.util.js';
import './library.extend.js';
import { HTML } from './library.HTML.js';
import { ImageGrabber } from './ImageGrabber.js';
import { Locale } from './ComicGrabber.locale.js';
import { decypher } from './decypher.js';
import { CommunicationTunnel } from './library.webExtension.js';
const $filenameRule = '${localPath}/${title}${( title !== subTitle ? "/" + subTitle : "" )}';
const $defaultDelay = 9000;
let $fillCircle = false;

class ComicGrabber {
    constructor ( grabber, { $session, $local, configuration, generalExpression } ) {
        Object.defineProperties( this, {
            grabber: { value: grabber },
            $session: { value: $session.storage },
            $local: { value: $local.storage },
            $localized: { value: Locale[ configuration.lang || "ko-kr" ] },
            $memory: { value: { title: "", subTitle: "", complete: false } },
            move: { value: { next: configuration.moveNext, prev: configuration.movePrev } },
        } );
        if ( window.img_list ) {
            //Mimic original
            $(function () {
                var e = [];
                for (var t in img_list) e.push("<option value='" + t + "'>" + (Number(t) + 1) + " 페이지</option>");
                var n = null,
                    a = only_chapter.map(function (e, t) {
                        return e[1] == chapter && (n = t), "<option value='" + e[1] + "' " + (e[1] == chapter ? "selected" : "") + " >" + e[0] + "</option>"
                    });
                $(".chapter_selector").html(a.join("\n")), $(".chapter_selector").change(function () {
                    location.href = "/bbs/board.php?bo_table=msm_manga&wr_id=" + $(this).val()
                }), $(".chapter_prev").click(function () {
                    location.href = "/bbs/board.php?bo_table=msm_manga&wr_id=" + only_chapter[n + 1][1]
                }), $(".chapter_next").click(function () {
                    location.href = "/bbs/board.php?bo_table=msm_manga&wr_id=" + only_chapter[n - 1][1]
                }), 0 == n && $(".chapter_next").css("display", "none"), n >= only_chapter.length - 1 && $(".chapter_prev").css("display", "none"), null == n && ($(".chapter_prev").css("display", "none"), $(".chapter_next").css("display", "none"), $(".chapter_selector").css("display", "none"))
            })
        }
        this.injectController();
        if ( configuration instanceof Object ) {
            if ( configuration.subject ) {
                Object.assign( this.$memory, this.analyseInformation( configuration.subject, generalExpression ) );
            }
            if ( configuration.images ) {
                if ( window.img_list ) {
                    let dc = new decypher( view_cnt );
                    let list = [];
                    if ( view_cnt !== 0 ) {
                        for ( const uri of img_list ) {
                            list.push( dc.restoreImage( uri, 0, this.$local.imageType ).then( blob => {
                                let image = new Image();
                                image.crossOrigin = 'anonymous';
                                image.src = URL.createObjectURL( blob );
                                return image;
                            } ) );
                        }
                    }
                    else {
                        for ( const uri of img_list ) {
                            list.push( new Promise( resolve => {
                                let image = new Image();
                                image.crossOrigin = 'anonymous';
                                image.src = uri;
                                //image.addEventListener( 'load', () => resolve( image ) );
                                resolve( image );
                            } ) );
                        }
                    }
                    Promise.all( list ).then( list => {
                        let container = document.querySelector( '.view-content' );
                        let box = container.cloneNode();
                        container.replaceWith( box );
                        for ( const item of list ) {
                            box.appendChild( item );
                        }
                        return box.childNodes;
                    } ).then( nodelist => this.attachProgressEvent( grabber.grabImages( nodelist ) ) );
                }
                else this.attachProgressEvent( grabber.grabImages( document.querySelectorAll( configuration.images ) ) );
            }
        }
        $local.addEventListener( "updated", () => this.syncModelView( "MtV" ) );
        $session.addEventListener( "updated", () => this.syncModelView( "MtV" ) );
        if ( !this.syncModelView( "MtV" ) && this.$session.saveOnLoad && this.$session.moveOnSave ) {
            console.log( `%cTry to reload automatically after ${$defaultDelay} ms.`, $inform );
            this.notify( this.$localized.tryToReload );
            setTimeout( () => location.reload(), $defaultDelay * 2 );
        }
        window.addEventListener( "beforeunload", () => {
            this.notify( this.$localized.leavingPage, true );
        } );
        window.addEventListener( "load", () => {
            document.body.destroyEventListener();
            document.destroyEventListener();
        } );
    }

    notify ( textContent, infinite ) {
        let [ node ] = HTML.render( { div: { textContent } } );
        this.notification.appendChild( node );
        if ( !infinite ) setTimeout( () => this.notification.removeChild( node ), $defaultDelay );
    }

    moveChapter ( selector ) {
        console.log( `%cTry to change chapter...`, $log );
        this.notify( this.$localized.tryToLeave )
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
            this.element.querySelector( "#saveToLocal" ).textContent = `${this.$localized.saveToLocal} (${ref.count.loaded}/${ref.count.total})`;
            
            if ( ref.count.loaded === ref.count.total && !this.$memory.complete ) {
                this.$memory.complete = !this.$memory.complete;
                console.log( `%cEvery image was loaded.`, $log );
                console.log( `%cNow you can save images immediately.`, $inform );
                if ( this.$session.saveOnLoad ) {
                    this.element.querySelector( ".CG-row .CG-checkbox#saveToLocal" ).click();
                }
            }
        }
    
        let grabber = this;
        let fn = function ( { lengthComputable, loaded, total } ) {
            Object.defineProperties( this, { progressEvent: { value: { lengthComputable, loaded, total }, writable: false, configurable: true }, } );
            showProgress.call( grabber, images );
        };
        for ( let image of images ) image.addEventListener( "progress", fn );
        window.addEventListener( "focus", () => showProgress.call( grabber, images ) );
    }

    drawProgressCircle ( progress ) {
        let canvas = this.element.querySelector( ".CG-load-progress" );
        let context = canvas.getContext( "2d" );
        let { radius } = canvas.dataset;
        if ( $fillCircle ) {
            context.strokeStyle = "rgba( 0, 256, 128, 0.95 )";
            context.lineWidth = radius / 2 + 2;
        }
        else {
            context.strokeStyle = "rgba( 0, 256, 0, 0.95 )";
            context.lineWidth = 4;
        }
        context.clearRect( 0, 0, canvas.width, canvas.height );
        context.beginPath();
        context.arc( canvas.width / 2, canvas.height / 2, ( radius - context.lineWidth ) / 2 + 1, -0.5 * Math.PI, ( progress * 2 - 0.5 ) * Math.PI );
        context.stroke();
    }

    syncModelView ( syncWay, { cK, cV } = {} ) {
        let el = this.element;
        switch ( syncWay ) {
            case "MtV": {
                for ( const item of el.querySelectorAll( '.CG-menu .CG-item .CG-text [id]' ) ) {
                    if ( item.id in this.$memory ) item.value = this.$memory[ item.id ];
                    else if ( item.id in this.$session ) item.value = this.$session[ item.id ];
                    else if ( item.id in this.$local ) item.value = this.$local[ item.id ];
                }
                for ( const item of el.querySelectorAll( '.CG-menu .CG-item .CG-checkbox[id]' ) ) {
                    let value;
                    if ( item.id in this.$memory ) value = this.$memory[ item.id ];
                    else if ( item.id in this.$session ) value = this.$session[ item.id ];
                    else if ( item.id in this.$local ) value = this.$local[ item.id ];
                    else continue;

                    if ( value ) {
                        item.classList.add( "checked" );
                        item.parentNode.classList.remove( "CG-SelectiveInvisible" );
                    }
                    else {
                        item.classList.remove( "checked" );
                        item.parentNode.classList.add( "CG-SelectiveInvisible" );
                    }
                }
                if ( this.$local.filenameRule === $filenameRule ) {
                    el.querySelector( '.CG-menu .CG-item .CG-text #filenameRule' ).value = "default";
                    el.querySelector( `.CG-menu .CG-item #filenameRuleManual` ).parentNode.parentNode.classList.add( "CG-invisible" );
                    el.querySelector( `.CG-menu .CG-item #filenameRuleManual` ).disabled = true;
                }
                else {
                    el.querySelector( '.CG-menu .CG-item .CG-text #filenameRule' ).value = "manual";
                    el.querySelector( '.CG-menu .CG-item .CG-text #filenameRuleManual' ).value = this.$local.filenameRule;
                    el.querySelector( `.CG-menu .CG-item #filenameRuleManual` ).parentNode.parentNode.classList.remove( "CG-invisible" );
                    el.querySelector( `.CG-menu .CG-item #filenameRuleManual` ).disabled = false;
            }
                break;
            }
            case "VtM": {
                if ( cK === "filenameRuleManual" ) cK = "filenameRule";
                else if ( cK !== "filenameRule" && typeof cV === "string" ) {
                    cV = cV.toFilename();
                    el.querySelector( `.CG-menu .CG-item #${cK}` ).value = cV;
                }
                else if ( cK === "filenameRule" ) {
                    if ( cV === "default" ) {
                        cV = $filenameRule;
                        el.querySelector( `.CG-menu .CG-item #filenameRuleManual` ).parentNode.parentNode.classList.add( "CG-invisible" );
                        el.querySelector( `.CG-menu .CG-item #filenameRuleManual` ).disabled = true;
                    }
                    else {
                        cV = el.querySelector( `.CG-menu .CG-item #filenameRuleManual` ).value;
                        el.querySelector( `.CG-menu .CG-item #filenameRuleManual` ).parentNode.parentNode.classList.remove( "CG-invisible" );
                        el.querySelector( `.CG-menu .CG-item #filenameRuleManual` ).disabled = false;
                    }
                }
                if ( cK in this.$memory ) this.$memory[ cK ] = cV;
                else if ( cK in this.$session ) this.$session[ cK ] = cV;
                else if ( cK in this.$local ) this.$local[ cK ] = cV;
                if ( cK === "title" ) this.$session[ cK ] = cV;
                break;
            }
        }
        
        //Preview save name
        this.interpretFilenameRule( {
            localPath: this.$local.savePath,
            filenameRule: this.$local.filenameRule,
            title: this.$memory.title,
            subTitle: this.$memory.subTitle
        } )
        .then(
            result =>
            [ ...document.querySelectorAll( ".CG-menu .CG-item #filenameRuleResult label" ) ].forEach( node => node.textContent = result )
        )
        .then( () => {
            document.querySelector( ".CG-menu .CG-item #filenameRuleResult" ).classList.remove( "CG-SelectiveInvisible" );
            setTimeout( () => document.querySelector( ".CG-menu .CG-item #filenameRuleResult" ).classList.add( "CG-SelectiveInvisible" ), $defaultDelay );
        } );
        //Toggle alert
        if ( !( this.$local.savePath && this.$memory.title && this.$memory.subTitle ) ) {
            console.log( `%cSome configuration has an error.`, $alert );
            this.element.querySelector( ".CG-menu-button" ).classList.add( "CG-alert" );
            return false;
        }
        else {
            console.log( `%cAll configuration has no error.`, $inform );
            this.element.querySelector( ".CG-menu-button" ).classList.remove( "CG-alert" );
            return true;
        }
    }

    injectController () {
        if ( this.element ) throw "Already inserted";
        console.log( `%cBuild controller.`, $log );
        let [ node ] = HTML.render( {
            div: {
                className: "ComicGrabber CG-menu",
                _child: [
                    { canvas: { className: "CG-load-progress" } },
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
                                                    _child: [
                                                        {
                                                            label: {
                                                                htmlFor: "savePath",
                                                                textContent: this.$localized.savePath
                                                            }
                                                        }
                                                    ]
                                                }
                                            },
                                            {
                                                div: {
                                                    className: "CG-text",
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
                                        className: "CG-item",
                                        _child: [
                                            {
                                                div: {
                                                    className: "CG-label",
                                                    _child: [
                                                        {
                                                            label: {
                                                                htmlFor: "title",
                                                                textContent: this.$localized.comicTitle
                                                            }
                                                        }
                                                    ]
                                                }
                                            },
                                            {
                                                div: {
                                                    className: "CG-text",
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
                                        className: "CG-item",
                                        _child: [
                                            {
                                                div: {
                                                    className: "CG-label",
                                                    _child: [
                                                        {
                                                            label: {
                                                                htmlFor: "subTitle",
                                                                textContent: this.$localized.comicSubTitle
                                                            }
                                                        }
                                                    ]
                                                }
                                            },
                                            {
                                                div: {
                                                    className: "CG-text",
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
                                        className: "CG-item",
                                        _child: [
                                            {
                                                div: {
                                                    className: "CG-label",
                                                    _child: [
                                                        {
                                                            label: {
                                                                htmlFor: "onConflict",
                                                                textContent: this.$localized.download.onDuplicated
                                                            }
                                                        }
                                                    ]
                                                }
                                            },
                                            {
                                                div: {
                                                    className: "CG-text",
                                                    _child: [
                                                        {
                                                            select: {
                                                                className: "CG-select",
                                                                id: "onConflict",
                                                                _child: [
                                                                    {
                                                                        option: {
                                                                            value: "uniquify",
                                                                            textContent: this.$localized.download.uniquify
                                                                        }
                                                                    },
                                                                    {
                                                                        option: {
                                                                            value: "overwrite",
                                                                            textContent: this.$localized.download.overwrite
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
                                        className: "CG-item",
                                        _child: [
                                            {
                                                div: {
                                                    className: "CG-label",
                                                    _child: [
                                                        {
                                                            label: {
                                                                htmlFor: "filenameRule",
                                                                textContent: this.$localized.filename.filenameRule
                                                            }
                                                        }
                                                    ]
                                                }
                                            },
                                            {
                                                div: {
                                                    className: "CG-text",
                                                    _child: [
                                                        {
                                                            select: {
                                                                className: "CG-select",
                                                                id: "filenameRule",
                                                                _child: [
                                                                    {
                                                                        option: {
                                                                            value: "default",
                                                                            textContent: this.$localized.filename.recommend
                                                                        }
                                                                    },
                                                                    {
                                                                        option: {
                                                                            value: "manual",
                                                                            textContent: this.$localized.filename.manual
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
                                        className: "CG-item CG-invisible",
                                        _child: [
                                            {
                                                div: {
                                                    className: "CG-text",
                                                    _child: [
                                                        {
                                                            input: {
                                                                id: "filenameRuleManual",
                                                                type: "text",
                                                                placeholder: $filenameRule,
                                                                disabled: true
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
                                        className: "CG-item",
                                        _child: [
                                            {
                                                div: {
                                                    className: "CG-row CG-OutSide",
                                                    id: "filenameRuleResult",
                                                    _child: [
                                                        { label: {} },
                                                        { label: {} },
                                                    ]
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
                                                    _child: [
                                                        {
                                                            label: {
                                                                className: "CG-checkbox",
                                                                id: "showGrabbedImages",
                                                                textContent: `${this.$localized.showGrabbedImages}`
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
                                        className: "CG-item",
                                        _child: [
                                            {
                                                div: {
                                                    className: "CG-row",
                                                    _child: [
                                                        {
                                                            label: {
                                                                className: "CG-checkbox",
                                                                id: "copyShareLink",
                                                                textContent: `${this.$localized.copyShareLink}`
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
                                        className: "CG-item",
                                        _child: [
                                            {
                                                div: {
                                                    className: "CG-row",
                                                    _child: [
                                                        {
                                                            label: {
                                                                className: "CG-checkbox",
                                                                id: "saveToLocal",
                                                                textContent: `${this.$localized.saveToLocal} (0/${this.grabber.captured.length})`
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
                                        className: "CG-item",
                                        _child: [
                                            {
                                                div: {
                                                    className: "CG-row CG-OutSide CG-Second CG-SelectiveInvisible",
                                                    _child: [
                                                        {
                                                            label: {
                                                                className: "CG-checkbox",
                                                                id: "saveOnLoad",
                                                                textContent: this.$localized.saveOnLoad
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
                                        className: "CG-item",
                                        _child: [
                                            {
                                                div: {
                                                    className: "CG-row CG-OutSide CG-First CG-SelectiveInvisible",
                                                    _child: [
                                                        {
                                                            label: {
                                                                className: "CG-checkbox",
                                                                id: "moveOnSave",
                                                                textContent: this.$localized.moveOnSave
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
                                        className: "CG-item",
                                        _child: [
                                            {
                                                div: {
                                                    className: "CG-row",
                                                    _child: [
                                                        {
                                                            label: {
                                                                className: "CG-moveChapter",
                                                                id: "movePrev",
                                                                textContent: this.$localized.movePrev
                                                            }
                                                        },
                                                        {
                                                            label: {
                                                                className: "CG-moveChapter",
                                                                id: "moveNext",
                                                                textContent: this.$localized.moveNext
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
                    { div: { className: "CG-menu-button" } },
                    { div: { className: "CG-menu-cover", textContent: this.$localized.saveOnLoad + this.$localized.moveOnSave } },
                    { div: { className: "CG-notice" } },
                ],
                _todo: node => {
                    for ( const item of node.querySelectorAll( "input[type=text], select" ) ) {
                        item.addEventListener( "change", () => this.syncModelView( "VtM", { cK: item.id, cV: item.value } ) );
                    }
                    for ( const item of node.querySelectorAll( ".CG-row .CG-checkbox:not(#saveToLocal):not(#showGrabbedImages)" ) ) {
                        item.addEventListener( "click", () => {
                            item.classList.toggle( "checked" );
                            item.parentNode.classList.toggle( "CG-SelectiveInvisible" );
                            this.syncModelView( "VtM", { cK: item.id, cV: item.classList.contains( "checked" ) } );
                        } );
                    }
                    node.querySelector( ".CG-row .CG-checkbox#copyShareLink" ).addEventListener( "click", async () => {
                        let list = [];
                        for ( const node of document.querySelectorAll( "img[src*=blob]" ) ) {
                            list.push( node.fetchUri );
                        }
                        let urlWithHash = `https://extension.isitea.net/shareImages#${await ( new JSZip() ).file( "grabbedImageList", new Blob( [ JSON.stringify( { title: this.$memory.title, subTitle: this.$memory.subTitle, reference: document.URL, images: list } ) ], { type: "plain/text" } ) ).generateAsync( { type: "base64", compression: "DEFLATE", compressionOptions: { level: 9 } } )}`;
                        let shortenUrl = await ( await fetch( `//tinyurl.com/api-create.php?url=${encodeURIComponent( urlWithHash )}` ) ).text();
                        
                        node.querySelector( ".CG-row .CG-checkbox#copyShareLink" ).parentNode.replaceWith( ...HTML.render( {
                            div: {
                                className: "CG-text",
                                _child: [
                                    {
                                        input: {
                                            type: "text",
                                            id: "sharedLink",
                                            value: shortenUrl,
                                        }
                                    }
                                ]
                            }
                        } ) );
                        {
                            const element = node.querySelector( ".CG-row #sharedLink" );
                            element.focus();
                            element.select();
                        }
                    } );
                    node.querySelector( ".CG-row .CG-checkbox#showGrabbedImages" ).addEventListener( "click", () => {
                        for ( const node of document.querySelectorAll( "img[src*=blob]" ) ) node.classList.add( "emphasis" );
                        setTimeout( () => {
                            for ( const node of document.querySelectorAll( "img[src*=blob]" ) ) node.classList.remove( "emphasis" );
                        }, $defaultDelay );
                    } );
                    let saveToLocal = () => {
                        console.log( `%cSave images to local as zip archive.`, $log );
                        if ( this.element.querySelector( ".CG-menu-button" ).classList.contains( "CG-alert" ) ) return this.notify( this.$localized.fillTextboxes );
                        node.querySelector( ".CG-row .CG-checkbox#saveToLocal" ).classList.toggle( "checked" );
                        //node.querySelector( ".CG-row .CG-checkbox#saveToLocal" ).removeEventListener( "click", saveToLocal );
                        this.saveToLocal(
                            {
                                localPath: this.$local.savePath,
                                onConflict: this.$local.onConflict,
                                filenameRule: this.$local.filenameRule,
                                title: this.$memory.title,
                                subTitle: this.$memory.subTitle
                            }
                        )
                        .then( download => {
                            console.log( `%cSend download information to downloader.`, $log );
                            $tunnel.broadcast( "ComicGrabber.saveArchive", download );

                            return new Promise( resolve => $tunnel.addListener( "ComicGrabber.archiveSaved", resolve ) );
                        } )
                        .then( () => {
                            console.log( `%cArchive saved.`, $inform );
                            $fillCircle = true;
                            this.drawProgressCircle( 1 );
                            if ( this.$session.moveOnSave ) this.moveChapter( this.move.next );
                        } );
                    };
                    node.querySelector( ".CG-row #moveNext" ).addEventListener( "click", () => this.moveChapter( this.move.next ) );
                    node.querySelector( ".CG-row #movePrev" ).addEventListener( "click", () => this.moveChapter( this.move.prev ) );
                    node.querySelector( ".CG-row .CG-checkbox#saveToLocal" ).addEventListener( "click", saveToLocal );
                    return node;
                },
            }
        } );
        document.body.appendChild( node );
        let getRealSize = () => {
            let menu = node.querySelector( ".CG-menu-button" );
            if ( menu.clientHeight && menu.clientWidth ) {
                let canvas = node.querySelector( ".CG-load-progress" );
                canvas.width = menu.clientWidth * 1.1;
                canvas.height = menu.clientHeight * 1.1;
                canvas.dataset.radius = menu.clientWidth;
            }
            else setTimeout( getRealSize, 100 );
        };
        setTimeout( getRealSize, 0 );

        Object.defineProperties( this, { element: { value: node }, notification: { value: node.querySelector( ".CG-notice" ) } } );
    }

    /**
     * Analyse title and sub-title of this page.
     * @param {{ title: { selector: String, propertyChain: String, exp: String }, subTitle: { selector: String, propertyChain: String, exp: String }, generalExpression: String }}
     * @returns {{ title: string, subTitle: string }}
     */
    analyseInformation ( { title, subTitle, siteExpression }, generalExpression ) {
        console.log( `%cTry to recognize title and sub-title...`, $log );
        let result = { title: "", subTitle: "" };
        try {
            if ( this.$session.title ) {
                console.log( `%cTry to apply previous user modification...`, $log );
                result.title = this.$session.title;
                let $subTitle = document.querySelector( title.selector ).readProperty( title.propertyChain ).toFilename().replace( result.title, "" ).replace( new RegExp( title.exp || "(.+)" ), "$1" );
                if ( $subTitle ) {
                    if ( $subTitle !== document.querySelector( title.selector ).readProperty( title.propertyChain ).toFilename().replace( new RegExp( title.exp || "(.+)" ), "$1" ) ) result.subTitle = $subTitle;
                    else {
                        console.log( `%cApplying prvious user modification is failed.`, $inform );
                        delete this.$session.title;
                        if ( this.$session.saveOnLoad ) console.log( `%cDisable save on load function.`, $inform );
                        this.$session.saveOnLoad = false;
                        return this.analyseInformation( { title, subTitle, siteExpression, generalExpression }, generalExpression );
                    }
                }
                else $subTitle = document.querySelector( subTitle.selector ).readProperty( subTitle.propertyChain ).toFilename().replace( new RegExp( subTitle.exp || "(.+)" ), "$1" );
                console.log( `%cPrevious user modification is applied.`, $inform );
            }
            else  {
                if ( title && subTitle ) {
                    let $subTitle = document.querySelector( subTitle.selector ).readProperty( subTitle.propertyChain ).toFilename().replace( new RegExp( subTitle.exp || "(.+)" ), "$1" );
                    let $title = document.querySelector( title.selector ).readProperty( title.propertyChain ).toFilename().replace( new RegExp( title.exp || "(.+)" ), "$1" );
                    if ( $subTitle.length > $title.length ) $subTitle = $subTitle.replace( $title, "" ).toFilename();
                    else if ( $subTitle.length < $title.length ) $title = $title.replace( $subTitle, "" ).toFilename();
                    result = { title: $title || "", subTitle: $subTitle || "" };
                }
                else {
                    console.log( `%cTry to distinguish title and sub title...`, $inform );
                    const expression  = siteExpression || generalExpression;
                    let { title: $title, subTitle: $subTitle } = document.querySelector( title.selector ).readProperty( title.propertyChain ).toFilename().match( new RegExp( expression ) ).groups;
                    result = { title: $title || "", subTitle: $subTitle || "" };
                }
            }
            console.log( `%cSuccessfully recognized.`, $log );
        }
        catch ( e ) {
            console.log( `%cRecognition failed.`, $alert );
        }

        return result;
    }
    
    async interpretFilenameRule ( { localPath, filenameRule, title, subTitle } ) {
        let webWorker = new Worker( URL.createObjectURL( new Blob( [
`"use strict";
addEventListener( "message", async ( { data: { localPath, title, subTitle } } ) => {
    postMessage( \`${filenameRule || $filenameRule}\` );
    close();
} );`
        ], { type: "plain/text" } ) ) );
        return ( await new Promise( resolve => {
            webWorker.addEventListener( "message", ( { data: filename } ) => resolve( filename ) );
            webWorker.postMessage( { localPath, title, subTitle } );
        } ) ).split( "/" ).reduce( ( name, path ) => `${name}/${path.toFilename()}` , "" ).substr( 1 ) + ".zip";
    }

    /**
     * Make download option object for download api.
     * @param {{ localPath: String, onConflict: String, title: String, subTitle: String }}
     * @returns {Promise<Object>}
     */
    async saveToLocal ( { localPath, onConflict, filenameRule, title, subTitle } ) {
        console.log( `%cSolidates image data as a zip archive.`, $log );
        let zip = await this.grabber.solidateImages();
        zip.file( 'Downloaded from.txt', new Blob( [ document.URL ], { type: 'text/plain' } ) );
        let blob = await zip.generateAsync( { type: "blob" } );
        console.log( `%cSolidation completed.`, $inform );

        return {
            blob,
            url: URL.createObjectURL( blob ),
            filename: await this.interpretFilenameRule( { localPath, filenameRule, title, subTitle } ),
            conflictAction: onConflict
        }
    }
}

function activateExtension ( { keyboard, configuration, session, local, generalExpression } ) {
    console.log( `%cRead previous configuration from sessionStorage.`, $log );
    const $session = new StorageManager(
        sessionStorage,
        "ComicGrabber",
        session
    );
    console.log( `%cRead previous configuration from localStorage.`, $log );
    const $local = new StorageManager(
        localStorage,
        "ComicGrabber",
        local
    );
    console.log( `%cRecognition data received.`, $log );
    const comic = new ComicGrabber( new ImageGrabber(), { $session, $local, configuration, generalExpression } );
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

console.log( `%cRemove rebundant event listeners`, $log );
const $REL = [ ...document.querySelectorAll( [ "oncopy", "oncut", "onpaste", "oncontextmenu" ].reduce( ( query, event ) => { query.push( `[${event}*=false]` ); return query; }, [ "body" ] ).join( ", " ) ) ];
for ( const item of $REL ) item.destroyEventListener();

const $tunnel = new CommunicationTunnel( ( () => { try { return browser; } catch ( e ) { return chrome; } } )() );
$tunnel.addListener( "ComicGrabber.activateExtension", activateExtension );
console.log( `%cRequest recognition data.`, $log );
$tunnel.broadcast( "ComicGrabber.readyExtension" );

