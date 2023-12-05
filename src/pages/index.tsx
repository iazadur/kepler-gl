// Map Dependencies [ "@turf/turf": "6.5.0", "deck.gl": "8.8.14", "maplibre-gl": "2.4.0", "react-map-gl": "7.0.19" ]
import React, { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { IconLayer, GeoJsonLayer, ScatterplotLayer } from '@deck.gl/layers/typed'
import { MapboxOverlay, MapboxOverlayProps } from '@deck.gl/mapbox/typed'
import { Map, Popup, FullscreenControl, NavigationControl, useControl } from 'react-map-gl'
import * as maplibregl from 'maplibre-gl'
// @ts-ignore
import { bbox } from '@turf/turf'




// Map Base Url
export const MAP_BASE_URL = 'https://map.barikoi.com'

// Map Configs
export const MAP_CONFIG = {
  STYLES: [
    {
      title: 'Light',
      uri: `${ MAP_BASE_URL }/styles/osm-liberty/style.json?key=${ process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '' }`
    },
    {
      title: 'Dark',
      uri: `${ MAP_BASE_URL }/styles/barikoi-dark/style.json`
    }
  ]
}

// import { MAP as MAP_CONFIG } from '../../app.config'
// import { Image } from 'antd'
import StyleControl from './StyleControl'

// Import Styles
import 'maplibre-gl/dist/maplibre-gl.css'

// DeckGL Overlay
// eslint-disable-next-line react/no-unused-prop-types
const DeckGLOverlay: any = (props: MapboxOverlayProps & { interleaved?: boolean }) => {
    const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay(props))
    overlay.setProps(props)
    return null
}

