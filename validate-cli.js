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
  console.error('Usage: bun validate-cli.js <json-file> [options]');
  console.error('');
  console.error('Options:');
  console.error('  -t, --transform    Transform relaxed input to strict format before validation');
  console.error('  --output <file>    Save transformed output to file');
  console.error('');
  console.error('Examples:');
  console.error('  bun validate-cli.js feed.json');
  console.error('  bun validate-cli.js feed.json --transform');
  console.error('  bun validate-cli.js feed.json -t --output transformed.json');
  process.exit(1);
}

// Initialize AJV
const ajv = new Ajv2020({
  allErrors: true,
  verbose: true,
  strict: false,
  validateFormats: true
});
addFormats(ajv);

// Add schema
ajv.addSchema(schema);

// Compile validator
const validateFeed = ajv.compile(schema);

// Read and parse JSON file
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

// Validate
const valid = validateFeed(jsonData);

if (valid) {
  console.log('✅ Validation successful!');
  console.log(`\nFeed Details:`);
  console.log(`  Listing Count: ${jsonData.listingCount}`);
  console.log(`  Actual Listings: ${jsonData.listingData?.length || 0}`);
  console.log(`  Updated At: ${jsonData.updatedAt}`);
  process.exit(0);
} else {
  console.error('❌ Validation failed!\n');
  console.error(`Found ${validateFeed.errors.length} error(s):\n`);
  
  validateFeed.errors.forEach((error, index) => {
    console.error(`Error ${index + 1}:`);
    console.error(`  Path: ${error.instancePath || '/'}`);
    console.error(`  Message: ${error.message}`);
    if (error.params && Object.keys(error.params).length > 0) {
      console.error(`  Details: ${JSON.stringify(error.params)}`);
    }
    console.error('');
  });
  
  process.exit(1);
}
