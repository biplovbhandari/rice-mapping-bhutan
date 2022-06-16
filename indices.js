var routine = require("users/biplovbhandari/Rice_Mapping_Bhutan:routine.js");

// function starting with underscore (_) are experimental and not recommended


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// not recommended
function _opticalIndicesLandsat(ImageCollection, ROI) {
  
  return ImageCollection.map(function (image) {
  
    var NDVI = image.normalizedDifference(['nir', 'red']).rename('NDVI');
    NDVI = ee.Image(NDVI.copyProperties(image)).set('system:time_start', image.get('system:time_start')).clip(ROI);
    
    var NDWI = image.normalizedDifference(['green', 'nir']).rename('NDWI');
    NDWI = ee.Image(NDWI.copyProperties(image)).set('system:time_start', image.get('system:time_start')).clip(ROI);
  
    var MNDWI = image.normalizedDifference(["green","swir1"]).rename('MNDWI');
    MNDWI = ee.Image(MNDWI.copyProperties(image)).set('system:time_start', image.get('system:time_start')).clip(ROI);
    
    var SAVI = image.expression('((NIR - RED) / (NIR + RED + 0.5))*(1.5)', {
                                    'NIR': image.select('nir'),
                                    'RED': image.select('red')}).rename("SAVI");
    SAVI = ee.Image(SAVI.copyProperties(image)).set('system:time_start', image.get('system:time_start')).clip(ROI);
          
    var NDMI = image.normalizedDifference(["nir","swir1"]).rename('NDMI');
    NDMI =  ee.Image(NDMI.copyProperties(image)).set('system:time_start', image.get('system:time_start')).clip(ROI);
      
    var NDBI = image.normalizedDifference(["swir1","nir"]).rename('NDBI');
    NDBI = ee.Image(NDBI.copyProperties(image)).set('system:time_start', image.get('system:time_start')).clip(ROI);

    return NDVI.addBands([NDWI, MNDWI, NDMI, NDBI]);
  });
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function opticalIndicesLandsat(ImageCollection) {

  var image = ee.Image(ee.Algorithms.If(
    ee.Algorithms.ObjectType(ImageCollection).equals('Image'),
    ee.Image(ImageCollection),
    ee.ImageCollection(ImageCollection).median())
  );

  var NDVI = image.normalizedDifference(['nir', 'red']).rename('NDVI');
  
  var NDWI = image.normalizedDifference(['green', 'nir']).rename('NDWI');

  var MNDWI = image.normalizedDifference(["green","swir1"]).rename('MNDWI');
  
  var SAVI = image.expression('((NIR - RED) / (NIR + RED + 0.5))*(1.5)', {
                                  'NIR': image.select('nir'),
                                  'RED': image.select('red')}).rename('SAVI');
        
  var NDMI = image.normalizedDifference(['nir', 'swir1']).rename('NDMI');
    
  var NDBI = image.normalizedDifference(['swir1', 'nir']).rename('NDBI');

  return NDVI.addBands([NDWI, MNDWI, NDMI, NDBI]);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// function tasseledCapIndices(imageCollection) {

//   imageCollection = imageCollection.map(routine.);

//   var image = imageCollection.median();

//   var tasseled_cap = ImageCollection.map(maskClouds).map(function(image) { 
//     var b = image.select("B2", "B3", "B4", "B5", "B6", "B7");
//     //Coefficients are only for Landsat 8 TOA
//     var brightness_coefficents= ee.Image([0.3029, 0.2786, 0.4733, 0.5599, 0.508, 0.1872])
//     var greenness_coefficents= ee.Image([-0.2941, -0.243, -0.5424, 0.7276, 0.0713, -0.1608]);
//     var wetness_coefficents= ee.Image([0.1511, 0.1973, 0.3283, 0.3407, -0.7117, -0.4559]);
//     var fourth_coefficents= ee.Image([-0.8239, 0.0849, 0.4396, -0.058, 0.2013, -0.2773]);
//     var fifth_coefficents= ee.Image([-0.3294, 0.0557, 0.1056, 0.1855, -0.4349, 0.8085]);
//     var sixth_coefficents= ee.Image([0.1079, -0.9023, 0.4119, 0.0575, -0.0259, 0.0252]);
  
//     var brightness = image.expression('(B * BRIGHTNESS)',{'B':b, 'BRIGHTNESS': brightness_coefficents});
//     var greenness = image.expression('(B * GREENNESS)',{'B':b,'GREENNESS': greenness_coefficents});
//     var wetness = image.expression('(B * WETNESS)', {'B':b,'WETNESS': wetness_coefficents});
//     var fourth = image.expression('(B * FOURTH)', {'B':b,'FOURTH': fourth_coefficents});
//     var fifth = image.expression( '(B * FIFTH)', {'B':b,'FIFTH': fifth_coefficents });
//     var sixth = image.expression('(B * SIXTH)', {'B':b,'SIXTH': sixth_coefficents });
    
//     brightness = brightness.reduce(ee.call("Reducer.sum"));
//     greenness = greenness.reduce(ee.call("Reducer.sum"));
//     wetness = wetness.reduce(ee.call("Reducer.sum"));
//     fourth = fourth.reduce(ee.call("Reducer.sum"));
//     fifth = fifth.reduce(ee.call("Reducer.sum"));
//     sixth = sixth.reduce(ee.call("Reducer.sum"));
//     return ee.Image(brightness).addBands(greenness)
//                               .addBands(wetness)
//                               .addBands(fourth)
//                               .addBands(fifth)
//                               .addBands(sixth)
//                               .rename('brightness','greenness','wetness','fourth','fifth','sixth').clip(ROI);
//   });
//   return tasseled_cap.median();
// }


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// not recommended
function _opticalIndicesS2(ImageCollection, ROI){

  function maskS2clouds(image) {
    var qa = image.select('QA60');
  
    // Bits 10 and 11 are clouds and cirrus, respectively.
    var cloudBitMask = 1 << 10;
    var cirrusBitMask = 1 << 11;
  
    // Both flags should be set to zero, indicating clear conditions.
    var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
                 .and(qa.bitwiseAnd(cirrusBitMask).eq(0));
  
    return image.updateMask(mask).divide(10000);
  }

  var S2_NDVI = ImageCollection.map(maskS2clouds).map(function(image) { 
    var conv =  image.normalizedDifference(['B8', 'B4']).rename('S2_NDVI');
    return  ee.Image(conv.copyProperties(image)).set('system:time_start', image.get('system:time_start')).clip(ROI);//.mosaic()
  }).median();
  
  var S2_NDWI = ImageCollection.map(maskS2clouds).map(function(image) { 
    var conv =  image.normalizedDifference(['B3', 'B8']).rename('S2_NDWI');
    return  ee.Image(conv.copyProperties(image)).set('system:time_start', image.get('system:time_start')).clip(ROI);
  }).median();

  var S2_MNDWI = ImageCollection.map(maskS2clouds).map(function(image) { 
    var conv =  image.normalizedDifference(['B3', 'B11']).rename('S2_MNDWI');
    return  ee.Image(conv.copyProperties(image)).set('system:time_start', image.get('system:time_start')).clip(ROI);
  }).median();
  
  var S2_SAVI = ImageCollection.map(maskS2clouds).map(function(image) { 
    var conv =  image.expression('((NIR - RED) / (NIR + RED + 0.5))*(1.5)', {
                                  'NIR': image.select('B8'),
                                  'RED': image.select('B4')}).rename("S2_SAVI");
    return  ee.Image(conv.copyProperties(image)).set('system:time_start', image.get('system:time_start')).clip(ROI);
  }).median();
        
  var S2_NDMI = ImageCollection.map(maskS2clouds).map(function(image) { 
    var conv =  image.normalizedDifference(['B8', 'B11']).rename('S2_NDMI');
    return  ee.Image(conv.copyProperties(image)).set('system:time_start', image.get('system:time_start')).clip(ROI);
  }).median();
    
  var S2_NDBI  = ImageCollection.map(maskS2clouds).map(function(image) { 
    var conv =  image.normalizedDifference(['B11', 'B8']).rename('S2_NDBI');
    return  ee.Image(conv.copyProperties(image)).set('system:time_start', image.get('system:time_start')).clip(ROI);
  }).median();
  
  return S2_NDVI.addBands([S2_NDWI, S2_MNDWI, S2_SAVI, S2_NDMI, S2_NDBI]);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function opticalIndicesS2(ImageCollection){

  function maskS2clouds(image) {
    var qa = image.select('QA60');
  
    // Bits 10 and 11 are clouds and cirrus, respectively.
    var cloudBitMask = 1 << 10;
    var cirrusBitMask = 1 << 11;
  
    // Both flags should be set to zero, indicating clear conditions.
    var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
                 .and(qa.bitwiseAnd(cirrusBitMask).eq(0));
  
    return image.updateMask(mask).divide(10000);
  }
  
  ImageCollection = ImageCollection.map(maskS2clouds);
  
  var image = ImageCollection.median();

  var S2_NDVI = image.normalizedDifference(['B8', 'B4']).rename('S2_NDVI');
  
  var S2_NDWI = image.normalizedDifference(['B3', 'B8']).rename('S2_NDWI');

  var S2_MNDWI = image.normalizedDifference(['B3', 'B11']).rename('S2_MNDWI');
  
  var S2_SAVI = image.expression('((NIR - RED) / (NIR + RED + 0.5))*(1.5)', {
                                  'NIR': image.select('B8'),
                                  'RED': image.select('B4')}).rename('S2_SAVI');
        
  var S2_NDMI = image.normalizedDifference(['B8', 'B11']).rename('S2_NDMI');
    
  var S2_NDBI = image.normalizedDifference(['B11', 'B8']).rename('S2_NDBI');

  return S2_NDVI.addBands([S2_NDWI, S2_MNDWI, S2_SAVI, S2_NDMI, S2_NDBI]);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// mosaic unknown area
// not recommended
function _radarIndicesS1(ImageCollection, ROI) {

  var vvMosaic = ImageCollection.select('VV').mosaic();
  var VV = ImageCollection.select('VV').median().unmask(vvMosaic);

  var vhMosaic = ImageCollection.select('VV').mosaic();
  var VH = ImageCollection.select('VH').median().unmask(vhMosaic);

  var S1_ratio = ImageCollection.map(function(image) {
    var vv = image.select('VV').unmask(vvMosaic);
    var vh = image.select('VH').unmask(vhMosaic);
    var ratio = vv.divide(vh).rename('ratio');
    return  ee.Image(ratio.copyProperties(image)).set('system:time_start', image.get('system:time_start'));
  }).median();

  var S1_ndratio = ImageCollection.map(function(image) { 
    var vv = image.select('VV').unmask(vvMosaic);
    var vh = image.select('VH').unmask(vhMosaic);
    var ndratio =  image.expression('(vv - vh) / (vv + vh)', {'vv': vv, 'vh': vh}).rename('ndratio');
    return  ee.Image(ndratio.copyProperties(image)).set('system:time_start', image.get('system:time_start'));
  }).median();

  return VV.addBands([VH, S1_ratio, S1_ndratio]);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function radarIndicesS1(ImageCollection) {

  var VV = ImageCollection.select('VV').median();
  var VH = ImageCollection.select('VH').median();
  var S1_ratio = VV.divide(VH).rename('ratio');
  var S1_ndratio = VV.subtract(VH).divide(VV.add(VH)).rename('ndratio');

  return VV.addBands([VH, S1_ratio, S1_ndratio]);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
exports.opticalIndicesLandsat  = opticalIndicesLandsat;
exports.opticalIndicesS2 = opticalIndicesS2;
exports.radarIndicesS1 = radarIndicesS1;
