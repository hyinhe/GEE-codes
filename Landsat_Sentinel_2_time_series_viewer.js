/*Author:He Yin 
  Email:hyin39@wisc.edu

  Date:26-Oct-2018
  
  Purpose: A tool for plotting BSI (bare soil index) and NDVI time series from Landsat SR and Sentinel 2 TOA time series; 
           visul interpretation of cloud-free Landsat SR imgery.
           You can also draw points/polygons directly on the imagery to collect training data for classification
           There are 5 windows/maps, from the left to the right: 
           The 1st window shows the least clouded Landsat imagery
           The 2nd window shows the earliest imagery from 5 least clouded imagery
           The 3nd window shows the second earliest imagery from 5 least clouded imagery
           The 4rd window show the Google Earth imagery (or the 3rd earliest imagery from 5 least clouded imagery)
           The 5th window shows the NDVI time series derived from Landsat SR and Sentinel-2 TOA 
  Usage: Run the codes, then click anywhere on the first window
  Parameters:
           geolocation: long; lat
           period: start, end; startmonth, endmonth
           Kernal size: whehter NDVI value from a single pixel (30) or the mean value of the 3*3 (90) Landsat pixel should be plotted
           panelsize:the window size of the NDVI time series
           cloudness: 0: least clouded imagery. 1: second least clouded imagery ect for the first window.
*/
////Parameters defination 
//pick up an initial location
  var long=ee.Number(25.332342);
  var lat=ee.Number(55.002364);


  var long1=long.getInfo();
  var lat1=lat.getInfo();

  var locat = ee.Geometry.Point(long,lat);

//Select the imgery during which period for plotting NDVI time series
  var start='2016-01-1';
  var end='2017-12-30';
  
//Select spring imagery for the second window
  var start1='2017-04-15';
  var end1='2017-07-1';
  
//Select autumn imagery for the second window
  var start2='2017-07-1';
  var end2='2017-09-20';

//Defined the months for plotting NDVI time series 4:April, 11:November
  var startmonth= ee.Number(1);
  var endmonth=  ee.Number(12);

//Define the wondow size, 90 is a kernal size of three Landsat pixels
  var kernalsize =ee.Number(30);

//Define the size of the NDVI time series inspector panel
  var panelsize ='500px';

//select *th clouded imagery for the first window. For instant, 0 indicate the least clouded imagery, 
//1 indicates the second leasted clouded imagery
  var cloudness=ee.Number(2);

////Cloud masking and caculate NDVI

//cloud mask for L8, check https://landsat.usgs.gov/landsat-surface-reflectance-quality-assessment
  var cloudMaskL8 = function(image) {
  var qa = image.select('pixel_qa');
  var cloud = qa.bitwiseAnd(1 << 5)              
                .and(qa.bitwiseAnd(1 << 6).or(qa.bitwiseAnd(1 << 7))) 
                .or(qa.bitwiseAnd(1 << 4))
                .or(qa.bitwiseAnd(1 << 3))  
                .or(qa.bitwiseAnd(1 << 8).and(qa.bitwiseAnd(1 << 9)));   
  var mask2 = image.mask().reduce(ee.Reducer.min());
  return image
      .updateMask(cloud.not()).updateMask(mask2)
};
//Calculate NDVI
  var addNDVI= function(image){
  var ndvi =image.normalizedDifference(['B5','B4']).rename('L8_SR_NDVI');
  return image.addBands(ndvi);
};

var bsiL8=function(image){
  var bsi=image.select('B7').add(image.select('B4'))
        .subtract(image.select('B5')).subtract(image.select('B2'))
        .divide(image.select('B7').add(image.select('B4'))
        .add(image.select('B5')).add(image.select('B2')))
        .rename('L8_SR_bsi');
        return image.addBands(bsi);
  
};
//Apply the cloud mask on L8
  var collectionL8_ndvi = ee.ImageCollection('LANDSAT/LC08/C01/T1_SR')
    .filterDate(start, end)
    .filter(ee.Filter.calendarRange(startmonth,endmonth,'month'))
    .map(cloudMaskL8)
    .map(addNDVI)
    .map(bsiL8)
   //     .filterBounds(locat)
    .select('L8_SR_NDVI');
  
  var collectionL8_bsi = ee.ImageCollection('LANDSAT/LC08/C01/T1_SR')
    .filterDate(start, end)
    .filter(ee.Filter.calendarRange(startmonth,endmonth,'month'))
    .map(cloudMaskL8)
    .map(addNDVI)
    .map(bsiL8)
  //      .filterBounds(locat)
    .select('L8_SR_bsi');
    
