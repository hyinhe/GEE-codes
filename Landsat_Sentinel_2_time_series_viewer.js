/*Author:He Yin
  Email:hyinhe@gmail.com
  Date:26-Oct-2018
  
  Purpose: A tool for plotting NDVI, BSI (bare soil index) and Tasseled Cap transformation (Brightness, Greenness and Wetness) time series from Landsat SR and Sentinel 2 TOA time series; 
           visul interpretation of cloud-free Landsat SR imgery.
           You can also draw points/polygons directly on the imagery to collect training data for classification
           There are 5 windows/maps, from the left to the right: 
           The 1st window shows Goole Earth imagery
           The 2nd window shows the least clouded imagery for the peroid start1-end1
           The 3rd window shows the least clouded imagery for the peroid start2-end2
           The 4th window shows the least clouded imagery for the peroid start-end
           The 5th window shows the NDVI, BSI, wetness and brightness temporal profile during the period start-end
  Usage: Run the codes, then click anywhere on the first window
  Parameters:
           locat: longitude; latitude
           period: start, end; startmonth, endmonth
           Kernal size: whehter NDVI value from a single pixel (30) or the mean value of the 3*3 (90) Landsat pixel should be plotted
           panelsize:the window size of the NDVI time series
           cloudness: 0: least clouded imagery. 1: second least clouded imagery. 2: third least clouded imagery, etc.
*/
////Parameters defination 
//pick up an initial location
  var locat = ee.Geometry.Point(45.60929, 32.35115); 

//Select the imgery during which period for plotting NDVI time series
  var start='2015-01-1';
  var end='2017-12-30';
//Select spring imagery for the second window
  var start1='2016-04-15';
  var end1='2016-07-1'; 
//Select autumn imagery for the third window
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
//1 indicates the second least clouded imagery; 2 indicates the third least clouded imagery, etc.
  var cloudness=ee.Number(0);