const DeckGLMap: any = ({ markerData, pointData, geoJsonData, onIconDoubleClick, isSinglePoint, fullscreenControl, navigationControl, fitBounds, hidePopup, flyToLngLat, popupContent, currentView, disableGeojsonHover, keepPopupOpen }: any) => {
    // States
    const [initialViewState, setInitialViewState] = useState({
        longitude: 90.39017821904588,
        latitude: 23.719800220780733,
        minZoom: 4,
		maxZoom: 24,
        zoom: 8,
        pitch: 0,
        bearing: 0,
        doubleClickZoom: false
    })
    const [layers, setLayes]: any = useState([])
    const [popupInfo, setPopupInfo]: any = useState(null)

    // Refs
    const mapRef: any = useRef(null)

    // On Marker Click
    const _onMarkerClick = (info: any, e: any) => {
        const tapCount: any = e?.tapCount ?? 0
        if (tapCount === 2) {
            _onDoubleClick(info, e)
        } else if (tapCount === 1) {
            _onSingleClick(info, e)
        }
    }

    // On Single Click on Marker
    const _onSingleClick = (info: any, e: any) => {
        setPopupInfo(info)
    }

    // On Double Click on Marker
    const _onDoubleClick = (info: any, e: any) => {
        setPopupInfo(null)
        onIconDoubleClick && onIconDoubleClick(info, e)
    }

    // On Hovering Over Layers
    const _onHoverLayers = (d: any) => {
        if (!disableGeojsonHover) {
            setPopupInfo(d)
        }
    }

    // Get Icon Based On Type
    const _onGetIconUrl = (type: any) => {
        let url: any = '/images/marker'
        if (type) {
            switch (type) {
                case 'ONLINE':
                    url = '/images/pickup-truck-green.png'
                    break

                case 'OFFLINE':
                    url = '/images/pickup-truck-grey.png'
                    break

                case 'ASSIGNED':
                    url = '/images/pickup-truck-orange.png'
                    break

                case 'ONGOING':
                    url = '/images/pickup-truck-dark-red.png'
                    break

                default:
                    url = '/images/marker'
            }
        }
        return url
    }

    // Create Different Layers from Props Data
    const _onCreateLayers = () => {
        const newLayers = [
            new GeoJsonLayer({
                id: 'geojson-layer',
                data: geoJsonData,
                pickable: true,
                stroked: true,
                filled: true,
                extruded: true,
                pointType: 'circle+text',
                lineWidthScale: 1,
                lineWidthMinPixels: 2,
                lineWidthMaxPixels: 4,
                getFillColor: (d: any) => d?.properties?.fillColor ?? [220, 20, 60, 100],
                getLineColor: (d) => d?.properties?.lineColor ?? [255, 0, 0, 250],
                getPointRadius: 100,
                getLineWidth: (d) => d?.properties?.linWidth ?? 4,
                getElevation: 0,
                wireframe: true,
                onHover: (d) => _onHoverLayers(d),
                getTextColor: (d) => d?.properties?.textColor ?? [0, 0, 0, 255],
                getTextPixelOffset: [0, 20],
                textSizeMaxPixels: 12,
                textSizeUnits: 'meters'
            }),
            new ScatterplotLayer({
                id: 'scatterplot-layer',
                data: pointData,
                pickable: true,
                opacity: 0.8,
                stroked: true,
                filled: true,
                antialiasing: true,
                radiusScale: 6,
                radiusMinPixels: 1,
                radiusMaxPixels: 12,
                lineWidthMinPixels: 0,
                lineWidthMaxPixels: 4,
                getPosition: (d) => [+d?.longitude, +d?.latitude],
                getRadius: (d: any) => d?.properties?.radius ?? 64,
                getFillColor: (d) => d?.fillColor ?? [255, 140, 0],
                getLineWidth: (d) => d?.properties?.linWidth ?? 0,
                getLineColor: (d) => [0, 0, 0],
                onHover: (d) => _onHoverLayers(d)
            }),
            new IconLayer({
                id: 'icon-layer',
                data: markerData,
                // iconAtlas and iconMapping should not be provided
                getIcon: (d) => ({
                    url: d?.iconUrl ? d?.iconUrl : _onGetIconUrl(d?.field_force_status) ?? '/images/hub-marker.png',
                    width: 128,
                    height: 128,
                    anchorY: 100
                }),
                // icon size is based on data point's contributions, between 2 - 25
                getSize: (d) => Math.max(2, Math.min((d?.contributions / 1000) * 25, 25)),
                pickable: true,
                sizeScale: 40,
                getPosition: (d) => [+d?.longitude, +d?.latitude],
                onClick: (info, event) => _onMarkerClick(info, event)
            })
        ]
        setLayes(newLayers)
    }

    // Remove Layers
    const _onRemoveLayers = () => {
        setLayes([])
    }

    // Close Popup
    const _onClosePopup = () => {
        setPopupInfo(null)
    }

    // Fitbounds
    const _onFitBounds = () => {
        const map: any = mapRef.current

        if (!geoJsonData || geoJsonData?.length <= 0) {
            return
        }

        const geoJson: any = {
            type: 'FeatureCollection',
            features: []
        }

        geoJsonData.forEach((d: any) => {
            geoJson.features.push({
                type: 'Feature',
                geometry: d?.geometry,
            })
        })

        const [minLng, minLat, maxLng, maxLat]: any = bbox(geoJson)

        if (map && map !== null) {
            map.fitBounds(
                [
                    [minLng, minLat],
                    [maxLng, maxLat]
                ],
                {
                    padding: 100,
                    duration: 1000
                }
            )
        }
    }

    // Resize Map
    const _onMapResize = () => {
        const map: any = mapRef.current

        if (map && map !== null) {
            map.resize()
        }
    }

    // On Fly To
    const _onFlyTo = (lngLat: any) => {
        const map: any = mapRef.current
        map.flyTo(
            {
                zoom: 15,
                center: [+lngLat?.longitude, +lngLat?.latitude],
                duration: 4000,
                essential: true
            }
        )
    }

    useEffect(() => {
        if (isSinglePoint && Boolean(markerData?.length)) {
            setInitialViewState({
                ...initialViewState,
                longitude: Number(markerData[0]?.longitude),
                latitude: Number(markerData[0]?.latitude)
            })
        }

        _onCreateLayers()
        _onMapResize()
        fitBounds && _onFitBounds()

        return () => {
            _onRemoveLayers()
        }
    }, [])

    useEffect(() => {
        try {
            const map: any = mapRef?.current?.getMap()
            map?.scrollZoom?.setWheelZoomRate(1.2)
            map?.scrollZoom?.enable({ around: 'center' })
        } catch (e: any) {
            // No action required
        }

        _onCreateLayers()

        if (isSinglePoint && Boolean(markerData?.length)) {
            setInitialViewState({
                ...initialViewState,
                longitude: Number(markerData[0]?.longitude),
                latitude: Number(markerData[0]?.latitude)
            })
        }

        _onMapResize()
        fitBounds && _onFitBounds()
        !keepPopupOpen && setPopupInfo(null)
    }, [markerData, geoJsonData, pointData])

    useEffect(() => {
        flyToLngLat && _onFlyTo(flyToLngLat)
    }, [flyToLngLat])

    useEffect(() => {
        setPopupInfo(null)
    }, [currentView])

    return (
        <div
            style={{
                display: 'flex',
                width: '100%',
                height: '100%',
                minWidth: '100%',
                minHeight: '100%',
                padding: '0px',
                position: 'relative'
            }}
        >
            <Map
                initialViewState={ initialViewState }
                ref={ mapRef }
                mapStyle={ MAP_CONFIG.STYLES[0].uri }
                // mapLib={ maplibregl }
                style={{ width: '100%', height: '100%', minWidth: '100%', minHeight: '100%', padding: '0px' }}
            >
                { (popupInfo?.object && !hidePopup)
                && (
                    <Popup
                        longitude={ popupInfo?.coordinate[0] ?? -100 }
                        latitude={ popupInfo?.coordinate[1] ?? 40 }
                        anchor="bottom"
                        onClose={ _onClosePopup }
                        style={{ zIndex: 1000 }}
                    >
                        { (popupContent && popupContent === 'all' && popupInfo?.object && !(popupInfo?.object?.branchName)) && (
                            <span style={{ display: 'flex', flexDirection: 'column', maxHeight: '280px', overflow: 'auto' }}>
                                { Object.keys(popupInfo?.object)?.map((k: any, idx: any) => (
                                    <div key={ idx }>
                                        <span style={{ fontWeight: 600 }}>{ `${ k }: ` }</span>
                                        { ['string', 'number'].includes(typeof (popupInfo?.object[k])) ? popupInfo?.object[k] : '' }
                                    </div>
                                ))}
                            </span>
                        )}
                        { (popupContent
                        && (typeof (popupContent) === 'object')
                        && (popupContent?.length > 0) && popupInfo?.object && !(popupInfo?.object?.branchName))
                        && (
                            <span style={{ display: 'flex', flexDirection: 'column', maxHeight: '280px', overflow: 'auto' }}>
                                { popupContent?.map((p: any, idx: any) => (
                                    popupInfo?.object[p?.keyName] ? (
                                        <div key={ idx }>
                                            <span style={{ fontWeight: 600 }}>
                                                { `${ p?.label ?? '' }: ` }
                                            </span>
                                            { ['string', 'number'].includes(typeof (popupInfo?.object[p?.keyName])) ? popupInfo?.object[p?.keyName] : '' }
                                        </div>
                                    ) : ''
                                ))}
                            </span>
                        )}
                        { (!(popupContent) && popupInfo?.object?.checkin_address) && (
                            <span>
                                <div>
                                    <span style={{ fontWeight: 600 }}>Name: </span>
                                    { popupInfo?.object?.name ?? '' }
                                </div>
                                <div>
                                    <span style={{ fontWeight: 600 }}>Checkin Time: </span>
                                    { popupInfo?.object?.enter_time ?? '' }
                                </div>
                                <div>
                                    <span style={{ fontWeight: 600 }}>Location: </span>
                                    { popupInfo?.object?.checkin_address ?? '' }
                                </div>
                            </span>
                        )}
                        { (!(popupContent) && popupInfo?.object?.Address && !(popupInfo?.object?.branchName)) && (
                            <span>
                                <span style={{ fontWeight: 600 }}>Address: </span>
                                { popupInfo?.object?.Address ?? '' }
                            </span>
                        )}
                        { (!(popupContent) && popupInfo?.object?.gpx_time && popupInfo?.object?.name) && (
                            <span>
                                <div>
                                    <span style={{ fontWeight: 600 }}>Name: </span>
                                    { popupInfo?.object?.name ?? '' }
                                </div>
                                <div>
                                    <span style={{ fontWeight: 600 }}>Updated at: </span>
                                    { popupInfo?.object?.gpx_time ?? '' }
                                </div>
                            </span>
                        )}
                        { (popupInfo?.object?.branchName) && (
                            <span>
                                <div>
                                    <span style={{ fontWeight: 600 }}>Branch Name: </span>
                                    { popupInfo?.object?.branchName ?? '' }
                                </div>
                                <div>
                                    <span style={{ fontWeight: 600 }}>Address: </span>
                                    { popupInfo?.object?.address ?? '' }
                                </div>
                            </span>
                        )}
                        { (popupInfo?.object?.attachment && popupInfo?.object?.attachment?.length) ? (
                            <div>
                                <span style={{ fontWeight: 600 }}>Photos: </span>
                                {/* <div style={ attachmentContainerStyles }>
                                    {
                                        popupInfo?.object?.attachment?.map((a: any, idx: any) => (
                                            <Image key={ idx } style={ attachmentImageStyles } src={ a?.file_url } alt="attachment" />
                                        ))
                                    }
                                </div> */}
                            </div>
                        )
                        : null }
                    </Popup>
                )}
                <DeckGLOverlay layers={ [...layers] } />
                <StyleControl />
                { fullscreenControl ? <FullscreenControl /> : '' }
                { navigationControl ? <NavigationControl /> : '' }
            </Map>
        </div>
    )
}