//cloud mask for L4-7
  var cloudMaskL457 = function(image) {
  var qa = image.select('pixel_qa');
  var cloud = qa.bitwiseAnd(1 << 5)
          .and(qa.bitwiseAnd(1 << 7))
          .or(qa.bitwiseAnd(1 << 3))
          .or(qa.bitwiseAnd(1 << 4))

// Remove edge pixels that don't occur in all bands
  var mask2 = image.mask().reduce(ee.Reducer.min());
  return image
  .updateMask(cloud.not()).updateMask(mask2)
};
  var addNDVI= function(image){
  var ndvi =image.normalizedDifference(['B4','B3']).rename('L4_7_SR_NDVI');
  return image.addBands(ndvi);
};

var bsiL7=function(image){
  var bsi=image.select('B7').add(image.select('B3'))
        .subtract(image.select('B4')).subtract(image.select('B1'))
        .divide(image.select('B7').add(image.select('B3'))
        .add(image.select('B4')).add(image.select('B1')))
        .rename('L4_7_SR_bsi');
        return image.addBands(bsi);
  
};

//Calculate NDVI from L7 and L5
  var collectionL7_ndvi = ee.ImageCollection('LANDSAT/LE07/C01/T1_SR')
    .filterDate(start, end)
    .filter(ee.Filter.calendarRange(startmonth,endmonth,'month'))
    .map(cloudMaskL457)
    .map(addNDVI)
    .map(bsiL7)
   //     .filterBounds(locat)
    .select('L4_7_SR_NDVI');
    
  var collectionL5_ndvi = ee.ImageCollection('LANDSAT/LT05/C01/T1_SR')
    .filterDate(start, end)
   .filter(ee.Filter.calendarRange(startmonth,endmonth,'month'))
    .map(cloudMaskL457)
    .map(addNDVI)
    .map(bsiL7)
   // .filterBounds(locat)
    .select('L4_7_SR_NDVI');
    
      var collectionL7_bsi = ee.ImageCollection('LANDSAT/LE07/C01/T1_SR')
    .filterDate(start, end)
    .filter(ee.Filter.calendarRange(startmonth,endmonth,'month'))
    .map(cloudMaskL457)
    .map(addNDVI)
    .map(bsiL7)
   //     .filterBounds(locat)
    .select('L4_7_SR_bsi');
    
  var collectionL5_bsi = ee.ImageCollection('LANDSAT/LT05/C01/T1_SR')
    .filterDate(start, end)
   .filter(ee.Filter.calendarRange(startmonth,endmonth,'month'))
    .map(cloudMaskL457)
    .map(addNDVI)
    .map(bsiL7)
  //  .filterBounds(locat)
    .select('L4_7_SR_bsi');

// Function to mask clouds using the Sentinel-2 QA band.
  function maskS2clouds(image) {
  var qa = image.select('QA60')
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0).and(
             qa.bitwiseAnd(cirrusBitMask).eq(0))

// Return the masked and scaled data, without the QA bands.
  return image.updateMask(mask).divide(10000)
      .select("B.*")
      .copyProperties(image, ["system:time_start"])
}
// Caculate Sentinel 2 TOA NDVI
  var addNDVI= function(image){
  var ndvi =image.normalizedDifference(['B8A','B4']).rename('S2_TOA_NDVI');
  return image.addBands(ndvi);
};


var bsiS2=function(image){
  var bsi=image.select('B12').add(image.select('B4'))
        .subtract(image.select('B8A')).subtract(image.select('B2'))
        .divide(image.select('B12').add(image.select('B4'))
        .add(image.select('B8A')).add(image.select('B2')))
        .rename('S2_TOA_bsi');
        return image.addBands(bsi);
  
};

