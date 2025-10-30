# PropertyHub JSON Feed Validator (Bun)

A high-performance validation API for PropertyHub JSON feed specification v1.10, powered by Bun runtime.

## Why Bun?

- ⚡ **Fast startup** - Bun starts 4x faster than Node.js
- 🚀 **High performance** - Native JSON parsing and HTTP server
- 📦 **Built-in tooling** - No need for nodemon, built-in hot reload
- 🔋 **Batteries included** - Native TypeScript support, bundler, test runner

## Prerequisites

Install Bun:
```bash
curl -fsSL https://bun.sh/install | bash
```

Or with npm:
```bash
npm install -g bun
```

## Quick Start

```bash
# Install dependencies
bun install

# Start server
bun run start

# Start with hot reload (for development)
bun run dev
```

The server will start on `http://localhost:3000`

## Feed Transformation

The validator includes a **transformation utility** that converts relaxed/legacy feed formats to strict schema-compliant format. This allows you to:

- Keep the schema as the single source of truth (strict validation)
- Support legacy feeds with relaxed formats
- Gradually migrate to strict format

### What the Transformer Does

1. **Number fields** (lat, lng, floorArea, etc.): Converts strings to numbers
   - `"12.5375411"` → `12.5375411`
   - `"1,000.50"` → `1000.50`
   - `""`, `"-"`, or invalid → `null` (field removed)

2. **Integer fields** (numberOfBed, price, etc.): Converts to integers
   - `"25000"` → `25000`
   - `25000.5` → `25000` (floored)
   - `""`, `"-"`, or invalid → `null` (field removed)
   - **Exception**: `projectId` - kept as-is if invalid (for reference)

3. **String fields**: Cleans up empty values
   - `""`, `"-"` → `undefined` (field removed)
   - Trims whitespace

4. **Legacy field names**: Renames old field names to new schema
   - `deposit.type` → `deposit.depositType`
   - `advancePayment.type` → `advancePayment.advancePaymentType`
   - `amenities.hasAir` → `amenities.hasAirCondition`

5. **Title and Detail**: Handles missing Thai translations
   - If `title.th` is missing but `title.en` exists → Copy `en` to `th`
   - If `detail.th` is missing but `detail.en` exists → Copy `en` to `th`
   - If `detail` is a string → Convert to object: `{ th: value, en: value }`

6. **Pictures**: Filters and normalizes URLs
   - Removes empty strings, `"-"`, or malformed URLs
   - Validates URL format (must have protocol like `https://`)
   - **Encodes special characters** (spaces, Thai, Chinese, emoji, etc.)
     - Spaces: `"file name.jpg"` → `"file%20name.jpg"`
     - Thai: `"บ้าน.jpg"` → `"%E0%B8%9A%E0%B9%89%E0%B8%B2%E0%B8%99.jpg"`
     - Mixed: `"City view_NEW.JPG"` → `"City%20view_NEW.JPG"`
   - Removes empty caption fields
   - Removes entire pictures array/object if no valid URLs remain

7. **tagName**: Converts comma-separated string to array
   - `"top_ad,Great Deal"` → `["top_ad", "Great Deal"]`
   - Trims whitespace from each tag
   - Removes empty or `"-"` tags
   - If already an array, cleans up the values

### CLI Usage

**Basic validation (strict):**
```bash
bun validate feed.json
```

**With transformation:**
```bash
bun validate feed.json --transform
```

**Transform and save output:**
```bash
bun validate feed.json -t --output transformed.json
```

**Full help:**
```bash
bun validate-cli.js
# Output:
# Usage: bun validate-cli.js <json-file> [options]
# 
# Options:
#   -t, --transform    Transform relaxed input to strict format before validation
#   --output <file>    Save transformed output to file
```

### API Usage

**Validate with transformation:**
```bash
curl -X POST 'http://localhost:3000/validate?transform=true' \
  -H "Content-Type: application/json" \
  -d @relaxed-feed.json
```

### Web UI

The web interface includes a checkbox to enable transformation before validation.

### Example Transformation