////Cloud masking and caculate NDVI
//cloud mask for L8, check https://landsat.usgs.gov/landsat-surface-reflectance-quality-assessment
  var cloudMaskL8 = function(image) {
  var qa = image.select('pixel_qa');
  var cloud = qa.bitwiseAnd(1 << 5)              
                .and(qa.bitwiseAnd(1 << 6).or(qa.bitwiseAnd(1 << 7))) 
                .or(qa.bitwiseAnd(1 << 4))
                .or(qa.bitwiseAnd(1 << 3))  
                .or(qa.bitwiseAnd(1 << 8).and(qa.bitwiseAnd(1 << 9)));   
 // var mask2 = image.mask().reduce(ee.Reducer.min());
  return image.select(['B2','B3','B4','B5','B6','B7'],['blue', 'green', 'red', 'nir', 'swir1', 'swir2'])
      .updateMask(cloud.not())//.updateMask(mask2)
};
//Calculate NDVI
  var addNDVI= function(image){
  var ndvi =image.normalizedDifference(['nir','red']).rename('L8_SR_NDVI');
  return image.addBands(ndvi);
};
var bsiL8=function(image){
  var bsi=image.select('swir2').add(image.select('red'))
        .subtract(image.select('nir')).subtract(image.select('blue'))
        .divide(image.select('swir2').add(image.select('red'))
        .add(image.select('nir')).add(image.select('blue')))
        .rename('L8_SR_bsi');
        return image.addBands(bsi);
};
 var wetnessL8 = function(image){
  var wet= image.expression(
        '((BLUE * 0.0315) + (GREEN * 0.2021) + (RED * 0.3102) + (NIR * 0.1594) + (SWIR1 * -0.6806) + (SWIR2 * -0.6109))', {
          'SWIR2': image.select('swir2'),
          'SWIR1': image.select('swir1'),
          'NIR': image.select('nir'),
          'RED': image.select('red'),
          'GREEN': image.select('green'),
          'BLUE': image.select('blue')
      }).rename('L8_SR_wetness');    
      return image.addBands(wet);
};
var brightnessL8 = function(image){
  var bright= image.expression(
    '(BLUE * 0.2043) + (GREEN * 0.4158) + (RED * 0.5524) + (NIR * 0.5741) + (SWIR1 * 0.3124) + (SWIR2 * 0.2303)', {
          'SWIR2': image.select('swir2'),
          'SWIR1': image.select('swir1'),
          'NIR': image.select('nir'),
          'RED': image.select('red'),
          'GREEN': image.select('green'),
          'BLUE': image.select('blue')
      }).rename('L8_SR_brightness');
  return image.addBands(bright);
};     
var greenessL8 = function(image){
  var green= image.expression(
    '(BLUE * -0.1603) + (GREEN * -0.2819) + (RED * -0.4934) + (NIR * 0.7940) + (SWIR1 * -0.0002) + (SWIR2 * -0.1446)', {
          'SWIR2': image.select('swir2'),
          'SWIR1': image.select('swir1'),
          'NIR': image.select('nir'),
          'RED': image.select('red'),
          'GREEN': image.select('green'),
          'BLUE': image.select('blue')
      }).rename('L8_SR_greeness');
  return image.addBands(green);
};   
//Apply the cloud mask on L8
  var collectionL8_ndvi = ee.ImageCollection('LANDSAT/LC08/C01/T1_SR')
    .filterDate(start, end)
    .filter(ee.Filter.calendarRange(startmonth,endmonth,'month'))
    .map(cloudMaskL8)
    .map(addNDVI)
    .map(bsiL8)
    .select('L8_SR_NDVI');
  var collectionL8_bsi = ee.ImageCollection('LANDSAT/LC08/C01/T1_SR')
    .filterDate(start, end)
    .filter(ee.Filter.calendarRange(startmonth,endmonth,'month'))
    .map(cloudMaskL8)
    .map(addNDVI)
    .map(bsiL8)
    .select('L8_SR_bsi');
  var collectionL8_wet = ee.ImageCollection('LANDSAT/LC08/C01/T1_SR')
    .filterDate(start, end)
    .filter(ee.Filter.calendarRange(startmonth,endmonth,'month'))
    .map(cloudMaskL8)
    .map(wetnessL8)
    .select('L8_SR_wetness'); 
  var collectionL8_bright = ee.ImageCollection('LANDSAT/LC08/C01/T1_SR')
    .filterDate(start, end)
    .filter(ee.Filter.calendarRange(startmonth,endmonth,'month'))
    .map(cloudMaskL8)
    .map(brightnessL8)
    .select('L8_SR_brightness');     
  var collectionL8_green = ee.ImageCollection('LANDSAT/LC08/C01/T1_SR')
    .filterDate(start, end)
    .filter(ee.Filter.calendarRange(startmonth,endmonth,'month'))
    .map(cloudMaskL8)
    .map(greenessL8)
    .select('L8_SR_greeness');  

//cloud mask for L4-7
  var cloudMaskL457 = function(image) {
  var qa = image.select('pixel_qa');
  var cloud = qa.bitwiseAnd(1 << 5)
          .and(qa.bitwiseAnd(1 << 7))
          .or(qa.bitwiseAnd(1 << 3))
          .or(qa.bitwiseAnd(1 << 4))

// Remove edge pixels that don't occur in all bands
 //var mask2 = image.mask().reduce(ee.Reducer.min());
  return image.select(['B1', 'B2', 'B3', 'B4', 'B5', 'B7'], // change band names
    ['blue', 'green', 'red', 'nir', 'swir1', 'swir2'])
  .updateMask(cloud.not())//.updateMask(mask2)
};
  var addNDVI= function(image){
  var ndvi =image.normalizedDifference(['nir','red']).rename('L4_7_SR_NDVI');
  return image.addBands(ndvi);
};

