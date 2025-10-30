import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import schema from './propertyhub-feed-schema-v2.json';
import { transformFeed } from './transform-feed.js';

const PORT = process.env.PORT || 3000;

// Initialize Ajv with options
const ajv = new Ajv2020({
  allErrors: true,
  verbose: true,
  strict: false,
  validateFormats: true
});
addFormats(ajv);

// Add schema to AJV first so all $refs are available
ajv.addSchema(schema);

// Compile validators
const validateFeed = ajv.compile(schema);
const validateListing = ajv.getSchema('#/$defs/listing');

// Helper function to format errors in a user-friendly way
function formatErrors(errors) {
  if (!errors) return [];
  
  return errors.map(error => {
    const path = error.instancePath || '/';
    let message = error.message;
    
    // Enhanced error messages
    switch (error.keyword) {
      case 'required':
        message = `Missing required field: ${error.params.missingProperty}`;
        break;
      case 'enum':
        message = `Invalid value. Must be one of: ${error.params.allowedValues.join(', ')}`;
        break;
      case 'type':
        message = `Expected ${error.params.type} but got ${typeof error.data}`;
        break;
      case 'format':
        message = `Invalid format for ${error.params.format}`;
        break;
      case 'minimum':
        message = `Value must be >= ${error.params.limit}`;
        break;
      case 'maximum':
        message = `Value must be <= ${error.params.limit}`;
        break;
      case 'maxItems':
        message = `Array must not have more than ${error.params.limit} items`;
        break;
      case 'minLength':
        message = `String length must be >= ${error.params.limit}`;
        break;
      case 'maxLength':
        message = `String length must be <= ${error.params.limit}`;
        break;
      case 'pattern':
        message = `String does not match pattern: ${error.params.pattern}`;
        break;
    }
    
    return {
      path: path,
      field: path.split('/').pop() || 'root',
      message: message,
      keyword: error.keyword,
      params: error.params,
      ...(error.keyword !== 'required' && { data: error.data })
    };
  });
}

// Helper to group errors by listing
function groupErrorsByListing(errors) {
  const grouped = {};
  
  errors.forEach(error => {
    const match = error.path.match(/^\/listingData\/(\d+)/);
    if (match) {
      const index = match[1];
      if (!grouped[index]) {
        grouped[index] = [];
      }
      grouped[index].push({
        ...error,
        path: error.path.replace(`/listingData/${index}`, '') || '/'
      });
    } else {
      if (!grouped['_root']) {
        grouped['_root'] = [];
      }
      grouped['_root'].push(error);
    }
  });
  
  return grouped;
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const server = Bun.serve({
  port: PORT,
  
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;
    
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { 
        status: 204,
        headers: corsHeaders 
      });
    }
    
    // Root endpoint - serve HTML page
    if (path === '/' && req.method === 'GET') {
      const file = Bun.file('./index.html');
      return new Response(file, { 
        headers: { 
          'Content-Type': 'text/html',
          ...corsHeaders 
        } 
      });
    }
    
    // Get schema endpoint
    if (path === '/schema' && req.method === 'GET') {
      return Response.json(schema, { headers: corsHeaders });
    }
    
    // Health check
    if (path === '/health' && req.method === 'GET') {
      return Response.json({ 
        status: 'ok',
        runtime: 'Bun',
        version: Bun.version
      }, { headers: corsHeaders });
    }
    
    // Validate feed endpoint
    if (path === '/validate' && req.method === 'POST') {
      try {
        let feed = await req.json();
        
        // Check if transformation is requested via query param
        const url = new URL(req.url);
        const shouldTransform = url.searchParams.get('transform') === 'true';
        
        if (shouldTransform) {
          feed = transformFeed(feed);
        }
        
        // Validate
        const valid = validateFeed(feed);
        
        if (valid) {
          return Response.json({
            valid: true,
            message: 'Feed validation successful',
            listingCount: feed.listingCount,
            actualListings: feed.listingData?.length || 0
          }, { headers: corsHeaders });
        }
        
        // Format and group errors
        const formattedErrors = formatErrors(validateFeed.errors);
        const groupedErrors = groupErrorsByListing(formattedErrors);
        
        // Build response
        const response = {
          valid: false,
          message: 'Feed validation failed',
          totalErrors: formattedErrors.length,
          errors: formattedErrors,
          errorsByListing: groupedErrors
        };
        
        // Add summary
        if (groupedErrors._root) {
          response.rootErrors = groupedErrors._root.length;
        }
        
        const listingErrorCount = Object.keys(groupedErrors)
          .filter(k => k !== '_root')
          .reduce((acc, key) => acc + groupedErrors[key].length, 0);
        
        if (listingErrorCount > 0) {
          response.listingErrors = listingErrorCount;
          response.listingsWithErrors = Object.keys(groupedErrors).filter(k => k !== '_root').length;
        }
        
        return Response.json(response, { 
          status: 400,
          headers: corsHeaders 
        });
        
      } catch (error) {
        return Response.json({
          valid: false,
          message: 'Invalid JSON or server error',
          error: error.message
        }, { 
          status: 400,
          headers: corsHeaders 
        });
      }
    }
    
    // Validate single listing endpoint
    if (path === '/validate-listing' && req.method === 'POST') {
      try {
        const listing = await req.json();
        
        const valid = validateListing(listing);
        
        if (valid) {
          return Response.json({
            valid: true,
            message: 'Listing validation successful',
            refNo: listing.refNo
          }, { headers: corsHeaders });
        }
        
        const formattedErrors = formatErrors(validateListing.errors);
        
        return Response.json({
          valid: false,
          message: 'Listing validation failed',
          refNo: listing.refNo,
          totalErrors: formattedErrors.length,
          errors: formattedErrors
        }, { 
          status: 400,
          headers: corsHeaders 
        });
        
      } catch (error) {
        return Response.json({
          valid: false,
          message: 'Invalid JSON or server error',
          error: error.message
        }, { 
          status: 400,
          headers: corsHeaders 
        });
      }
    }
    
    // 404 for unknown routes
    return Response.json({
      error: 'Not Found',
      message: `Route ${path} not found`
    }, { 
      status: 404,
      headers: corsHeaders 
    });
  }
});

console.log(`🚀 PropertyHub Feed Validator running on port ${server.port}`);
console.log(`📝 Endpoints:`);
console.log(`   POST http://localhost:${server.port}/validate`);
console.log(`   POST http://localhost:${server.port}/validate-listing`);
console.log(`   GET  http://localhost:${server.port}/schema`);
console.log(`   GET  http://localhost:${server.port}/health`);
console.log(`\n⚡ Powered by Bun ${Bun.version}`);