// Load Sentinel-2 TOA reflectance data.
  var collectionS_ndvi = ee.ImageCollection('COPERNICUS/S2')
    .filterDate(start, end)
    .filter(ee.Filter.calendarRange(startmonth,endmonth,'month'))
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
    .map(maskS2clouds)
    .map(addNDVI)
    .map(bsiS2)
    .select('S2_TOA_NDVI');
    
   var collectionS_bsi = ee.ImageCollection('COPERNICUS/S2')
    .filterDate(start, end)
    .filter(ee.Filter.calendarRange(startmonth,endmonth,'month'))
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
    .map(maskS2clouds)
    .map(addNDVI)
    .map(bsiS2)
    .select('S2_TOA_bsi');   
    
    
//Merge all the collections
  var collection_ndvi = collectionL8_ndvi.merge(collectionL5_ndvi)
                       .merge(collectionL7_ndvi).merge(collectionS_ndvi);
                       
  var collection_bsi = collectionL8_bsi.merge(collectionL5_bsi)
                       .merge(collectionL7_bsi).merge(collectionS_bsi);
   //                   .merge(collectionS);

  //print(collection_bsi,'bsi');       

  //var collectionndvi=mergedCollection.select(['L8_SR_NDVI']);
  //print(collectionndvi);
////Filter Landsat collection for the specified area

  var collection8 = ee.ImageCollection('LANDSAT/LC08/C01/T1_SR')
    .filterDate(start, end)
    .filterBounds(locat)
    .select(['B2','B3','B4','B5','B6','B7'],
    ['blue','green','red','NIR','SWIR1','SWIR2']);
  var collection7 = ee.ImageCollection('LANDSAT/LE07/C01/T1_SR')
    .filterDate(start, end)
    .filterBounds(locat)
    .select(['B1','B2','B3','B4','B5','B7'],
    ['blue','green','red','NIR','SWIR1','SWIR2']);
  var collection5 = ee.ImageCollection('LANDSAT/LT05/C01/T1_SR')
    .filterDate(start, end)
    .filterBounds(locat)
    .select(['B1','B2','B3','B4','B5','B7'],
    ['blue','green','red','NIR','SWIR1','SWIR2']);
  var collection4 = ee.ImageCollection('LANDSAT/LT04/C01/T1_SR')
    .filterDate(start, end)
    .filterBounds(locat)
    .select(['B1','B2','B3','B4','B5','B7'],
    ['blue','green','red','NIR','SWIR1','SWIR2']);
//Merge all the collections
  var collection=collection8.merge(collection7).merge(collection5).merge(collection4)
    .sort('CLOUD_COVER', true);
  
  //Get spring (sp) and autumn (au) collection
  var collection_sp=collection.filterDate(start1,end1).sort('CLOUD_COVER', true);
  var collection_au=collection.filterDate(start2,end2).sort('CLOUD_COVER', true);

    
//Get the imagery list
  var imagery_list =collection.toList(collection.size());
  print('Imagery List',imagery_list);
  
   var imagery_list_sp =collection_sp.toList(collection_sp.size());
  print('Spring imagery List',imagery_list_sp);
  
   var imagery_list_au =collection_au.toList(collection_au.size());
  print('Autumn imagery List',imagery_list_au);

//get the *the clouded imagery from the list, 'cloudness' was defined at the beginning
  var image0 =ee.Image(imagery_list.get(cloudness));
  var name0 =ee.String(image0.id());
  var id0=name0.getInfo();
  
  var image0_sp =ee.Image(imagery_list_sp.get(cloudness));
  var name0_sp =ee.String(image0_sp.id());
  var id0_sp=name0_sp.getInfo();
  
  var image0_au =ee.Image(imagery_list_au.get(cloudness));
  var name0_au =ee.String(image0_au.id());
  var id0_au=name0_au.getInfo();
    
//Take the least clouded 5 imagery and sort them based on the observation time    
  var image5 = collection.limit(2).sort('SENSING_TIME',true);
  var image5_sp = collection_sp.limit(2).sort('SENSING_TIME',true);
  var image5_au = collection_au.limit(2).sort('SENSING_TIME',true);


