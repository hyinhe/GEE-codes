/*Author:He Yin
  Date: 14-Oct-2019
  Purpose: Sum the number of Landsat clear observations, get rid of duplicate observations. 
*/ 

var geometry = 
    /* color: #d63000 */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[28.700434954769776, 55.85786335702226],
          [28.700434954769776, 51.47570209983215],
          [36.522700579769776, 51.47570209983215],
          [36.522700579769776, 55.85786335702226]]], null, false);
          
  Map.centerObject(geometry,5)
  
  var start='1987-01-1';
  var end='1987-12-31';  
// add a band with value as the date of imagery   
  var DateBand = function(image){
  var date1 = image.date().format('YYYYMMdd');
  var date = ee.Number.parse(date1);
  var DateBand = ee.Image.constant(date).uint32().rename('date')
  DateBand = DateBand.updateMask(image.select('B1').mask())
  return image.addBands(DateBand);
};
//Get imagery
  var imgs = ee.ImageCollection('LANDSAT/LT05/C01/T1_SR')
    .filterDate(start, end)
     .filterBounds(geometry)
     .map(DateBand)
     .sort('Date')
//Get the number of the unique property - in this case, it is imagery date
var composite= imgs.select('date').reduce(ee.Reducer.countDistinct())
var viz = {min:0, max:30, palette:['0000FF','FDFF92','FF2700','d600ff']};
Map.addLayer(composite,viz, 'Number of imagery')

//get clear observation for Landsat 4-7. If it is clear observation, return the date of the imagery
//or use var tools=require('users/hyinhe/FWE875_2019:LAS_tools') for both TM/ETM and OLI

  var clearL457_date = function(image) {
  var qa = image.select('pixel_qa');
  var cloud = qa.bitwiseAnd(1 << 5)
          .or(qa.bitwiseAnd(1 << 7))
          .or(qa.bitwiseAnd(1 << 3))
          .or(qa.bitwiseAnd(1 << 4))
  var clear=cloud.not().rename('clear')
  var date1 = image.date().format('YYYYMMdd');
  var date = ee.Number.parse(date1);
  var DateBand = ee.Image.constant(date).uint32().rename('date')
  DateBand = DateBand.updateMask(image.select('B1').mask())
  return clear.multiply(DateBand) 
};

var img3=imgs.map(clearL457_date)
//print(img3)
var composite2= img3.reduce(ee.Reducer.countDistinct()).subtract(1)
print(composite2)
Map.addLayer(composite2,viz,'Number of no-overlap clear observations')

