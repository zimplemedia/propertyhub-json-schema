#!/usr/bin/env node
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import schema from './propertyhub-feed-schema-v2.json' with { type: 'json' };
import { readFileSync, writeFileSync } from 'fs';
import { transformFeed } from './transform-feed.js';

// Get filename from command line args
const filename = process.argv[2];
const shouldTransform = process.argv.includes('--transform') || process.argv.includes('-t');
const outputFile = process.argv.includes('--output') ? process.argv[process.argv.indexOf('--output') + 1] : null;

if (!filename) {
  console.error('Usage: bun summarize-errors.js <json-file> [options]');
  console.error('');
  console.error('Options:');
  console.error('  -t, --transform    Transform relaxed input to strict format before validation');
  console.error('  --output <file>    Save transformed output to file');
  console.error('');
  console.error('Examples:');
  console.error('  bun summarize-errors.js feed.json');
  console.error('  bun summarize-errors.js feed.json --transform');
  console.error('  bun summarize-errors.js feed.json -t --output transformed.json');
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

// Transform if requested
if (shouldTransform) {
  console.log('🔄 Transforming relaxed input to strict format...\n');
  jsonData = transformFeed(jsonData);
  
  // Save transformed output if requested
  if (outputFile) {
    try {
      writeFileSync(outputFile, JSON.stringify(jsonData, null, 2), 'utf-8');
      console.log(`💾 Transformed data saved to: ${outputFile}\n`);
    } catch (error) {
      console.error('⚠️  Warning: Could not save transformed output:');
      console.error(error.message);
      console.error('');
    }
  }
}

const valid = validateFeed(jsonData);

if (valid) {
  console.log('✅ Validation successful!');
  process.exit(0);
}

// Analyze errors
const errorSummary = {};
const affectedListings = new Set();
const maxSamples = 20;

validateFeed.errors.forEach((error) => {
  // Extract listing index if available
  const match = error.instancePath.match(/\/listingData\/(\d+)/);
  if (match) {
    affectedListings.add(parseInt(match[1]));
  }

  // Create error key
  let errorKey;
  if (error.instancePath) {
    const pathParts = error.instancePath.split('/').filter(p => p && isNaN(p));
    errorKey = `${pathParts.join('/')} - ${error.message}`;
  } else {
    errorKey = error.message;
  }

  if (!errorSummary[errorKey]) {
    errorSummary[errorKey] = {
      count: 0,
      message: error.message,
      path: error.instancePath || '/',
      params: error.params,
      samples: []
    };
  }
  errorSummary[errorKey].count++;
  
  // Add sample if we haven't reached the limit
  if (match && errorSummary[errorKey].samples.length < maxSamples) {
    const listingIndex = parseInt(match[1]);
    const listing = jsonData.listingData[listingIndex];
    errorSummary[errorKey].samples.push({
      refNo: listing?.refNo || 'N/A',
      listingIndex,
      propertyType: listing?.propertyType,
      postType: listing?.postType
    });
  }
});

// Sort by count
const sortedErrors = Object.entries(errorSummary)
  .sort((a, b) => b[1].count - a[1].count);

// Separate cascading errors from real errors
const cascadingErrors = sortedErrors.filter(([key, data]) => 
  data.message === 'must match "then" schema' || 
  data.message === 'must match "if" schema'
);
const realErrors = sortedErrors.filter(([key, data]) => 
  data.message !== 'must match "then" schema' && 
  data.message !== 'must match "if" schema'
);

const totalCascadingCount = cascadingErrors.reduce((sum, [, data]) => sum + data.count, 0);

console.log('📊 VALIDATION ERROR SUMMARY');
console.log('='.repeat(80));
console.log(`Total errors: ${validateFeed.errors.length}`);
console.log(`  - Real errors: ${validateFeed.errors.length - totalCascadingCount}`);
console.log(`  - Cascading errors (noise): ${totalCascadingCount}`);
console.log(`Total unique error types: ${realErrors.length} (excluding cascading)`);
console.log(`Affected listings: ${affectedListings.size} out of ${jsonData.listingData?.length || 0}`);
console.log('');

console.log('ERROR BREAKDOWN BY TYPE:');
console.log('-'.repeat(80));

realErrors.forEach(([key, data], index) => {
  console.log(`${index + 1}. [${data.count}×] ${data.message}`);
  const examplePath = data.path.replace(/\/\d+/g, '/[#]');
  console.log(`   Path pattern: ${examplePath}`);
  if (data.params && Object.keys(data.params).length > 0) {
    console.log(`   Details: ${JSON.stringify(data.params)}`);
  }
  
  // Show sample refNos if available
  if (data.samples && data.samples.length > 0) {
    console.log(`   Sample refNos (showing ${data.samples.length} of ${data.count}):`);
    data.samples.forEach((sample, idx) => {
      console.log(`      ${idx + 1}. "${sample.refNo}" (${sample.propertyType} - ${sample.postType}) [index: ${sample.listingIndex}]`);
    });
  }
  console.log('');
});

console.log('='.repeat(80));
console.log(`Total: ${validateFeed.errors.length - totalCascadingCount} real errors across ${affectedListings.size} listings`);
if (totalCascadingCount > 0) {
  console.log(`Note: ${totalCascadingCount} cascading "must match then/if schema" errors were filtered (these are side-effects of the real errors above)`);
}