//convert to list
  var least_cloud_list =image5.toList(collection.size());
  var least_cloud_list_sp =image5_sp.toList(collection_sp.size());
  var least_cloud_list_au =image5_au.toList(collection_au.size());

//get the imagery from the list
  var image1 =ee.Image(least_cloud_list.get(0));

  var image1_sp =ee.Image(least_cloud_list_sp.get(0));

  var image1_au =ee.Image(least_cloud_list_au.get(0));

//get the IDs of the imagery
  var name1 =ee.String(image1.id());

  var name1_sp =ee.String(image1_sp.id());

  var name1_au =ee.String(image1_au.id());

  var id1=name1.getInfo();

  var id1_sp=name1_sp.getInfo();

  var id1_au=name1_au.getInfo();
//Set the band combination and color scheme
  var vis2={bands: ["SWIR2", "NIR", "red"], min:0, max: 5000};

  var imageclear0 = ee.Image(image0).visualize(vis2);


  var imageclear0_sp = ee.Image(image0_sp).visualize(vis2);


  var imageclear0_au = ee.Image(image0_au).visualize(vis2);


//Add the imagery to the first map
  var LandsatLayer0=ui.Map.Layer(imageclear0).setName(id0);
  Map.add(LandsatLayer0);
  Map.add(ui.Label(id0, {position:'bottom-center'}));
  Map.addLayer(locat, {color: 'FF0000'},'Initial location');

// Create the main map and set the NDVI layer.
  var mapPanel = ui.Panel();
  mapPanel.style().set('width', panelsize);

// Create an intro panel with labels.
  var intro = ui.Panel([
  ui.Label({
    value: 'NDVI/BSI Time Series Inspector',
    style: {fontSize: '20px', fontWeight: 'bold'}
  }),
  ui.Label('Click a location to see NDVI/BSI time series from Landsat and Sentinel 2')
]);
  mapPanel.add(intro);

// Create panels to hold lon/lat values.
  var lon = ui.Label();
  var lat = ui.Label();
  mapPanel.add(ui.Panel([lon, lat], ui.Panel.Layout.flow('horizontal')));

// function to create map 2-4
  var map1 = new ui.Map();
  var map2 = new ui.Map();
  var map3 = new ui.Map();

//// Chart setup

// Generates a new time series chart of NDVI for the given coordinates.
  var generateChart=function (coords) {
// Update the lon/lat panel with values from the click event.
  lon.setValue('lon: ' + coords.lon.toFixed(2));
  lat.setValue('lat: ' + coords.lat.toFixed(2));
// Add a dot for the point clicked on.
  var point = ee.Geometry.Point(coords.lon, coords.lat);
  print(point.coordinates());
//the color https://en.wikipedia.org/wiki/Web_colors
//https://developers.google.com/earth-engine/tutorial_api_02
  var dot = ui.Map.Layer(point, {color: 'FF0000'}, 'clicked location');
// Add the dot as the second layer, so it shows up on top of the composite.
//set the number to 15 indicates there are 15 layers except the "clicked location"
  Map.layers().set(15, dot);
// Make a chart from the time series.
  var ndviChart = ui.Chart.image.series(collection_ndvi, point, ee.Reducer.mean(), kernalsize);

// Customize the chart.
  ndviChart.setOptions({
    title: 'NDVI: time series',
    vAxis: {title: 'NDVI',ticks:[-0.1,0,0.2,0.4,0.6,0.8,1]},
    hAxis: {title: 'Date', format: 'MM-yy', gridlines: {count: 7}},
    series: {
      0: {
        color: 'blue',
        lineWidth: 0,
        pointsVisible: true,
        pointSize: 2,
      },
      1: {
        color: 'red',
        lineWidth: 0,
        pointsVisible: true,
        pointSize: 2,
      },
      2: {
        color: 'green',
        lineWidth: 0,
        pointsVisible: true,
        pointSize: 2,
      },
    },
    legend: {position: 'right'},
  });
// Add the chart at a fixed position, so that new charts overwrite older ones.
    mapPanel.widgets().set(2, ndviChart);
 
 
 
// Make a chart from the time series.
var bsiChart = ui.Chart.image.series(collection_bsi, point, ee.Reducer.mean(), kernalsize);

// Customize the chart.
  bsiChart.setOptions({
    title: 'BSI: time series',
    vAxis: {title: 'BSI',ticks:[-0.8,-0.6,-0.4,-0.2,0,0.2,0.4,0.6,0.8]},
    hAxis: {title: 'Date', format: 'MM-yy', gridlines: {count: 7}},
    series: {
      0: {
        color: 'blue',
        lineWidth: 0,
        pointsVisible: true,
        pointSize: 2,
      },
      1: {
        color: 'red',
        lineWidth: 0,
        pointsVisible: true,
        pointSize: 2,
      },
      2: {
        color: 'green',
        lineWidth: 0,
        pointsVisible: true,
        pointSize: 2,
      },
    },
    legend: {position: 'right'},
  });
// Add the chart at a fixed position, so that new charts overwrite older ones.
    mapPanel.widgets().set(3, bsiChart);
  
 
  
    map1.setCenter(point.coordinates().get(0).getInfo(),point.coordinates().get(1).getInfo(), 14);
    map1.addLayer(image1_sp, vis2);
    map1.addLayer(point, {color:'FF0000'});
    map1.add(ui.Label(id1_sp, {position:'bottom-center'}));
  
  
    map2.setCenter(point.coordinates().get(0).getInfo(),point.coordinates().get(1).getInfo(), 14);
    map2.addLayer(image1_au, vis2);
    map2.addLayer(point, {color:'FF0000'});
    map2.add(ui.Label(id1_au, {position:'bottom-center'}));
    
    map3.setCenter(point.coordinates().get(0).getInfo(),point.coordinates().get(1).getInfo(), 14);
 //If you want to add the 3rd least clouded imagery:
 //map3.addLayer(image3, vis2);
    map3.addLayer(point, {color:'FF0000'});
 //map3.add(ui.Label(id3, {position:'bottom-center'}));
  
};

