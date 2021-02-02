@Library ('folio_jenkins_shared_libs@FOLIO-2920') _

buildNPM {
  publishModDescriptor = 'no'
  runLint = 'yes'
  runTest = 'yes'
  runSonarqube = true
  sonarScanDirs = './lib'
   
  runScripts = [
   ['test:coverage':'']
  ]
}
