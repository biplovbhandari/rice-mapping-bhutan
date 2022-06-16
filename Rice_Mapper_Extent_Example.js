/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var table = ee.FeatureCollection("projects/servir-sco-assets/assets/Bhutan/riceNonRicePoints_Filo");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
//////////
////
////  Base Script Set
////
//////////

var Rice_Extent_Mapper = require("users/tjm0042/Rice_Extent_Mapper:main.js")
print(Rice_Extent_Mapper)

//////////////
/////
////  Display     https://github.com/gee-community/ee-palettes
////
//////////////

var palettes = require('users/gena/packages:palettes');
var palette0 = palettes.misc.tol_rainbow[7];
var palette1 = palettes.colorbrewer.Oranges[3]

//////////
////
////  ROI
////
//////////

var ROI = ee.FeatureCollection("USDOS/LSIB_SIMPLE/2017").filter(ee.Filter.eq('country_na','Bhutan'));
Map.centerObject(ROI)
//////////
////
////  Input Imagery
////
//////////

var LS8 = ee.ImageCollection('LANDSAT/LC08/C01/T1_SR')
var S2 = ee.ImageCollection('COPERNICUS/S2_SR')
var LS_TOA = ee.ImageCollection('LANDSAT/LC08/C01/T1_TOA')
var s1 =  ee.ImageCollection('COPERNICUS/S1_GRD')
			.filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
			.filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
			.filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'))
			.filter(ee.Filter.eq('instrumentMode', 'IW'))

//////////
////
////  Derive Indicies and Stack   ////Date_splitter /////Add IC, add Month range start and end (5=May), add Year range start and end year
////
/////////
var month_date = 1
var year_date = 2020

var LS8_of_intrest = Rice_Extent_Mapper.Date_splitter.Date_splitter(LS8,month_date,month_date,year_date, year_date,ROI)
print("LS8_of_intrest", LS8_of_intrest)
var S2_of_intrest = Rice_Extent_Mapper.Date_splitter.Date_splitter(S2,month_date,month_date,year_date, year_date,ROI)
print("S2_of_intrest", S2_of_intrest)
var LS_TOA_of_intrest = Rice_Extent_Mapper.Date_splitter.Date_splitter(LS_TOA,month_date,month_date,year_date, year_date,ROI)
print("LS_TOA_of_intrest", LS_TOA_of_intrest)
var s1_of_intrest = Rice_Extent_Mapper.Date_splitter.Date_splitter(s1,month_date,month_date, year_date, year_date,ROI)
print("s1_of_intrest", s1_of_intrest)

// /////////////////////
// ////
// ////  Time_Period_Selector
// ////
// ////////////////////

// var list_month = [5, 6, 7, 8, 9, 10]
// var list_year = [2015, 2016, 2017, 2018, 2019, 2020]

// var finalCollection =  ee.ImageCollection(Rice_Extent_Mapper.Time_Period_Selector.Time_Period_Selector(LS8, list_month, list_year)).sort('system:time_start')
// print('finalCollection', finalCollection.limit(10))


/////////
var LS8_indices = Rice_Extent_Mapper.optical_indices.optical_indices(LS8_of_intrest, ROI)
Map.addLayer(LS8_indices,{}, "LS8_indices",false)
print("LS8_indices", LS8_indices)
////
var S2_indices = Rice_Extent_Mapper.optical_indices_S2.optical_indices_S2(S2_of_intrest, ROI)
Map.addLayer(S2_indices,{}, "S2_indices",false)
print("S2_indices", S2_indices)
//////
var LS_TOA_indices = Rice_Extent_Mapper.calculateTasseledCap.calculateTasseledCap(LS_TOA_of_intrest, ROI)
Map.addLayer(LS_TOA_indices,{}, "LS_TOA_indices",false)
print("LS_TOA_indices")
////, LS_TOA_indices
var s1_TC_LEE = Rice_Extent_Mapper.S1_TC_LEE_Processing.TC_LEE(s1_of_intrest, ROI).median()
Map.addLayer(s1_TC_LEE,{min:-25,max:20}, "s1_TC_LEE",false)
print("s1_TC_LEE", s1_TC_LEE)


////
var All_Imagery = LS8_indices.addBands([S2_indices, LS_TOA_indices, s1_TC_LEE])//s1_refinedLee, s1_terrainCorrection,
var bands = All_Imagery.bandNames().getInfo()
print("bands", bands)

//////////////
/////
////  Test Train Splits
////
//////////////

Map.addLayer(table,{},"rice points table")
var label = 'presence';

var training_sample = All_Imagery.select(bands).sampleRegions({
  collection: table,
  properties: [label],
  scale: 10}).randomColumn()
var split = 0.7;  // Roughly 70% training, 30% testing.
var training = training_sample.filter(ee.Filter.lt('random', split));
var testing = training_sample.filter(ee.Filter.gte('random', split));

print("training",training)
print("testing",testing)

//////////////
////
////  Random Forest
////
//////////////

var Random_Forest_Output = Rice_Extent_Mapper.RandomForest.RandomForest(training,bands,All_Imagery)
var Random_Forest_Output_rice = Random_Forest_Output.eq(1)
var Random_Forest_Output_rice_only = Random_Forest_Output_rice.updateMask(Random_Forest_Output)
print("Random_Forest_Output_rice_only", Random_Forest_Output_rice_only)
Map.addLayer(Random_Forest_Output_rice_only,{min: 0, max: 1, palette: palette1}, "Random_Forest_Output_rice_only")

//////////////
////
////  Export
////
//////////////
var asset_dir = 'projects/servir-sco-assets/assets/Bhutan/Rice_Extent_Mapper/Model_Output_Temp_IC'
//var asset_dir = 'projects/servir-sco-assets/assets/Bhutan/Rice_Extent_Mapper'
var asset_name_extent = 'RF_Output_Temp';
// export to asset
var asset_name = asset_name_extent +"_" + month_date+ "_" + year_date
var asset_id = asset_dir + '/' + asset_name;

Export.image.toAsset({image: Random_Forest_Output_rice_only.copyProperties(s1_of_intrest.first(), ['system:time_start']), 
                      description: asset_name, 
                      assetId: asset_id, 
                      region: ROI, 
                      scale:10, 
                      maxPixels:1e9,
                      })


// //////////////
// ////
// ////  Connected Pixels
// ////
// //////////////
// var mmu = 10
// var connectedPixels = Random_Forest_Output_rice_only.connectedPixelCount(mmu,false)

// connectedPixels= connectedPixels.updateMask(connectedPixels.gte(mmu))
// Map.addLayer(connectedPixels, {palette: "blue"}, "connectedPixels")