// Register a callback on the default map to be invoked when the map is clicked.
  Map.onClick(generateChart);
// Configure the map.
  Map.style().set('cursor', 'crosshair');
// Initialize with a test point.
  var initialPoint = locat;
  Map.centerObject(initialPoint, 6);
//Initialize the app

// Insert the map
  ui.root.insert(1, mapPanel);

  generateChart({
  lon: initialPoint.coordinates().get(0).getInfo(),
  lat: initialPoint.coordinates().get(1).getInfo()
});


  function initMap(map) {
  map.setCenter(long1,lat1, 14);
}
// Initialize
  initMap(Map);

  function createMap(title) {
  var map = ui.Map();
  ui.Label(title, {position:'bottom-center'});
  map.add(title);
  return map;
}

  function getMapSize() {
  var scale = Map.getScale();
  var bounds = ee.Geometry(Map.getBounds(true)).coordinates().get(0).getInfo();
  
  var ll = bounds[0];
  var ur = bounds[2];
  var width = (ur[0] - ll[0]) / scale;
  var height = (ur[1] - ll[1]) / scale;
  
  return { w: Math.floor(width), h: Math.floor(height) };
}
  var maps = [map1, map2, map3];

  var height = getMapSize().h;

// Create a panel with vertical flow layout.
  var panel = ui.Panel({
  layout: ui.Panel.Layout.flow('horizontal'),
  style: {width: '100vw', height: height + '300px'}
});

  var linker = ui.Map.Linker(maps);
//print(linker);

  maps.map(function(map) { 
  initMap(map)
  map.setOptions('HYBRID')
  panel.add(map)
})
  ui.root.insert(1, maps[2]);
  ui.root.insert(1, maps[1]);
  ui.root.insert(1, maps[0]);

  var linker = ui.Map.Linker(maps);

//Speculation of a single imagery
// var image_spec = ee.Image('LANDSAT/LC08/C01/T1_SR/LC08_185022_20170728');
// var vizParams = {
//   bands: ['B6', 'B5', 'B4'],  min: 0,  max: 5000,gamma: [0.95, 1.1, 1]};
// Map.addLayer(image_spec, vizParams, 'false color composite');
//var locat = ee.Geometry.Point(25.332342,55.002364);

