# google-heatmap

## Setup
1. Go to the google cloud platform and create a new project
2. Add the `Maps JavaScript API` to the project and create a new API key
3. Change the google maps api source in `index.html` to include the new API key

## Adding Data
For now, data is added as a CSV format in a JavaScript file like this:
```js
const data = `latitude,longitude,quantity
lat1,long1,quant1
lat2,long2,quant2
lat3,long3,quant3`;
```

That JavaScript file then needs to be imported in `index.html` so `index.js` can access it. E.g:
```html
<script src="./data/pointData.js"></script>
```