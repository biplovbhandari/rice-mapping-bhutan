/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var table1 = ee.FeatureCollection("projects/servir-sco-assets/assets/Bhutan/riceNonRicePoints_Filo"),
    table2 = ee.FeatureCollection("projects/servir-sco-assets/assets/Bhutan/Final_Paro_gte4_Con80_Sample");
/***** End of imports. If edited, may not auto-convert in the playground. *****/

//////////
////
////  Base Script Set
////
//////////

var baseModule = require('users/biplovbhandari/Rice_Mapping_Bhutan:main.js');

//////////////
/////
////  Display     https://github.com/gee-community/ee-palettes
////
//////////////

var palettes = require('users/gena/packages:palettes');
var palette0 = palettes.misc.tol_rainbow[7];
var palette1 = palettes.colorbrewer.Oranges[3];

//////////
////
////  ROI
////
//////////

var ROI = ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017').filter(ee.Filter.eq('country_na','Bhutan'));
Map.addLayer(ROI, {}, 'ROI');
Map.centerObject(ROI, 9);

//////////
////
////  Input Imagery
////
//////////

// var LS8 = ee.ImageCollection('LANDSAT/LC08/C01/T1_SR')
var LS8 = ee.ImageCollection("LANDSAT/LC08/C02/T1_L2");
var LS7 = ee.ImageCollection("LANDSAT/LE07/C02/T2_L2");
var S2 = ee.ImageCollection('COPERNICUS/S2_SR');
var LS8_TOA = ee.ImageCollection('LANDSAT/LC08/C02/T1_TOA'); // landsat toa for tesseled cap
var s1Descending =  ee.ImageCollection('COPERNICUS/S1_GRD')
            .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
            .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
            .filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'))
            .filter(ee.Filter.eq('instrumentMode', 'IW'));

var s1Ascending = ee.ImageCollection('COPERNICUS/S1_GRD')
            .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
            .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
            .filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'))
            .filter(ee.Filter.eq('instrumentMode', 'IW'));


var list_month = [5, 6, 7, 8, 9];
var list_year = [2020];

var l8FinalCollection =  ee.ImageCollection(baseModule.utils.timePeriodSelector(LS8, list_month, list_year, ROI)).sort('system:time_start')
l8FinalCollection = l8FinalCollection.select(['SR_B.', 'QA_PIXEL']);

l8FinalCollection = l8FinalCollection.sort('system:time_start', true);
var l8FinalCollection2 = l8FinalCollection.sort('system:time_start', false);

//////////
////
////  Extract Dates
////
//////////

var firstDate = ee.Date(l8FinalCollection.first().get('system:time_start'));
var lastDate = ee.Date(l8FinalCollection2.first().get('system:time_start'));

var listofDates = [];


var numDays = lastDate.difference(firstDate, 'day').int().getInfo();

var diff = 0;
var daysDiff = 15;
while (diff <= numDays) {
  var dict = {
    'startDate': firstDate.advance(diff, 'day'),
    'endDate'  : firstDate.advance(diff + daysDiff, 'day')
  };
  listofDates.push(dict);
  diff += daysDiff;
}

listofDates = ee.List(listofDates);
print('listofDates', listofDates);


//////////
////
////  Landsat 8 Dancing
////
//////////

l8FinalCollection = l8FinalCollection.select(['SR_B3', 'SR_B4', 'SR_B5', 'SR_B6', 'QA_PIXEL']);

l8FinalCollection = l8FinalCollection.map(function (img) {
  return img.rename(['green', 'red', 'nir', 'swir1', 'QA_PIXEL']);
});


var l8Indices = ee.ImageCollection(baseModule.utils.getIndices(listofDates, l8FinalCollection, ROI, 'landsat'));
var l8IndicesImage = l8Indices.toBands();
var l8IndicesNewBandNames = baseModule.utils.bulkRenameBands(l8IndicesImage.bandNames());
l8IndicesImage = l8IndicesImage.rename(l8IndicesNewBandNames);
l8IndicesImage = l8IndicesImage.clip(ROI);
l8IndicesImage = l8IndicesImage.unmask(0);


//////////
////
////  Landsat 7 Dancing
////
//////////