var bsiL7=function(image){
  var bsi=image.select('swir2').add(image.select('red'))
        .subtract(image.select('nir')).subtract(image.select('blue'))
        .divide(image.select('swir2').add(image.select('red'))
        .add(image.select('nir')).add(image.select('blue')))
        .rename('L4_7_SR_bsi');
        return image.addBands(bsi);
};
var wetL7 = function(image){
  var wet= image.expression(
        '(BLUE * 0.0315) + (GREEN * 0.2021) + (RED * 0.3102) + (NIR * 0.1594) + (SWIR1 * -0.6806) + (SWIR2 * -0.6109)', {
          'SWIR2': image.select('swir2'),
          'SWIR1': image.select('swir1'),
          'NIR': image.select('nir'),
          'RED': image.select('red'),
          'GREEN': image.select('green'),
          'BLUE': image.select('blue')
      }).rename('L4_7_SR_wetness');    
      return image.addBands(wet);
};
var brightL7 = function(image){
  var bright= image.expression(
          '(BLUE * 0.2043) + (GREEN * 0.4158) + (RED * 0.5524) + (NIR * 0.5741) + (SWIR1 * 0.3124) + (SWIR2 * 0.2303)', {
          'SWIR2': image.select('swir2'),
          'SWIR1': image.select('swir1'),
          'NIR': image.select('nir'),
          'RED': image.select('red'),
          'GREEN': image.select('green'),
          'BLUE': image.select('blue')
      }).rename('L4_7_SR_brightness');    
      return image.addBands(bright);
};
var greenL7 = function(image){
  var green= image.expression(
    '(BLUE * -0.1603) + (GREEN * -0.2819) + (RED * -0.4934) + (NIR * 0.7940) + (SWIR1 * -0.0002) + (SWIR2 * -0.1446)', {
          'SWIR2': image.select('swir2'),
          'SWIR1': image.select('swir1'),
          'NIR': image.select('nir'),
          'RED': image.select('red'),
          'GREEN': image.select('green'),
          'BLUE': image.select('blue')
      }).rename('L4_7_SR_greeness');    
      return image.addBands(green);
};

