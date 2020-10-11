//Author: He Yin
//Date: 10-12-2018
//This scipt is used to calculate the monthly median NDVI from Landsat 7 and 8
//Note:cloud mask needs to be checked

var locat = ee.Geometry.Point(25.332342,55.002364);
var locat1 = ee.Geometry.Point(25.332342,55.002364);
var locat2= ee.Geometry.Point(25.541925,54.633719);
var locat3 = ee.Geometry.Point(25.529332,54.875576);
var locat4 = ee.Geometry.Point(25.425461,54.991377);
var roi=new ee.FeatureCollection([locat1,locat2,locat3,locat4]);

Map.addLayer(roi, {color: 'FF0000'});

// Alternatively, it is possible to define a region of interest as a buffer around a point.
//var geom = ee.Geometry.Point(25.332342,55.002364).buffer(500);

//zoom to the image
Map.centerObject(locat1, 7);

// Function to mask clouds using the Sentinel-2 QA band.
var maskS2clouds=function(image) {
  var qa = image.select('QA60')

  // Bits 10 and 11 are clouds and cirrus, respectively.
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;

  // Both flags should be set to zero, indicating clear conditions.
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0).and(
             qa.bitwiseAnd(cirrusBitMask).eq(0))

  // Return the masked and scaled data, without the QA bands.
  return image.updateMask(mask).divide(10000)
      .select("B.*")
      .copyProperties(image, ["system:time_start"])
}

var addNDVI= function(image){
  var ndvi =image.normalizedDifference(['B8A','B4']).rename('NDVI');
  return image.addBands(ndvi);
};

// Map the function over one year of data and take the median.
// Load Sentinel-2 TOA reflectance data.
var collectionS = ee.ImageCollection('COPERNICUS/S2')
    .filterDate('1984-01-01', '2017-12-31')
    // Pre-filter to get less cloudy granules.
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
    .filterBounds(locat)
  //  .select('B2','B3','B4','B8A','B11','B12','QA60')
    .map(maskS2clouds)
    .map(addNDVI).select('NDVI');

var mergedCollection = collection.merge(collectionL5)
                       .merge(collectionL7);
 //                      .merge(collectionS);

var months = ee.List.sequence(1, 12);
var monthlyndvi = ee.ImageCollection.fromImages(
  months.map(function (m) {
    var ndvimonth = mergedCollection
        .filter(ee.Filter.calendarRange(m, m, 'month'))
        .max();
    return ndvimonth
        .set('month', m)
        //.set('system:time_start', ee.Date.fromYMD(year, 1, 1));
}));

print(monthlyndvi);
//Map.addLayer(monthlyndvi.first());
Map.addLayer(monthlyndvi.limit(5));