// Jsx Styles
const attachmentContainerStyles = {
    display: 'flex',
    flexWrap: 'wrap' as 'wrap',
    alignItems: 'center' as 'center',
    justifyContent: 'center' as 'center',
    gap: '4px'
}

const attachmentImageStyles = {
    border: 'none',
    padding: '0px 0px',
    cursor: 'pointer',
    height: '100px'
}

// Prop Types
DeckGLMap.propTypes = {
    markerData: PropTypes.array,
    pointData: PropTypes.array,
    geoJsonData: PropTypes.array,
    onIconDoubleClick: PropTypes.func,
    isSinglePoint: PropTypes.bool,
    fullscreenControl: PropTypes.bool,
    navigationControl: PropTypes.bool,
    fitBounds: PropTypes.bool,
    hidePopup: PropTypes.bool,
    flyToLngLat: PropTypes.object,
    popupContent: PropTypes.oneOfType([
        PropTypes.array,
        PropTypes.string
    ]),
    currentView: PropTypes.string,
    disableGeojsonHover: PropTypes.bool,
    keepPopupOpen: PropTypes.bool
}

DeckGLMap.defaultProps = {
    markerData: [],
    pointData: [],
    geoJsonData: [],
    onIconDoubleClick: null,
    isSinglePoint: false,
    fullscreenControl: true,
    navigationControl: true,
    fitBounds: false,
    hidePopup: false,
    flyToLngLat: null,
    popupContent: null,
    currentView: '',
    disableGeojsonHover: false,
    keepPopupOpen: false
}

DeckGLOverlay.defaultProps = {
    interleaved: false
}

export default DeckGLMap
