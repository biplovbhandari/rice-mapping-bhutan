////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function randomForest(FeatureCollection, bandList, image, label) {
    
  var split = 0.75;
  var training = FeatureCollection.filter(ee.Filter.lt('random', split));
  var testing = FeatureCollection.filter(ee.Filter.gte('random', split));
  
  // Make a Random Forest classifier and train it.
  var trainedClassifier = ee.Classifier.smileRandomForest({
    numberOfTrees: 20,
    // variablesPerSplit: ,
    // minLeafPopulation:,
    // bagFraction:,
    // maxNodes:,
    seed:7
  }).train({
    features: training,
    classProperty: label,
    inputProperties: bandList,
    subsamplingSeed: 7
  });
  
  var dict_RF = trainedClassifier.explain();
  var variable_importance_RF = ee.Feature(null, ee.Dictionary(dict_RF).get('importance'));
  var chart_variable_importance_RF =
    ui.Chart.feature.byProperty(variable_importance_RF)
    .setChartType('ColumnChart')
    .setOptions({
    title: 'Random Forest Variable Importance',
    legend: {position: 'none'},
    hAxis: {title: 'Bands'},
    vAxis: {title: 'Importance'}
    });
  print("chart_variable_importance_RF", chart_variable_importance_RF);   
  
  
  // Classify the test FeatureCollection.
  var testingClassified = testing.classify(trainedClassifier);

  // Print the confusion matrix.
  var errorMatrix = testingClassified.errorMatrix(label, 'classification');
  print('Error Matrix', errorMatrix);
  print('Test accuracy: ', errorMatrix.accuracy());
  print('Test kappa: ', errorMatrix.kappa());
  return trainedClassifier;
}



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.randomForest = randomForest;
