"use strict";
import { HTML, logger } from '/lib/extendVanilla.js';
import { resourceManager } from '/lib/resourceManager.js';
import { $client } from '/lib/unifyBrowser.js';

const log = logger.log;

class Controller {
    constructor ( baseUri ) {
        this.resource = new resourceManager( baseUri );
        this.constructUI().then( ctrl => ctrl.activateUI() ).then( ctrl => log( `UI for ${$client.runtime.getManifest().className} is activated.` ) );
    }

    async constructUI () {
        let [ node ] = HTML.render( {
            div: {
                className: "ComicGrabber CG-menu",
                _child: [
                    {
                        label: {
                            className: "CG-menuButton",
                            id: "menuButton"
                        }
                    },
                    {
                        label: {
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
                                                    _child: [ { label: { htmlFor: "subTitle", textContent: $locale( "comicEpisode" ) } } ]
                                                }
                                            },
                                            {
                                                div: {
                                                    className: "CG-text",
                                                    _child: [ { input: { id: "subTitle", type: "text" } } ]
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
                        label: {
                            className: "CG-moveChapter",
                            id: "moveNext",
                            textContent: $locale( "moveNext" )
                        }
                    },
                ],
            }
        } );
        this.UINode = node;

        return this;
    }

    async activateUI () {
        this.resource.load( "/UI/style.css" );
        document.body.appendChild( this.UINode );

        return this;
    }

    async deactivateUI () {
        if ( !this.UINode ) return "Already inactive";
        this.UINode.remove();
        this.UINode = null;
        this.resource.unload();

        return this;
    }

    async downloadImages ( { filename, conflictAction, images, uri } ) {
        $client.runtime.sendMessage( { message: Date.now(), action: "download", data: { filename, conflictAction, images, uri } } );
    
        return this;
    }
}

export { Controller };
//"div.ComicGrabber.CG-menu>{div.CG-moveChapter#movePrev,div.CG-list>{div.CG-item},div.CG-moveChapter#moveNext}"