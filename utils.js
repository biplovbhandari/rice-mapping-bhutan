var derivedIndices = require('users/biplovbhandari/Rice_Mapping_Bhutan:indices.js');
var tasseledCap_indices = require('users/biplovbhandari/Rice_Mapping_Bhutan:TCAP_Optical_Export.js');


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function getIndices(listofDates, IC, ROI, type) {
  
  if (type == 'landsat') {
    var l8Indices = listofDates.map(function (ld) {
      var icL8 = ee.ImageCollection(IC.filterDate(ee.Dictionary(ld).get('startDate'), ee.Dictionary(ld).get('endDate')));
      return derivedIndices.opticalIndicesLandsat(icL8);
    });
    return l8Indices;
  } else if (type == 'sentinel2') {
    var s2Indices = listofDates.map(function (ld) {
      var ic2 = ee.ImageCollection(IC.filterDate(ee.Dictionary(ld).get('startDate'), ee.Dictionary(ld).get('endDate')));
      return derivedIndices.opticalIndicesS2(ic2);
    });
    return s2Indices; 
  } else if (type == 'tc') {
    var tcIndices = listofDates.map(function (ld) {
      var ic2 = ee.ImageCollection(IC.filterDate(ee.Dictionary(ld).get('startDate'), ee.Dictionary(ld).get('endDate')));
      return derivedIndices.opticalIndicesS2tasseledCap_indices.calculateTasseledCap(ic2, ROI);
    });
    return tcIndices; 
  } else if (type == 'sentinel1') {
    var s1Final = listofDates.map(function (ld) {
      var ic2 = ee.ImageCollection(IC.filterDate(ee.Dictionary(ld).get('startDate'), ee.Dictionary(ld).get('endDate')));
      return derivedIndices.radarIndicesS1(ic2);
    });
    return s1Final;
  } else if (type == 'combinedLandsat') {
    var indices = IC.map(function (image) {
      return derivedIndices.opticalIndicesLandsat(image);
    });
    return indices;
  }
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function bulkRenameBands(bandNames, type, phase) {
  if (type == 'sentinel2') {
    return bandNames.map(function (bandName) {
      var splitBandName = ee.String(bandName).split('_');
      return ee.String(splitBandName.get(1)).cat('_').cat(ee.String(splitBandName.get(2))).cat('_').cat(ee.String(splitBandName.get(0)));
    });
  } else if (type == 'sentinel1') {
    return bandNames.map(function (bandName) {
      var splitBandName = ee.String(bandName).split('_');
      return ee.String(phase).cat('_').cat(ee.String(splitBandName.get(1))).cat('_').cat(ee.String(splitBandName.get(0)));
    });
  } else {
    return bandNames.map(function (bandName) {
      var splitBandName = ee.String(bandName).split('_');
      return ee.String(splitBandName.get(1)).cat('_').cat(ee.String(splitBandName.get(0)));
    });
  }
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function timePeriodSelector (ImageCollection, list_m, list_y,ROI){
  var Selected_Month_Year_IC =  list_y.map(function (y) {
    var list_ic = list_m.map(function (m) {
      var xic = ImageCollection.filterBounds(ROI).filter(
        ee.Filter.date(ee.Date.fromYMD(y, m, 1), ee.Date.fromYMD(y, m, 30))
      );
      return xic.toList(xic.size());
    });
    return ee.List(list_ic).flatten();
  });
  return ee.List(Selected_Month_Year_IC).flatten();
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function dateSplitter (ImageCollection, MonthRange1, MonthRange2, YearRange1, YearRange2, ROI){
  return ee.ImageCollection(
    ImageCollection.filter(ee.Filter.calendarRange(MonthRange1, MonthRange2, 'month'))
                   .filter(ee.Filter.calendarRange(YearRange1, YearRange2, 'year'))
  ).filterBounds(ROI);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


exports.getIndices = getIndices;
exports.bulkRenameBands = bulkRenameBands;
exports.timePeriodSelector = timePeriodSelector;
exports.dateSplitter = dateSplitter;
