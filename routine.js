////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function maskL7L8(image) {
  //Bits 3 and 5 are cloud shadow and cloud, respectively.
  var cloudShadowBitMask = (1 << 4);
  var cloudsBitMask = (1 << 3);
  // Get the pixel QA band.
  var qa = image.select('QA_PIXEL');
  // Both flags should be set to zero, indicating clear conditions.
  var mask = qa.bitwiseAnd(cloudShadowBitMask).eq(0)
               .and(qa.bitwiseAnd(cloudsBitMask).eq(0));
  return image.updateMask(mask);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function getL7L8ReducedImage(listofDates, LS8, LS7) {
  LS8 = LS8.map(applyScaleFactors).map(maskL7L8);
  LS7 = LS7.map(applyScaleFactors).map(maskL7L8);
  return listofDates.map(function (ld) {
    var icL8 = ee.ImageCollection(LS8.filterDate(ee.Dictionary(ld).get('startDate'), ee.Dictionary(ld).get('endDate')));
    var icL7 = ee.ImageCollection(LS7.filterDate(ee.Dictionary(ld).get('startDate'), ee.Dictionary(ld).get('endDate')));
    var lc = icL8.merge(icL7);
    // return lc.median();
    return lc.mosaic();
  });
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function applyScaleFactors(image) {
  // var opticalBands = image.select('SR_B.').multiply(0.0000275).add(-0.2);
  // var thermalBands = image.select('ST_B.*').multiply(0.00341802).add(149.0);
  // return image.addBands(opticalBands, null, true)
  //             .addBands(thermalBands, null, true);
  var opticalBands = image.select(['green', 'red', 'nir', 'swir1']).multiply(0.0000275).add(-0.2);
  return image.addBands(opticalBands, null, true);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var getQABits = function(image, start, end, newName) {
    // Compute the bits we need to extract.
    var pattern = 0;
    for (var i = start; i <= end; i++) {
       pattern += Math.pow(2, i);
    }
    // Return a single band image of the extracted QA bits, giving the band
    // a new name.
    return image.select([0], [newName])
                  .bitwiseAnd(pattern)
                  .rightShift(start);
};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function maskL8ToaClouds (image) {

  // A function to mask out cloudy pixels.
  function cloud_shadows (image) {
    // Select the QA band.
    var QA = image.select(['BQA']);
    // Get the internal_cloud_algorithm_flag bit.
    return getQABits(QA, 7, 8, 'Cloud_shadows').eq(1);
    // Return an image masking out cloudy areas.
  }
  
  // A function to mask out cloudy pixels.
  function clouds (image) {
    // Select the QA band.
    var QA = image.select(['BQA']);
    // Get the internal_cloud_algorithm_flag bit.
    return getQABits(QA, 4, 4, 'Cloud').eq(0);
    // Return an image masking out cloudy areas.
  }

  var cs = cloud_shadows(image);
  var c = clouds(image);
  image = image.updateMask(cs);
  return image.updateMask(c);
};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.getL7L8ReducedImage = getL7L8ReducedImage;
exports.maskL7L8 = maskL7L8;
exports.applyScaleFactors = applyScaleFactors;
exports.maskL8ToaClouds = maskL8ToaClouds;
