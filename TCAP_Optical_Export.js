
////////////////////////////////////
//
//   Tassled Cap
//
////////////////////////////////////
////cloudmasking
//////https://gis.stackexchange.com/questions/274612/apply-a-cloud-mask-to-a-landsat8-collection-in-google-earth-engine-time-series


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

// A function to mask out cloudy pixels.
var cloud_shadows = function(image) {
  // Select the QA band.
  var QA = image.select(['BQA']);
  // Get the internal_cloud_algorithm_flag bit.
  return getQABits(QA, 7,8, 'Cloud_shadows').eq(1);
  // Return an image masking out cloudy areas.
};

// A function to mask out cloudy pixels.
var clouds = function(image) {
  // Select the QA band.
  var QA = image.select(['BQA']);
  // Get the internal_cloud_algorithm_flag bit.
  return getQABits(QA, 4,4, 'Cloud').eq(0);
  // Return an image masking out cloudy areas.
};

var maskClouds = function(image) {
  var cs = cloud_shadows(image);
  var c = clouds(image);
  image = image.updateMask(cs);
  return image.updateMask(c);
};

////////////////////////////////////////////////////

function calculateTasseledCap(ImageCollection,ROI){

            var tasseled_cap = ImageCollection.map(maskClouds).map(function(image) { 
              var b = image.select("B2", "B3", "B4", "B5", "B6", "B7");
              //Coefficients are only for Landsat 8 TOA
              var brightness_coefficents= ee.Image([0.3029, 0.2786, 0.4733, 0.5599, 0.508, 0.1872])
              var greenness_coefficents= ee.Image([-0.2941, -0.243, -0.5424, 0.7276, 0.0713, -0.1608]);
              var wetness_coefficents= ee.Image([0.1511, 0.1973, 0.3283, 0.3407, -0.7117, -0.4559]);
              var fourth_coefficents= ee.Image([-0.8239, 0.0849, 0.4396, -0.058, 0.2013, -0.2773]);
              var fifth_coefficents= ee.Image([-0.3294, 0.0557, 0.1056, 0.1855, -0.4349, 0.8085]);
              var sixth_coefficents= ee.Image([0.1079, -0.9023, 0.4119, 0.0575, -0.0259, 0.0252]);
            
              var brightness = image.expression('(B * BRIGHTNESS)',{'B':b, 'BRIGHTNESS': brightness_coefficents});
              var greenness = image.expression('(B * GREENNESS)',{'B':b,'GREENNESS': greenness_coefficents});
              var wetness = image.expression('(B * WETNESS)', {'B':b,'WETNESS': wetness_coefficents});
              var fourth = image.expression('(B * FOURTH)', {'B':b,'FOURTH': fourth_coefficents});
              var fifth = image.expression( '(B * FIFTH)', {'B':b,'FIFTH': fifth_coefficents });
              var sixth = image.expression('(B * SIXTH)', {'B':b,'SIXTH': sixth_coefficents });
              
              brightness = brightness.reduce(ee.call("Reducer.sum"));
              greenness = greenness.reduce(ee.call("Reducer.sum"));
              wetness = wetness.reduce(ee.call("Reducer.sum"));
              fourth = fourth.reduce(ee.call("Reducer.sum"));
              fifth = fifth.reduce(ee.call("Reducer.sum"));
              sixth = sixth.reduce(ee.call("Reducer.sum"));
              return ee.Image(brightness).addBands(greenness)
                                        .addBands(wetness)
                                        .addBands(fourth)
                                        .addBands(fifth)
                                        .addBands(sixth)
                                        .rename('brightness','greenness','wetness','fourth','fifth','sixth').clip(ROI);
          })
        return tasseled_cap.median()//.clip(ROI)
} 

exports.calculateTasseledCap = calculateTasseledCap