**Before (relaxed format):**
```json
{
  "refNo": "TEST-001",
  "propertyType": "CONDO",
  "postType": "FOR_RENT",
  "title": {
    "th": "คอนโด",
    "en": ""
  },
  "onFloor": "-",
  "floorArea": "45.5",
  "numberOfBed": "1",
  "numberOfBath": "1",
  "location": {
    "projectId": "12345",
    "lat": "13.7563",
    "lng": "100.5018"
  },
  "price": {
    "forRent": {
      "priceType": "AMOUNT",
      "price": "25000",
      "deposit": {
        "type": "MONTH",
        "month": "2"
      },
      "advancePayment": {
        "type": "MONTH",
        "month": "1"
      }
    }
  }
}
```

**After (strict format):**
```json
{
  "refNo": "TEST-001",
  "propertyType": "CONDO",
  "postType": "FOR_RENT",
  "title": {
    "th": "คอนโด"
  },
  "floorArea": 45.5,
  "numberOfBed": 1,
  "numberOfBath": 1,
  "location": {
    "projectId": 12345,
    "lat": 13.7563,
    "lng": 100.5018
  },
  "price": {
    "forRent": {
      "priceType": "AMOUNT",
      "price": 25000,
      "deposit": {
        "depositType": "MONTH",
        "month": 2
      },
      "advancePayment": {
        "advancePaymentType": "MONTH",
        "month": 1
      }
    }
  }
}
```

**Changes made:**
- `title.en`: Empty string removed
- `onFloor`: "-" value removed
- `floorArea`: String `"45.5"` → Number `45.5`
- `numberOfBed`: String `"1"` → Integer `1`
- `numberOfBath`: String `"1"` → Integer `1`
- `location.projectId`: String `"12345"` → Integer `12345`
- `location.lat`: String `"13.7563"` → Number `13.7563`
- `location.lng`: String `"100.5018"` → Number `100.5018`
- `price.forRent.price`: String `"25000"` → Integer `25000`
- `deposit.type`: Renamed to `deposit.depositType`
- `deposit.month`: String `"2"` → Integer `2`
- `advancePayment.type`: Renamed to `advancePayment.advancePaymentType`
- `advancePayment.month`: String `"1"` → Integer `1`

**Title transformation example:**
```json
// Before
"title": {
  "en": "Luxury Condo for Rent"
  // th is missing
}

// After
"title": {
  "th": "Luxury Condo for Rent",  // ✅ Copied from en
  "en": "Luxury Condo for Rent"
}
```

**Detail transformation example:**
```json
// Before (string format)
"detail": "Beautiful condo with amazing view"

// After
"detail": {
  "th": "Beautiful condo with amazing view",  // ✅ Converted from string
  "en": "Beautiful condo with amazing view"
}
```

**tagName transformation example:**
```json
// Before
"tagName": "top_ad,Great Deal GDO,Premium"

// After
"tagName": ["top_ad", "Great Deal GDO", "Premium"]  // ✅ Converted to array
```

**Picture transformation example:**
```json
// Before
"pictures": {
  "listing": [
    "https://example.com/valid.jpg",
    "",                                        // ← Invalid: empty
    "-",                                       // ← Invalid: placeholder
    "not-a-url",                               // ← Invalid: no protocol
    "https://example.com/file (2).jpg",        // ← Has spaces
    "https://example.com/Living room 3.jpg",   // ← Has spaces
    "https://example.com/บ้าน84-2-A14.jpg",    // ← Has Thai characters
    "https://example.com/good.jpg"
  ]
}

// After
"pictures": {
  "listing": [
    "https://example.com/valid.jpg",
    "https://example.com/file%20(2).jpg",                                     // ✅ Spaces encoded
    "https://example.com/Living%20room%203.jpg",                              // ✅ Spaces encoded
    "https://example.com/%E0%B8%9A%E0%B9%89%E0%B8%B2%E0%B8%9984-2-A14.jpg",  // ✅ Thai encoded
    "https://example.com/good.jpg"
  ]
}
```

**Note on projectId:** If `projectId` contains an invalid value (e.g., `"invalid"`, `"abc"`), it will be kept as-is for reference purposes, even though it will fail schema validation. This allows you to identify which listings have incorrect project IDs.

### Integration Examples

**JavaScript with transformation:**
```javascript
async function validateWithTransform(feed) {
  const response = await fetch('http://localhost:3000/validate?transform=true', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(feed)
  });
  return await response.json();
}
```

**CLI in CI/CD pipeline:**
```bash
#!/bin/bash
# Validate and transform legacy feed
bun validate-cli.js legacy-feed.json --transform --output strict-feed.json

if [ $? -eq 0 ]; then
  echo "✅ Validation passed"
  # Upload strict-feed.json to production
else
  echo "❌ Validation failed"
  exit 1
fi
```

