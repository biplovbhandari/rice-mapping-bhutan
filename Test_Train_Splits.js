// ////
// var ROI = ee.FeatureCollection("USDOS/LSIB_SIMPLE/2017").filter(ee.Filter.eq('country_na','Bhutan'));


// var LS8 = ee.ImageCollection('LANDSAT/LC08/C01/T1_SR').filterBounds(ROI).filterDate("2020-01-01", "2020-12-31").median()
// Map.addLayer(LS8,{},"LS8")

// var bands = ["B4"]

// var rice_pts = ee.FeatureCollection("projects/servir-sco-assets/assets/Bhutan/riceNonRicePoints_Filo")
// print("rice_pts",rice_pts)

// var label = 'presence';
// ////////////////////////////////////////////////////////////////////////////////////////////////

// // // //
// // var training_sample = LS8.select(bands).sampleRegions({
// //   collection: rice_pts,
// //   properties: [label],
// //   scale: 10}).randomColumn()
// // // var testing_sample = LS8.select(bands).sampleRegions({
// // //   collection: rice_pts,
// // //   properties: [label],
// // //   scale: 10}).randomColumn()
// // var split = 0.7;  // Roughly 70% training, 30% testing.
// // var training = training_sample.filter(ee.Filter.lt('random', split));
// // var testing = training_sample.filter(ee.Filter.gte('random', split));
// // //print("sample",sample)
// // print("training",training)
// // print("testing",testing)


// ////
// function Test_Train_Splits (image,list,featureCollection,string){
//   var Training_sample = image.select(list).sampleRegions({
//     collection: featureCollection,
//     properties: [string],
//     scale: 10}).randomColumn()

//   var split = 0.7
  
//   var training = ee.FeatureCollection(Training_sample.filter(ee.Filter.lt('random', split)))//.name("training");
//   var testing = ee.FeatureCollection(Training_sample.filter(ee.Filter.gte('random', split)))//.name("testing");
//   return training.merge(testing)   ///////////////////////////heres the issue returning more than one FC
// }
// // print("training", training)
// // print("testing", testing)


// var splitout = Test_Train_Splits(LS8,bands, rice_pts,label)
// print("splitout", splitout)
// Map.addLayer(splitout,{},"splitout")

// exports.Test_Train_Splits = Test_Train_Splits

