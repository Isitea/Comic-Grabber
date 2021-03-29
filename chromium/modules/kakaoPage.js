"use strict";
async function pageModule() {
    let images, contentRequest, infoRequest, pageJSON = JSON.parse( document.body.querySelector( '#__NEXT_DATA__' ).innerHTML );
    let singleForMeta = 
        pageJSON.props.initialState.viewer.viewers[pageJSON.props.initialState.viewer.currentViewerKey].singleForMeta ||
        pageJSON.props.initialState.product.productMap[pageJSON.props.initialState.viewer.currentViewerKey].singleForMeta;
    let { title, authorName, seriesTitle } = singleForMeta;
    console.log( singleForMeta )
    let episode = title.replace( seriesTitle, "" ).toFilename();
    let raw = title.toFilename();
    title = `${seriesTitle} (${authorName})`.toFilename();
    
    infoRequest = ( function ( { props: { initialState } } ) {
        let form = new FormData();

        form.set( 'singlePid', initialState.viewer.currentViewerKey );
        form.set( 'seriesPid', singleForMeta.seriesId );
        form.set( 'deviceId', initialState.common.constant.did );

        return form;
    } )( pageJSON );

    contentRequest = ( function ( { props: { initialProps: { userAgent }, initialState } } ) {
        let clientString = ( ( { name, osname } ) => `${name} - ${osname}` )( userAgent ), form = new FormData();
        
        form.set( 'productId', initialState.viewer.currentViewerKey );
        form.set( 'device_mgr_uid', clientString );
        form.set( 'device_model', clientString );
        form.set( 'deviceId', initialState.common.constant.did );

        return form;
    } )( pageJSON );
    images = await fetch(
        "https://api2-page.kakao.com/api/v1/inven/get_download_data/web",
        { method: 'POST', body: contentRequest, credentials: "include" }
    )
    .then( response => response.json() )
    .then( json => json.downloadData.members.files.map( ( { secureUrl } ) => `${json.downloadData.members.sAtsServerUrl}${secureUrl}` ) );

    return {
        moveNext: Promise.resolve( async () => location.assign(
            await fetch( "https://api2-page.kakao.com/api/v5/inven/get_next_item", { method: 'POST', body: infoRequest, credentials: "include" } )
            .then( response => response.json() )
            .then( ( { item } ) => ( item ? `?${item.pid.replace( /^p/, "productId=")}` : '#It_is_lasest_episode' ) )
        ) ),
        movePrev: Promise.resolve( async () => location.assign(
            await fetch( "https://api2-page.kakao.com/api/v5/inven/get_prev_item", { method: 'POST', body: infoRequest, credentials: "include" } )
            .then( response => response.json() )
            .then( ( { item } ) => ( item ? `?${item.pid.replace( /^p/, "productId=")}` : '#It_is_oldest_episode' ) )
        ) ),
        info: { raw, title, episode },
        images,
    };
}

export { pageModule };