## API Endpoints

### 1. Validate Complete Feed

**Endpoint:** `POST /validate`

Validates a complete JSON feed with multiple listings.

**Example:**
```bash
curl -X POST http://localhost:3000/validate \
  -H "Content-Type: application/json" \
  -d '{
    "updatedAt": "2024-10-29T10:00:00Z",
    "listingCount": 1,
    "listingData": [
      {
        "refNo": "CONDO-001",
        "propertyType": "CONDO",
        "postType": "FOR_RENT",
        "title": {
          "th": "คอนโดหรู",
          "en": "Luxury Condo"
        },
        "location": {
          "projectId": 12345,
          "floorArea": 45.5,
          "roomType": "ONE_BED_ROOM",
          "numberOfBed": 1,
          "numberOfBath": 1
        },
        "price": {
          "forRent": {
            "priceType": "AMOUNT",
            "price": 25000,
            "advancePayment": {
              "advancePaymentType": "MONTH",
              "month": 2
            },
            "deposit": {
              "depositType": "MONTH",
              "month": 2
            }
          }
        }
      }
    ]
  }'
```

**Success Response:**
```json
{
  "valid": true,
  "message": "Feed validation successful",
  "listingCount": 1,
  "actualListings": 1
}
```

**Error Response:**
```json
{
  "valid": false,
  "message": "Feed validation failed",
  "totalErrors": 5,
  "rootErrors": 1,
  "listingErrors": 4,
  "listingsWithErrors": 2,
  "errors": [
    {
      "path": "/updatedAt",
      "field": "updatedAt",
      "message": "Invalid format for date-time",
      "keyword": "format",
      "params": { "format": "date-time" }
    },
    {
      "path": "/listingData/0/propertyType",
      "field": "propertyType",
      "message": "Invalid value. Must be one of: CONDO, HOME, LAND, ...",
      "keyword": "enum",
      "params": { "allowedValues": ["CONDO", "HOME", ...] }
    }
  ],
  "errorsByListing": {
    "_root": [
      {
        "path": "/updatedAt",
        "message": "Invalid format for date-time"
      }
    ],
    "0": [
      {
        "path": "/propertyType",
        "message": "Invalid value. Must be one of: CONDO, HOME, LAND, ..."
      }
    ]
  }
}
```

### 2. Validate Single Listing

**Endpoint:** `POST /validate-listing`

Validates a single listing object without the feed wrapper.

**Example:**
```bash
curl -X POST http://localhost:3000/validate-listing \
  -H "Content-Type: application/json" \
  -d '{
    "refNo": "TEST-001",
    "propertyType": "CONDO",
    "postType": "FOR_RENT",
    "title": {
      "th": "ทดสอบ",
      "en": "Test"
    },
    "location": {
      "projectId": 123,
      "floorArea": 30,
      "roomType": "STUDIO",
      "numberOfBed": 0,
      "numberOfBath": 1
    },
    "price": {
      "forRent": {
        "priceType": "AMOUNT",
        "price": 15000,
        "advancePayment": {
          "advancePaymentType": "NO_ADVANCE_PAYMENT"
        },
        "deposit": {
          "depositType": "MONTH",
          "month": 1
        }
      }
    }
  }'
```

**Success Response:**
```json
{
  "valid": true,
  "message": "Listing validation successful",
  "refNo": "TEST-001"
}
```

**Error Response:**
```json
{
  "valid": false,
  "message": "Listing validation failed",
  "refNo": "TEST-001",
  "totalErrors": 3,
  "errors": [
    {
      "path": "/location",
      "field": "location",
      "message": "Missing required field: floorArea",
      "keyword": "required",
      "params": { "missingProperty": "floorArea" }
    }
  ]
}
```

### 3. Get Schema

**Endpoint:** `GET /schema`

Returns the complete JSON schema specification.

```bash
curl http://localhost:3000/schema
```

### 4. Health Check

**Endpoint:** `GET /health`

Check if the service is running.

```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "status": "ok",
  "runtime": "Bun",
  "version": "1.1.38"
}
```

## Error Response Structure

### Error Grouping

Errors are automatically grouped by listing index for easier debugging:

