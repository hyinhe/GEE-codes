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
