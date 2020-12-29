"use strict";
class pageModule {
    static async moveNext () {
        return document.querySelector( '.chapter_prev.fa-chevron-circle-right')?.click();
    }
    static async movePrev () {
        return document.querySelector( '.chapter_prev.fa-chevron-circle-left')?.click();
    }

    static async removeAds ( method ) {
        let Ads = document.querySelectorAll( ".w_banner" );
        switch ( method ) {
            case "invisible": {
                for (let item of Ads ) item.style = "display: none !important;";
                break;
            }
            default: {
                for ( let item of Ads ) item.remove();
                break;
            }
        }
    }
    static async getInfo () {
        return { title: document.head.querySelector( "meta[name=title]" )?.content, location: document.location.href };
    }
    static async grabImages () {
        return [ ...document.querySelectorAll( ".view-img img" ) ].map( item => item.src );
    }
}

export { pageModule };