```json
{
  "valid": false,
  "totalErrors": 10,
  "rootErrors": 1,           // Feed-level errors (updatedAt, listingCount)
  "listingErrors": 9,         // Total errors across all listings
  "listingsWithErrors": 3,    // Number of listings with errors
  "errorsByListing": {
    "_root": [...],           // Feed-level errors
    "0": [...],               // Errors in listing[0]
    "1": [...],               // Errors in listing[1]
    "2": [...]                // Errors in listing[2]
  }
}
```

### Error Object Structure

Each error contains:

```json
{
  "path": "/listingData/0/price/forRent/price",
  "field": "price",
  "message": "Expected integer but got string",
  "keyword": "type",
  "params": { "type": "integer" },
  "data": "25000"
}
```

- **path**: JSON path to the error
- **field**: Field name (last segment of path)
- **message**: Human-readable error message
- **keyword**: JSON Schema validation keyword that failed
- **params**: Additional parameters from the validation
- **data**: The actual value that failed (omitted for 'required' errors)

## Common Validation Errors

### 1. Missing Required Fields
```json
{
  "path": "/listingData/0",
  "field": "listingData",
  "message": "Missing required field: refNo",
  "keyword": "required",
  "params": { "missingProperty": "refNo" }
}
```

### 2. Invalid Enum Values
```json
{
  "path": "/listingData/0/propertyType",
  "field": "propertyType",
  "message": "Invalid value. Must be one of: CONDO, HOME, LAND, SHOP_HOUSE, ...",
  "keyword": "enum",
  "params": { 
    "allowedValues": ["CONDO", "HOME", "LAND", "SHOP_HOUSE", ...] 
  },
  "data": "INVALID_TYPE"
}
```

### 3. Type Mismatch
```json
{
  "path": "/listingData/0/price/forSale/price",
  "field": "price",
  "message": "Expected integer but got string",
  "keyword": "type",
  "params": { "type": "integer" },
  "data": "5000000"
}
```

### 4. Invalid Format
```json
{
  "path": "/updatedAt",
  "field": "updatedAt",
  "message": "Invalid format for date-time",
  "keyword": "format",
  "params": { "format": "date-time" },
  "data": "2024-13-45"
}
```

### 5. Out of Range Values
```json
{
  "path": "/listingData/0/location/floorArea",
  "field": "floorArea",
  "message": "Value must be >= 0",
  "keyword": "minimum",
  "params": { "limit": 0 },
  "data": -10
}
```

### 6. Array Constraints
```json
{
  "path": "/listingData/0/tagName",
  "field": "tagName",
  "message": "Array must not have more than 5 items",
  "keyword": "maxItems",
  "params": { "limit": 5 },
  "data": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6"]
}
```

## Pictures Format

The `pictures` field supports two formats:

### Format 1: Simple Array (Recommended)
```json
{
  "pictures": [
    "https://example.com/pic1.jpg",
    "https://example.com/pic2.jpg"
  ]
}
```

### Format 2: Grouped by Category
```json
{
  "pictures": {
    "listing": [
      "https://example.com/room1.jpg",
      "https://example.com/room2.jpg"
    ],
    "buildingAndFacilities": [
      "https://example.com/lobby.jpg",
      "https://example.com/pool.jpg"
    ],
    "other": [
      "https://example.com/area.jpg"
    ]
  }
}
```

### Format 3: Pictures with Captions
```json
{
  "pictures": [
    "https://example.com/pic1.jpg",
    {
      "url": "https://example.com/pic2.jpg",
      "caption": "Beautiful living room"
    }
  ]
}
```

**Notes:**
- All three formats can be mixed (e.g., grouped object with caption objects inside arrays)
- Only `listing` category is also valid: `{ "listing": [...] }`
- Categories: `listing`, `buildingAndFacilities`, `other`, `notSpecific`

## Property Type Specific Validations

### CONDO
- **Required**: `projectId`, `floorArea`, `roomType`, `onFloor`, `numberOfBath`
  - `onFloor`: Accepts both string and integer (e.g., `"5"`, `2`, `"12A"`, `"G"`)
- **Optional**: `numberOfBed` (will be inferred from roomType if not provided), `roomNumber`, `roomHomeAddress`
- **Ignored**: `homeAddress`, `landArea`, `soi`, `road`, location coordinates
- System uses internal project data for location
- **Note**: `numberOfBath` must be ≥ 1