//Calculate NDVI, bsi, TC (brightness, greenness and wetness) from L7 and L5
  var collectionL7_ndvi = ee.ImageCollection('LANDSAT/LE07/C01/T1_SR')
    .filterDate(start, end)
    .filter(ee.Filter.calendarRange(startmonth,endmonth,'month'))
    .map(cloudMaskL457)
    .map(addNDVI)
    .map(bsiL7)
    .select('L4_7_SR_NDVI');  
  var collectionL5_ndvi = ee.ImageCollection('LANDSAT/LT05/C01/T1_SR')
    .filterDate(start, end)
   .filter(ee.Filter.calendarRange(startmonth,endmonth,'month'))
    .map(cloudMaskL457)
    .map(addNDVI)
    .map(bsiL7)
    .select('L4_7_SR_NDVI');    
   var collectionL7_bsi = ee.ImageCollection('LANDSAT/LE07/C01/T1_SR')
    .filterDate(start, end)
    .filter(ee.Filter.calendarRange(startmonth,endmonth,'month'))
    .map(cloudMaskL457)
    .map(addNDVI)
    .map(bsiL7)
    .select('L4_7_SR_bsi');   
  var collectionL5_bsi = ee.ImageCollection('LANDSAT/LT05/C01/T1_SR')
    .filterDate(start, end)
   .filter(ee.Filter.calendarRange(startmonth,endmonth,'month'))
    .map(cloudMaskL457)
    .map(addNDVI)
    .map(bsiL7)
    .select('L4_7_SR_bsi');
  var collectionL7_wet = ee.ImageCollection('LANDSAT/LE07/C01/T1_SR')
    .filterDate(start, end)
    .filter(ee.Filter.calendarRange(startmonth,endmonth,'month'))
    .map(cloudMaskL457)
    .map(wetL7)
    .select('L4_7_SR_wetness');   
  var collectionL5_wet = ee.ImageCollection('LANDSAT/LT05/C01/T1_SR')
    .filterDate(start, end)
   .filter(ee.Filter.calendarRange(startmonth,endmonth,'month'))
    .map(cloudMaskL457)
    .map(wetL7)
    .select('L4_7_SR_wetness');    
  var collectionL4_wet = ee.ImageCollection('LANDSAT/LT04/C01/T1_SR')
    .filterDate(start, end)
   .filter(ee.Filter.calendarRange(startmonth,endmonth,'month'))
    .map(cloudMaskL457)
    .map(wetL7)
    .select('L4_7_SR_wetness');    
  var collectionL7_bright = ee.ImageCollection('LANDSAT/LE07/C01/T1_SR')
    .filterDate(start, end)
    .filter(ee.Filter.calendarRange(startmonth,endmonth,'month'))
    .map(cloudMaskL457)
    .map(brightL7)
    .select('L4_7_SR_brightness');  
  var collectionL5_bright = ee.ImageCollection('LANDSAT/LT05/C01/T1_SR')
    .filterDate(start, end)
   .filter(ee.Filter.calendarRange(startmonth,endmonth,'month'))
    .map(cloudMaskL457)
    .map(brightL7)
    .select('L4_7_SR_brightness');    
  var collectionL4_bright = ee.ImageCollection('LANDSAT/LT04/C01/T1_SR')
    .filterDate(start, end)
   .filter(ee.Filter.calendarRange(startmonth,endmonth,'month'))
    .map(cloudMaskL457)
    .map(brightL7)
    .select('L4_7_SR_brightness');
  var collectionL7_green = ee.ImageCollection('LANDSAT/LE07/C01/T1_SR')
    .filterDate(start, end)
    .filter(ee.Filter.calendarRange(startmonth,endmonth,'month'))
    .map(cloudMaskL457)
    .map(greenL7)
    .select('L4_7_SR_greeness');    
  var collectionL5_green = ee.ImageCollection('LANDSAT/LT05/C01/T1_SR')
    .filterDate(start, end)
   .filter(ee.Filter.calendarRange(startmonth,endmonth,'month'))
    .map(cloudMaskL457)
    .map(greenL7)
    .select('L4_7_SR_greeness');   
  var collectionL4_green = ee.ImageCollection('LANDSAT/LT04/C01/T1_SR')
    .filterDate(start, end)
   .filter(ee.Filter.calendarRange(startmonth,endmonth,'month'))
    .map(cloudMaskL457)
    .map(greenL7)
    .select('L4_7_SR_greeness');

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
// Caculate Sentinel 2 TOA NDVI, basi and TC
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
var wetS2 = function(image){
  var wet= image.expression(
        '10000*(((BLUE * 0.0315) + (GREEN * 0.2021) + (RED * 0.3102) + (NIR * 0.1594) + (SWIR1 * -0.6806) + (SWIR2 * -0.6109)))', {
          'SWIR2': image.select('B12'),
          'SWIR1': image.select('B11'),
          'NIR': image.select('B8A'),
          'RED': image.select('B4'),
          'GREEN': image.select('B3'),
          'BLUE': image.select('B2')
      }).rename('S2_TOA_wetness');    
      return image.addBands(wet);
};
var brightS2 = function(image){
  var bright= image.expression(
        '10000*((BLUE * 0.2043) + (GREEN * 0.4158) + (RED * 0.5524) + (NIR * 0.5741) + (SWIR1 * 0.3124) + (SWIR2 * 0.2303))', {
          'SWIR2': image.select('B12'),
          'SWIR1': image.select('B11'),
          'NIR': image.select('B8A'),
          'RED': image.select('B4'),
          'GREEN': image.select('B3'),
          'BLUE': image.select('B2')
      }).rename('S2_TOA_brightness');    
      return image.addBands(bright);
};
var greenS2 = function(image){
  var green= image.expression(
        '10000*((BLUE * -0.1603) + (GREEN * -0.2819) + (RED * -0.4934) + (NIR * 0.7940) + (SWIR1 * -0.0002) + (SWIR2 * -0.1446))', {
          'SWIR2': image.select('B12'),
          'SWIR1': image.select('B11'),
          'NIR': image.select('B8A'),
          'RED': image.select('B4'),
          'GREEN': image.select('B3'),
          'BLUE': image.select('B2')
      }).rename('S2_TOA_greeness');    
      return image.addBands(green);
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
  var collectionS_wet = ee.ImageCollection('COPERNICUS/S2')
    .filterDate(start, end)
    .filter(ee.Filter.calendarRange(startmonth,endmonth,'month'))
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
    .map(maskS2clouds)
    .map(wetS2)
    .select('S2_TOA_wetness');   
  var collectionS_bright = ee.ImageCollection('COPERNICUS/S2')
    .filterDate(start, end)
    .filter(ee.Filter.calendarRange(startmonth,endmonth,'month'))
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
    .map(maskS2clouds)
    .map(brightS2)
    .select('S2_TOA_brightness');        
  var collectionS_green = ee.ImageCollection('COPERNICUS/S2')
    .filterDate(start, end)
    .filter(ee.Filter.calendarRange(startmonth,endmonth,'month'))
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
    .map(maskS2clouds)
    .map(greenS2)
    .select('S2_TOA_greeness');  

//Merge all the collections
  var collection_ndvi = collectionL8_ndvi.merge(collectionL5_ndvi)
                       .merge(collectionL7_ndvi).merge(collectionS_ndvi);                       
  var collection_bsi = collectionL8_bsi.merge(collectionL5_bsi)
                       .merge(collectionL7_bsi).merge(collectionS_bsi);
  var collection_wet = collectionL8_wet.merge(collectionL5_wet).merge(collectionL4_wet)
                       .merge(collectionL7_wet).merge(collectionS_wet);                       
  var collection_bright = collectionL8_bright.merge(collectionL5_bright).merge(collectionL4_bright)
                       .merge(collectionL7_bright).merge(collectionS_bright);                     
  var collection_green = collectionL8_green.merge(collectionL5_green).merge(collectionL4_green)
                       .merge(collectionL7_green).merge(collectionS_green);                     

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
  var name0_1 =ee.String(image0.id());
  var strlength=name0_1.length()
  var name0 = name0_1.slice(6,strlength);
  var id0=name0.getInfo();
  
  var image0_sp =ee.Image(imagery_list_sp.get(cloudness));
  var name0_sp_1 =ee.String(image0_sp.id());
  var strlength_sp=name0_sp_1.length()
  var name0_sp = name0_sp_1.slice(6,strlength_sp);
  var id0_sp=name0_sp.getInfo();
  
  var image0_au =ee.Image(imagery_list_au.get(cloudness));
  var name0_au_1 =ee.String(image0_au.id());
  var strlength_au=name0_au_1.length()
  var name0_au = name0_au_1.slice(6,strlength_au);
  var id0_au=name0_au.getInfo();
    
//Take the least clouded 5 imagery and sort them based on the observation time    
  var image5 = collection.limit(2).sort('SENSING_TIME',true);
  var image5_sp = collection_sp.limit(2).sort('SENSING_TIME',true);
  var image5_au = collection_au.limit(2).sort('SENSING_TIME',true);

//Set the band combination and color scheme
  var vis2={bands: ["SWIR2", "NIR", "red"], min:0, max: 5000};
  var imageclear0 = ee.Image(image0).visualize(vis2);
  var imageclear0_sp = ee.Image(image0_sp).visualize(vis2);
  var imageclear0_au = ee.Image(image0_au).visualize(vis2);

//Add the intial points
  Map.addLayer(locat, {color: 'FF0000'},'Initial location');

// Create the main map and set the NDVI layer.
  var mapPanel = ui.Panel();
  mapPanel.style().set('width', panelsize);

// Create an intro panel with labels.
  var intro = ui.Panel([
  ui.Label({
    value: 'NDVI/BSI/TC Time Series Inspector',
    style: {fontSize: '20px', fontWeight: 'bold'}
  }),
  ui.Label('Click a location to see NDVI/BSI/TC time series from Landsat SR and Sentinel-2 TOA')
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
    
// Make a chart from the ndvi time series.
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
// Make a chart from the bsi time series.
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
// Make a chart from the wetness time series.
  var wetChart = ui.Chart.image.series(collection_wet, point, ee.Reducer.mean(), kernalsize);
// Customize the chart.
  wetChart.setOptions({
    title: 'Wetness: time series',
    vAxis: {title: 'Wetness',ticks:[-5000,-4000,-3000,-2000,-1000,0]},
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
// Make a chart from the brightness time series.
  var brightChart = ui.Chart.image.series(collection_bright, point, ee.Reducer.mean(), kernalsize);
// Customize the chart.
  brightChart.setOptions({
    title: 'Brightness: time series',
    vAxis: {title: 'Brightness',ticks:[1000,2000,3000,4000,5000,6000]},
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
  // Make a chart from the greenness time series.
  var greenChart = ui.Chart.image.series(collection_green, point, ee.Reducer.mean(), kernalsize);
  // Customize the chart.
  greenChart.setOptions({
    title: 'Greenness: time series',
    vAxis: {title: 'Greenness',ticks:[0,500,1000,1500,2000,2500]},
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
// Add the chart at a fixed position, so that new charts overwrite older ones.
    mapPanel.widgets().set(2, ndviChart);
    mapPanel.widgets().set(3, bsiChart);
    mapPanel.widgets().set(4, wetChart);
    mapPanel.widgets().set(5, brightChart);
    mapPanel.widgets().set(6, greenChart);
    
    map1.setCenter(point.coordinates().get(0).getInfo(),point.coordinates().get(1).getInfo(), 14);
    map1.addLayer(image0_sp, vis2);
    map1.addLayer(point, {color:'FF0000'});
    map1.add(ui.Label(id0_sp, {position:'bottom-center'}));
  
    map2.setCenter(point.coordinates().get(0).getInfo(),point.coordinates().get(1).getInfo(), 14);
    map2.addLayer(image0_au, vis2);
    map2.addLayer(point, {color:'FF0000'});
    map2.add(ui.Label(id0_au, {position:'bottom-center'}));
    
    map3.setCenter(point.coordinates().get(0).getInfo(),point.coordinates().get(1).getInfo(), 14);
    map3.addLayer(image0, vis2);
    map3.addLayer(point, {color:'FF0000'});
    map3.add(ui.Label(id0, {position:'bottom-center'}));
};

// Register a callback on the default map to be invoked when the map is clicked.
  Map.onClick(generateChart);
// Configure the map.
  Map.style().set('cursor', 'crosshair');
// Initialize with a test point.
  var initialPoint = locat;
  Map.centerObject(initialPoint, 6);

// Insert the map
  ui.root.insert(1, mapPanel);
  generateChart({
  lon: initialPoint.coordinates().get(0).getInfo(),
  lat: initialPoint.coordinates().get(1).getInfo()
});
  function initMap(map) {
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
  Map.setOptions('HYBRID')
  panel.add(map)
})
  ui.root.insert(1, maps[2]);
  ui.root.insert(1, maps[1]);
  ui.root.insert(1, maps[0]);
  var linker = ui.Map.Linker(maps);
  Map.centerObject(locat,14)

//Speculation of a single imagery
// var image_spec = ee.Image('LANDSAT/LC08/C01/T1_SR/LC08_185022_20170728');
// var vizParams = {
//   bands: ['B6', 'B5', 'B4'],  min: 0,  max: 5000,gamma: [0.95, 1.1, 1]};
// Map.addLayer(image_spec, vizParams, 'false color composite');
//var locat = ee.Geometry.Point(25.332342,55.002364);

