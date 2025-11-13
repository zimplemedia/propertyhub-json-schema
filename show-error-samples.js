#!/usr/bin/env node
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import schema from './propertyhub-feed-schema-v2.json' with { type: 'json' };
import { readFileSync } from 'fs';

const filename = process.argv[2];
const maxSamples = parseInt(process.argv[3]) || 20;

if (!filename) {
  console.error('Usage: bun show-error-samples.js <json-file> [max-samples-per-type]');
  process.exit(1);
}

const ajv = new Ajv2020({
  allErrors: true,
  verbose: true,
  strict: false,
  validateFormats: true
});
addFormats(ajv);
ajv.addSchema(schema);

const validateFeed = ajv.compile(schema);

let jsonData;
try {
  const fileContent = readFileSync(filename, 'utf-8');
  jsonData = JSON.parse(fileContent);
} catch (error) {
  console.error('❌ Error reading or parsing JSON file:');
  console.error(error.message);
  process.exit(1);
}

const valid = validateFeed(jsonData);

if (valid) {
  console.log('✅ Validation successful!');
  process.exit(0);
}

// Collect errors with samples
const errorGroups = {};

validateFeed.errors.forEach((error) => {
  // Extract listing index
  const match = error.instancePath.match(/\/listingData\/(\d+)/);
  if (!match) return;
  
  const listingIndex = parseInt(match[1]);
  const listing = jsonData.listingData[listingIndex];
  
  // Create error key
  let errorKey;
  const pathParts = error.instancePath.split('/').filter(p => p && isNaN(p));
  const cleanPath = pathParts.join('/');
  errorKey = `${cleanPath} - ${error.message}`;

  if (!errorGroups[errorKey]) {
    errorGroups[errorKey] = {
      count: 0,
      message: error.message,
      pathPattern: error.instancePath.replace(/\/\d+/g, '/[#]'),
      params: error.params,
      samples: []
    };
  }
  
  errorGroups[errorKey].count++;
  
  // Add sample if we haven't reached the limit
  if (errorGroups[errorKey].samples.length < maxSamples) {
    errorGroups[errorKey].samples.push({
      refNo: listing?.refNo || 'N/A',
      listingIndex,
      propertyType: listing?.propertyType,
      postType: listing?.postType
    });
  }
});

// Sort by count
const sortedErrors = Object.entries(errorGroups)
  .sort((a, b) => b[1].count - a[1].count);

console.log('📊 VALIDATION ERRORS WITH SAMPLE refNos');
console.log('='.repeat(100));
console.log(`Total errors: ${validateFeed.errors.length}`);
console.log(`Showing up to ${maxSamples} samples per error type`);
console.log('');

sortedErrors.forEach(([key, data], index) => {
  console.log(`${index + 1}. [${data.count}×] ${data.message}`);
  console.log(`   Path: ${data.pathPattern}`);
  if (data.params && Object.keys(data.params).length > 0) {
    console.log(`   Details: ${JSON.stringify(data.params)}`);
  }
  console.log(`   Sample refNos (showing ${data.samples.length} of ${data.count}):`);
  data.samples.forEach((sample, idx) => {
    console.log(`      ${idx + 1}. refNo: "${sample.refNo}" (${sample.propertyType} - ${sample.postType}) [index: ${sample.listingIndex}]`);
  });
  console.log('');
});

console.log('='.repeat(100));