### HOME / TOWN_HOUSE / SHOP_HOUSE / TWIN_HOUSE
- **Required**: `homeAddress`, `landArea`, `floorArea`, `soi`, `road`
- **Required**: `numberOfBed`, `numberOfBath`, `numberOfFloor`
- **Required**: `provinceCode`, `districtCode`, `subDistrictCode`, `postCode`
- **Required**: `lat`, `lng`
- **Optional**: `numberOfParking`, `furnished`, `facingDirection`
- **Note**: `numberOfBed`, `numberOfBath`, `numberOfFloor` must all be ≥ 1

### LAND
- **Required**: `landArea`, `landWidth`, `landDepth`
- **Required**: Location fields (soi, road, province, etc.)
- **Not applicable**: `floorArea`, `numberOfFloor`, `amenities`

### RETAIL_SPACE / OFFICE / FACTORY
- **Required**: `floorArea`
- **Optional**: `areaWidth`, `areaDepth`
- **Required**: Location fields

### APARTMENT
- **Post Type**: Only `FOR_SALE` is allowed (FOR_RENT is not valid for APARTMENT)
- **Required**: `landArea`, `numberOfFloor`, `location`
- **Location**: Must have either `projectId` OR both `lat` and `lng`
- **Not applicable**: `amenities`
- **Note**: `numberOfFloor` must be ≥ 1

## Price Validations

### FOR_SALE
```json
{
  "forSale": {
    "priceType": "AMOUNT",  // or "CALL"
    "price": 5000000        // Required when priceType is "AMOUNT". Must be >= 1 (minimum 1 baht)
  }
}
```

### FOR_RENT
```json
{
  "forRent": {
    "priceType": "AMOUNT",  // or "CALL"
    "price": 25000,         // Monthly rent, required when priceType is "AMOUNT". Must be >= 1 (minimum 1 baht)
    "advancePayment": {
      "advancePaymentType": "MONTH",  // "AMOUNT", "MONTH", "NO_ADVANCE_PAYMENT", "CALL"
      "month": 2,                     // Required when type is "MONTH". Can be 0 (no advance payment)
      // "amount": 50000              // Required when type is "AMOUNT". Can be 0 (no advance payment)
    },
    "deposit": {
      "depositType": "MONTH",         // "AMOUNT", "MONTH", "NO_DEPOSIT_PAYMENT", "CALL"
      "month": 2,                     // Required when type is "MONTH". Can be 0 (no deposit)
      // "amount": 50000              // Required when type is "AMOUNT". Can be 0 (no deposit)
    }
  }
}
```

**Notes:**
- `price` (sale/rent): Minimum 1 baht (free properties not allowed)
- `deposit` and `advancePayment`: Can be 0 (means none required)
- `numberOfParking`: Can be 0 (means no parking available)

## Area and Dimension Validations

All physical dimensions must be **greater than 0** (cannot be 0 or negative):

**Area Fields:**
- `floorArea`: Must be > 0 (minimum 0.01 sqm)
- `landArea`: Must be > 0 (minimum 0.01 sq wa)

**Dimension Fields:**
- `areaWidth`, `areaDepth`: Must be > 0 (minimum 0.01 m)
- `landWidth`, `landDepth`: Must be > 0 (minimum 0.01 m)

**Count Fields:**
- `numberOfBed`: Must be >= 1 (if provided)
- `numberOfBath`: Must be >= 1
- `numberOfFloor`: Must be >= 1
- `numberOfParking`: Can be >= 0 (0 means no parking)

## Integration Examples

### JavaScript/TypeScript with Fetch
```javascript
async function validateFeed(feed) {
  try {
    const response = await fetch('http://localhost:3000/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feed)
    });
    
    const result = await response.json();
    
    if (!result.valid) {
      console.error('Validation failed:', result.errors);
      // Handle errors by listing
      Object.entries(result.errorsByListing).forEach(([listingIndex, errors]) => {
        if (listingIndex === '_root') {
          console.error('Feed-level errors:', errors);
        } else {
          console.error(`Errors in listing ${listingIndex}:`, errors);
        }
      });
    }
    
    return result;
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
}

// Usage
const feed = {
  updatedAt: new Date().toISOString(),
  listingCount: 1,
  listingData: [/* your listings */]
};

const result = await validateFeed(feed);
```

### Bun with Native Fetch
```javascript
const feed = await Bun.file('feed.json').json();

const response = await fetch('http://localhost:3000/validate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(feed)
});

const result = await response.json();

if (!result.valid) {
  console.error(`Found ${result.totalErrors} errors`);
  console.table(result.errors);
}
```

