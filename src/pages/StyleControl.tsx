import { MapboxStyleSwitcherControl } from 'mapbox-gl-style-switcher'
import { useControl } from 'react-map-gl'
// Map Base Url
export const MAP_BASE_URL = 'https://map.barikoi.com'

// Import Styles
import 'mapbox-gl-style-switcher/styles.css'
// Import Access Token
// export const MAP_API_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAP_API_ACCESS_TOKEN || ''
// Map Styles
const styles = [
  {
    title: 'Light',
    uri: `${ MAP_BASE_URL }/styles/osm-liberty/style.json?key=${ process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '' }`
  },
  {
    title: 'Custom',
    uri: `https://geoserver.bmapsbd.com/styles/barikoi-custom/style.json?key=${ process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '' }`
  }
]
// Options
const options = {
  defaultStyle: 'OSM Liberty',
}

const StyleControl = () => {
  useControl<any>(
    () => new MapboxStyleSwitcherControl(styles, options),
    {
      position: 'bottom-right'
    }
  )
  return null
}

export default StyleControl