var l7FinalCollection = ee.ImageCollection(baseModule.utils.timePeriodSelector(LS7, list_month, list_year, ROI)).sort('system:time_start');
l7FinalCollection = l7FinalCollection.select(['SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'QA_PIXEL']);

l7FinalCollection = l7FinalCollection.map(function (img) {
  return img.rename(['green', 'red', 'nir', 'swir1', 'QA_PIXEL']);
});

//////////
////
////  Merge Landsat 7 and 8
////
//////////
var _landsatCollection = baseModule.routine.getL7L8ReducedImage(listofDates, l8FinalCollection, l7FinalCollection);
var landsatCollection = ee.ImageCollection(_landsatCollection);

var landsatIndices = ee.ImageCollection(baseModule.utils.getIndices(listofDates, landsatCollection, ROI, 'combinedLandsat'));
landsatIndices = landsatIndices.toBands();
var landsatIndicesNewBandNames = baseModule.utils.bulkRenameBands(landsatIndices.bandNames());
var landsatIndicesImage = landsatIndices.rename(landsatIndicesNewBandNames);
landsatIndicesImage = landsatIndicesImage.clip(ROI);
landsatIndicesImage = landsatIndicesImage.unmask(0);


//////////
////
////  Sentinel 2 Dancing
////
//////////
var s2FinalCollection =  ee.ImageCollection(baseModule.utils.timePeriodSelector(S2, list_month, list_year, ROI)).sort('system:time_start');
var s2Indices = ee.ImageCollection(baseModule.utils.getIndices(listofDates, s2FinalCollection, ROI, 'sentinel2'));
s2Indices = s2Indices.toBands();
var s2IndicesNewBandNames = baseModule.utils.bulkRenameBands(s2Indices.bandNames(), 'sentinel2');
var s2IndicesImage = s2Indices.rename(s2IndicesNewBandNames);
s2IndicesImage = s2IndicesImage.clip(ROI);
s2IndicesImage = s2IndicesImage.unmask(0);


//////////
////
////  Tasseled Cap Dancing
////
//////////
// var l8ToaFinalCollection =  ee.ImageCollection(baseModule.utils.timePeriodSelector(LS8_TOA, list_month, list_year, ROI)).sort('system:time_start');

// l8ToaFinalCollection = l8ToaFinalCollection.select(['B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'QA_PIXEL']);

// l8ToaFinalCollection = l8ToaFinalCollection.map(function (img) {
//   return img.rename(['blue', 'green', 'red', 'nir', 'swir1', 'swir2', 'QA_PIXEL']);
// });

// var tcIndices = ee.ImageCollection(baseModule.utils.getIndices(listofDates, lsToaFinalCollection, ROI, 'tc'));
// lsToaIndices = lsToaIndices.toBands();
// var lsToaIndicesNewBandNames = baseModule.utils.bulkRenameBands(lsToaIndices.bandNames());
// lsToaIndices = lsToaIndices.rename(lsToaIndicesNewBandNames);

//////////
////
////  Sentinel 1 Dancing
////
//////////

////  Descend Dance
var s1DescendingFinal = ee.ImageCollection(baseModule.utils.timePeriodSelector(s1Descending, list_month, list_year, ROI)).sort('system:time_start');
s1DescendingFinal = ee.ImageCollection(baseModule.utils.getIndices(listofDates, s1DescendingFinal, ROI, 'sentinel1'));

var s1DescendingFinalImage = s1DescendingFinal.toBands();
var s1DescendingFinalNewBandNames = baseModule.utils.bulkRenameBands(s1DescendingFinalImage.bandNames(), 'sentinel1', 'descend');
s1DescendingFinalImage = s1DescendingFinalImage.rename(s1DescendingFinalNewBandNames);
s1DescendingFinalImage = s1DescendingFinalImage.clip(ROI);


////  Ascend Dance
var s1AscendingFinal = ee.ImageCollection(baseModule.utils.timePeriodSelector(s1Ascending, list_month, list_year, ROI)).sort('system:time_start');
s1AscendingFinal = ee.ImageCollection(baseModule.utils.getIndices(listofDates, s1AscendingFinal, ROI, 'sentinel1'));

var s1AscendingFinalImage = s1AscendingFinal.toBands();
var s1AscendinggFinalNewBandNames = baseModule.utils.bulkRenameBands(s1AscendingFinalImage.bandNames(), 'sentinel1', 'ascend');
s1AscendingFinalImage = s1AscendingFinalImage.rename(s1AscendinggFinalNewBandNames);
s1AscendingFinalImage = s1AscendingFinalImage.clip(ROI);

var s1FinalImage = s1DescendingFinalImage.addBands(s1AscendingFinalImage);

// print('l8Indices', l8Indices);
// print('s2Indices', s2Indices);
// print('lsToaIndices', lsToaIndices);
// print('s1Final', s1Final);


var finalImagery = s2IndicesImage;//.addBands([s1FinalImage]);
// var finalImagery = landsatIndices;
// finalImagery = finalImagery.float();
// Map.addLayer(finalImagery, {}, 'finalImagery');
print('finalImagery', finalImagery);
var bands = finalImagery.bandNames();
print('bands', bands)

//////////////
/////
////  Test Train Splits
////
//////////////
Map.addLayer(table1, {}, "rice points table")
Map.addLayer(table2, {}, "rice points table2")

var table = table1.merge(table2);


var label = 'presence';
var training_sample = finalImagery.select(bands).sampleRegions({
  collection: table,
  properties: [label],
  scale: 30,
  // geometries: true,
}).randomColumn({seed: 7});
print('training_sample', training_sample);

//////////////
////
////  Random Forest
////
//////////////

var rfClassifier = baseModule.model.randomForest(training_sample, bands, finalImagery, label);
var classifiedImage = finalImagery.select(bands).classify(rfClassifier);
var Random_Forest_Output_rice = classifiedImage.eq(1);
var Random_Forest_Output_rice_only = Random_Forest_Output_rice.updateMask(classifiedImage);
print('Random_Forest_Output_rice_only', Random_Forest_Output_rice_only);
Map.addLayer(Random_Forest_Output_rice_only.clip(ROI),{min: 0, max: 1, palette: palette1}, 'Random_Forest_Output_rice_only');

//////////////
////
////  Export
////
//////////////
// var asset_dir = 'projects/servir-sco-assets/assets/Bhutan/baseModule/Model_Output_Temp_IC'
// //var asset_dir = 'projects/servir-sco-assets/assets/Bhutan/baseModule'
// var asset_name_extent = 'RF_Output_Temp';
// // export to assetpr
// var asset_name = asset_name_extent +"_" + month_date+ "_" + year_date
// var asset_id = asset_dir + '/' + asset_name;

// Export.image.toAsset({image: Random_Forest_Output_rice_only.copyProperties(s1_of_intrest.first(), ['system:time_start']), 
//                       description: asset_name, 
//                       assetId: asset_id, 
//                       region: ROI, 
//                       scale:10, 
//                       maxPixels:1e9,
//                       })