### PHP
```php
<?php
$feed = json_decode(file_get_contents('feed.json'), true);

$ch = curl_init('http://localhost:3000/validate');
curl_setopt_array($ch, [
    CURLOPT_POSTFIELDS => json_encode($feed),
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_RETURNTRANSFER => true
]);

$response = curl_exec($ch);
$result = json_decode($response, true);
curl_close($ch);

if (!$result['valid']) {
    echo "Validation failed with {$result['totalErrors']} errors:\n";
    foreach ($result['errorsByListing'] as $listingIndex => $errors) {
        if ($listingIndex === '_root') {
            echo "Feed-level errors:\n";
        } else {
            echo "Listing {$listingIndex} errors:\n";
        }
        foreach ($errors as $error) {
            echo "  - {$error['path']}: {$error['message']}\n";
        }
    }
}
?>
```

### Python
```python
import requests
import json

with open('feed.json') as f:
    feed = json.load(f)

response = requests.post(
    'http://localhost:3000/validate',
    json=feed
)

result = response.json()

if not result['valid']:
    print(f"Validation failed with {result['totalErrors']} errors")
    
    for listing_index, errors in result['errorsByListing'].items():
        if listing_index == '_root':
            print("Feed-level errors:")
        else:
            print(f"Listing {listing_index} errors:")
        
        for error in errors:
            print(f"  - {error['path']}: {error['message']}")
```

### cURL Examples

**Validate from file:**
```bash
curl -X POST http://localhost:3000/validate \
  -H "Content-Type: application/json" \
  -d @feed.json
```

**Validate with pretty output:**
```bash
curl -X POST http://localhost:3000/validate \
  -H "Content-Type: application/json" \
  -d @feed.json | jq '.'
```

**Check only if valid (exit code):**
```bash
curl -s -X POST http://localhost:3000/validate \
  -H "Content-Type: application/json" \
  -d @feed.json | jq -e '.valid' > /dev/null
```

## Deployment

### Development
```bash
bun run dev  # Hot reload enabled
```

### Production

#### Simple
```bash
bun run start
```

#### With PM2
```bash
npm install -g pm2
pm2 start "bun run start" --name propertyhub-validator
pm2 save
pm2 startup
```

#### Docker
```dockerfile
FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

COPY . .

EXPOSE 3000

CMD ["bun", "run", "start"]
```

Build and run:
```bash
docker build -t propertyhub-validator .
docker run -p 3000:3000 propertyhub-validator
```

#### Docker Compose
```yaml
version: '3.8'
services:
  validator:
    build: .
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
    restart: unless-stopped
```

### Environment Variables

- `PORT` - Server port (default: 3000)

## Performance

Bun's native HTTP server and JSON parsing provide excellent performance:

- **Startup time**: ~10ms (vs ~50ms for Node.js)
- **Request latency**: ~1-2ms for simple validations
- **Memory usage**: ~30MB baseline
- **Throughput**: Can handle thousands of validations per second

## Testing

Create test files and validate them:

```bash
# Valid feed
echo '{
  "updatedAt": "2024-10-29T10:00:00Z",
  "listingCount": 0,
  "listingData": []
}' | curl -X POST http://localhost:3000/validate \
  -H "Content-Type: application/json" \
  -d @-

# Invalid feed
echo '{
  "updatedAt": "invalid-date",
  "listingCount": 1,
  "listingData": []
}' | curl -X POST http://localhost:3000/validate \
  -H "Content-Type: application/json" \
  -d @-
```

## Troubleshooting

### Port already in use
```bash
# Change port
PORT=3001 bun run start
```

### Schema not found
Make sure `propertyhub-feed-schema.json` is in the same directory as `server.js`

### JSON parsing errors
Check that your JSON is valid:
```bash
cat feed.json | jq '.'
```

## API Response Times

Typical response times (on modern hardware):

- Valid feed (1 listing): ~1-2ms
- Valid feed (100 listings): ~5-10ms
- Invalid feed with errors: ~2-5ms
- Schema endpoint: ~1ms

## Support & Documentation

- **Schema Documentation**: `GET /schema`
- **API Root**: `GET /` for endpoint list
- **Health Check**: `GET /health`

## License

MIT

## Contributing

Issues and pull requests welcome!
