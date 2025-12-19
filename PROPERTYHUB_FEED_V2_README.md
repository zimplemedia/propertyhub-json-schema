# Propertyhub JSON Feed Specification v2.2

## Overview

This JSON specification provides a simple channel for authorized partners to provide property listing information to PropertyHub. Version 2.2 follows JSON Schema Draft 2020-12 specification and includes improved validation rules and clearer field requirements per property type.

---

## Field Definitions

### Root Fields

| Field            | Description                                                                                                | Required |
| ---------------- | ---------------------------------------------------------------------------------------------------------- | -------- |
| **updatedAt**    | Update date and time of the list in ISO 8601 format (UTC timezone).<br>**Type:** String in ISO 8601 format | Yes      |
| **listingCount** | Number of elements in listingData field.<br>**Type:** Integer (minimum: 0)                                 | Yes      |
| **listingData**  | Array of listing data.<br>**Type:** Array                                                                  | Yes      |

---

### Listing Data Fields

**Title and Detail Format:** Both `title` and `detail` are objects with language-specific properties:

```json
"title": {
  "th": "คอนโดหรู ใจกลางเมือง",
  "en": "Luxury Condo in City Center"
}
```

You can provide just `th`, just `en`, or both. At least one language is required for `title`.

---

#### Basic Information

| Field | Description | Required |
| --- | --- | --- |
| **refNo** | Unique Reference No. for this listing. Must be unique across all listings. If a property has both FOR_SALE and FOR_RENT, create 2 separate listings with different refNos (e.g., 1234-S for sale, 1234-R for rent).<br>**Type:** String | Yes |
| **propertyType** | Type of property.<br>**Allowed values:** `CONDO`, `HOME`, `LAND`, `SHOP_HOUSE`, `TOWN_HOUSE`, `APARTMENT`, `FACTORY`, `OFFICE`, `RETAIL_SPACE`, `HOME_OFFICE`, `TWIN_HOUSE`<br>**Type:** Enum (String)<br><br>**Notes:**<br>• `HOME` - บ้านเดี่ยว (detached house, single house)<br>• `TOWN_HOUSE` - ทาวน์เฮ้าส์ ทาวน์โฮม (townhouse)<br>• `SHOP_HOUSE` - อาคารพานิชย์ (shophouse)<br>• `TWIN_HOUSE` - บ้านแฝด (semi-detached house)<br>• `HOME_OFFICE` - โฮมออฟฟิศ (home office, not office space in office building)<br>• `OFFICE` - เฉพาะพื้นที่ office ในตึกสำนักงาน (only for office space in office building)<br>• `RETAIL_SPACE` - พื้นที่ขายของ (retail space)<br>• `LAND` - ที่ดิน (land plot)<br>• `APARTMENT` - อพาร์ทเมนต์/อาคารทั้งหลัง (apartment building, guest house, small/commercial hotel, resort — entire building only). Only `FOR_SALE` is supported; Serviced apartment rooms for rent are not supported.<br>• `FACTORY` - โรงงาน (factory) | Yes |
| **postType** | Type of listing.<br>**Allowed values:** `FOR_RENT`, `FOR_SALE`. APARTMENT listings must be `FOR_SALE`.<br>**Type:** Enum (String) | Yes |
| **status** | **DEPRECATED** Status of the listing. Listings missing from the feed are considered removed.<br>**Allowed values:** `ACTIVE`, `DELETED`<br>**Type:** Enum (String) | No |
| **title** | Title of the listing in multiple languages. Either th or en must be provided.<br>**Type:** Object with `th` and/or `en` properties (both strings) | Yes (either th or en) |
| **detail** | Detail of the listing in multiple languages.<br>**Type:** Object with optional `th` and/or `en` properties (both strings) | No |

#### Property Type Specific Requirements

**For CONDO:**

- Required: `roomType`, `onFloor`, `floorArea`, `numberOfBath`
- Location must include: `projectId`
- Note: `numberOfBed` is optional (will be inferred from roomType if not provided)
- **Important:** Do NOT send `landArea` or `numberOfFloor` for CONDO properties. These fields are not applicable and will be ignored.

**For HOME, TOWN_HOUSE, SHOP_HOUSE, HOME_OFFICE, TWIN_HOUSE:**

- Required: `landArea`, `numberOfBed`, `numberOfBath`, `numberOfFloor`, `location`
- Location must include: `projectId` OR both `lat` and `lng`

**For LAND:**

- Required: `landArea`, `location`
- Location must include: `projectId` OR both `lat` and `lng`
- **Important:** Do NOT send `floorArea` or `numberOfFloor` for LAND properties. These fields are not applicable and will be ignored.

**For OFFICE, RETAIL_SPACE:**

- Required: `floorArea`, `location`
- Location must include: `projectId` OR both `lat` and `lng`

**For FACTORY:**

- Required: `landArea`, `floorArea`, `location`
- Location must include: `projectId` OR both `lat` and `lng`

**For APARTMENT:**

- Required: `landArea`, `numberOfFloor`, `numberOfRoom`, `location`
- Post type must be `FOR_SALE`
- Location must include: `projectId` OR both `lat` and `lng`
- Note: Guest house, small/commercial hotel, and resort (entire building) should be sent as `APARTMENT` with `FOR_SALE`.
- Not supported: Serviced apartment room/unit for rent is not supported in this version.

---

#### Location Information

| Field | Description | Required |
| --- | --- | --- |
| **projectId** | Project ID according to PropertyHub Project ID (preferred option). **Required for CONDO. Must be a positive integer (minimum: 1, 0 is not valid).**<br>**Type:** Integer | Conditional |
| **projectName** | Project name of the property.<br>**Type:** String | No |
| **homeAddress** | Home address of the property (not applicable for CONDO or LAND; ignored if provided).<br>**Type:** String | No |
| **soi** | Alley/street name (e.g., Sukhumvit 24) - ignored for CONDO.<br>**Type:** String | No |
| **road** | Road name - ignored for CONDO.<br>**Type:** String | No |
| **provinceCode** | **DEPRECATED** Derived from lat/lng (ignored for CONDO).<br>**Type:** String | No |
| **districtCode** | **DEPRECATED** Derived from lat/lng (ignored for CONDO).<br>**Type:** Integer | No |
| **subDistrictCode** | **DEPRECATED** Subdistrict code derived from lat/lng (ignored for CONDO).<br>**Type:** Integer | No |
| **postCode** | Post code - ignored for CONDO.<br>**Type:** Integer | No |
| **lat** | Latitude of the property. Required for non-CONDO if projectId is not provided. Ignored for CONDO.<br>**Type:** Number | Conditional |
| **lng** | Longitude of the property. Required for non-CONDO if projectId is not provided. Ignored for CONDO.<br>**Type:** Number | Conditional |

---

#### Property Dimensions

| Field | Description | Required |
| --- | --- | --- |
| **floorArea** | Floor area in square meters. For CONDO: room size. For others: usable area. Do NOT send for LAND.<br>**Type:** Number (must be greater than 0) | Conditional |
| **landArea** | Land size in square wa (1 sq wa = 4 sq meters). Required for HOME, TOWN_HOUSE, SHOP_HOUSE, HOME_OFFICE, TWIN_HOUSE, LAND, FACTORY, APARTMENT. Do NOT send for CONDO.<br>**Type:** Number (must be greater than 0) | Conditional |
| **areaWidth** | Width of the usable area in meters (only applicable to RETAIL_SPACE, OFFICE, FACTORY; ignored for other types).<br>**Type:** Number (must be greater than 0) | No |
| **areaDepth** | Depth of the usable area in meters (only applicable to RETAIL_SPACE, OFFICE, FACTORY; ignored for other types).<br>**Type:** Number (must be greater than 0) | No |
| **landWidth** | Width of the land plot in meters (only applicable to LAND; ignored for other types).<br>**Type:** Number (must be greater than 0) | No |
| **landDepth** | Depth of the land plot in meters (only applicable to LAND; ignored for other types).<br>**Type:** Number (must be greater than 0) | No |

---

#### Room & Unit Details

| Field | Description | Required |
| --- | --- | --- |
| **roomType** | Unit type of CONDO room.<br>**Allowed values:** `STUDIO`, `ONE_BED_ROOM`, `TWO_BED_ROOM`, `THREE_BED_ROOM`, `FOUR_BED_ROOM`, `FIVE_BED_ROOM`, `SIX_BED_ROOM`, `MOFF`, `LOFT`, `DUPLEX_ONE_BED`, `DUPLEX_TWO_BED`, `DUPLEX_THREE_BED`, `DUPLEX_FOUR_BED`, `DUPLEX_FIVE_BED`, `PENTHOUSE`, `VILLA`, `ROOM_TYPE_OTHER`<br>**Type:** Enum (String)<br><br>**Note:** Only applicable to CONDO; ignored for other types. | Yes (for CONDO) |
| **onFloor** | Floor number that the listing is on (only applicable to CONDO; ignored for other types). Examples: '5', 2, '12A', 'G', 'B1'<br>**Type:** String or Integer | Yes (for CONDO) |
| **roomNumber** | Building room number of CONDO room (e.g., '2320', '12A10') — only applicable to CONDO; ignored for other types.<br>**Type:** String | No |
| **roomHomeAddress** | Home address of CONDO room (e.g., '5/333') — only applicable to CONDO; ignored for other types.<br>**Type:** String | No |
| **numberOfBed** | Number of bedrooms. Required for HOME, SHOP_HOUSE, TOWN_HOUSE, HOME_OFFICE, TWIN_HOUSE. Optional for CONDO (will be inferred from roomType if not provided).<br>**Type:** Integer (minimum: 1) | Conditional |
| **numberOfBath** | Number of bathrooms. Required for CONDO, HOME, SHOP_HOUSE, TOWN_HOUSE, HOME_OFFICE, TWIN_HOUSE.<br>**Type:** Integer (minimum: 1) | Conditional |
| **numberOfFloor** | Number of floors in the building. Required for HOME, SHOP_HOUSE, TOWN_HOUSE, HOME_OFFICE, TWIN_HOUSE, APARTMENT. Do NOT send for CONDO or LAND.<br>**Type:** Number (minimum: 1, multiple of 0.5). Example: 1, 1.5, 2, 2.5 (2.4 is invalid).<br><br>หมายเหตุ: จำนวนชั้นต้องเป็นจำนวนเต็ม หรือลงท้ายด้วย .5 เท่านั้นเช่น 2 ชั้น ครึ่ง (2.5) | Conditional |
| **numberOfParking** | Number of parking spaces available. Optional for HOME, SHOP_HOUSE, TOWN_HOUSE, HOME_OFFICE types.<br>**Type:** Integer (minimum: 0) | No |

---

#### Apartment Building/Hotel Details

| Field | Description | Required |
| --- | --- | --- |
| **numberOfRoom** | Number of rooms/units in the building (only applicable to APARTMENT and only when `postType` is `FOR_SALE`; ignored otherwise).<br>**Type:** Integer (minimum: 1) | Yes (for APARTMENT) |
| **avgRoomArea** | Average unit size in the building in square meters (only applicable to APARTMENT and only when `postType` is `FOR_SALE`; ignored otherwise).<br>**Type:** Number (must be greater than 0) | No |

---

#### Property Attributes

| Field | Description | Required |
| --- | --- | --- |
| **facingDirection** | Direction the property or room is facing.<br>**Allowed values:** `EAST`, `NORTHEAST`, `SOUTHEAST`, `NORTH`, `SOUTH`, `NORTHWEST`, `SOUTHWEST`, `WEST`<br>**Type:** Enum (String) | No |
| **furnished** | Furnishing condition (only applicable to HOME, SHOP_HOUSE, TOWN_HOUSE, HOME_OFFICE; ignored for other types).<br>**Allowed values:** `FULLY`, `PARTIAL`, `UNFURNISHED`<br>**Type:** Enum (String) | No |
| **tenure** | Tenure of the property (only applicable for FOR_SALE CONDO; ignored for all FOR_RENT listings and other property types).<br>**Allowed values:** `FREEHOLD`, `LEASEHOLD`<br>**Type:** Enum (String) | No |

---

### Price Information

| Field | Description | Required |
| --- | --- | --- |
| **price** | Price object containing pricing information.<br>**Type:** Object<br><br>If `postType` is `FOR_RENT`, must include "forRent".<br>If `postType` is `FOR_SALE`, must include "forSale". | Yes |

**Important:** Price values must be positive integers (minimum: 1). A price of 0 is not valid and will cause validation to fail.

#### For Sale Price

| Field         | Description                                                                                                  | Required                        |
| ------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------- |
| **forSale**   | Detail about FOR_SALE price.<br>**Type:** Object                                                             | Yes (when postType is FOR_SALE) |
| **priceType** | Price type.<br>**Allowed values:** `CALL`, `AMOUNT`<br>**Type:** Enum (String)                               | Yes                             |
| **price**     | Selling price in THB (required when priceType is AMOUNT). Must be integer.<br>**Type:** Integer (minimum: 1) | Yes (when priceType is AMOUNT)  |

**Example:**

```json
"price": {
  "forSale": {
    "priceType": "AMOUNT",
    "price": 5000000
  }
}
```

#### For Rent Price

| Field              | Description                                                                                                         | Required                        |
| ------------------ | ------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| **forRent**        | Detail about FOR_RENT price.<br>**Type:** Object                                                                    | Yes (when postType is FOR_RENT) |
| **priceType**      | Price type.<br>**Allowed values:** `CALL`, `AMOUNT`<br>**Type:** Enum (String)                                      | Yes                             |
| **price**          | Monthly rental price in THB (required when priceType is AMOUNT). Must be integer.<br>**Type:** Integer (minimum: 1) | Yes (when priceType is AMOUNT)  |
| **advancePayment** | Advance payment information.<br>**Type:** Object                                                                    | No                              |
| **deposit**        | Deposit information.<br>**Type:** Object                                                                            | No                              |

**Example:**

```json
"price": {
  "forRent": {
    "priceType": "AMOUNT",
    "price": 30000,
    "advancePayment": {
      "advancePaymentType": "MONTH",
      "month": 1
    },
    "deposit": {
      "depositType": "AMOUNT",
      "amount": 10000
    }
  }
}
```

#### Advance Payment

| Field                  | Description                                                                                                                | Required                  |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| **advancePaymentType** | Type of advance payment.<br>**Allowed values:** `AMOUNT`, `MONTH`, `NO_ADVANCE_PAYMENT`, `CALL`<br>**Type:** Enum (String) | Yes                       |
| **amount**             | Amount of advance payment in THB (required when advancePaymentType is AMOUNT).<br>**Type:** Integer (minimum: 0)           | Yes (when type is AMOUNT) |
| **month**              | Number of months for advance payment (required when advancePaymentType is MONTH).<br>**Type:** Integer (minimum: 0)        | Yes (when type is MONTH)  |

#### Deposit

| Field           | Description                                                                                                                | Required                  |
| --------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| **depositType** | Type of deposit payment.<br>**Allowed values:** `AMOUNT`, `MONTH`, `NO_DEPOSIT_PAYMENT`, `CALL`<br>**Type:** Enum (String) | Yes                       |
| **amount**      | Amount of deposit in THB (required when depositType is AMOUNT).<br>**Type:** Integer (minimum: 0)                          | Yes (when type is AMOUNT) |
| **month**       | Number of months for deposit (required when depositType is MONTH).<br>**Type:** Integer (minimum: 0)                       | Yes (when type is MONTH)  |

---

### Amenities

Different property types support different amenities. Note: Amenities that are not applicable to the property type may be accepted by the schema but ignored by PropertyHub.

#### For CONDO Property Type

```json
"amenities": {
  "allowPet": true,
  "hasAirCondition": true,
  "hasRefrigerator": true,
  "hasTV": true,
  "hasWaterHeater": true,
  "hasDigitalDoorLock": true,
  "hasHotTub": true,
  "hasKitchenHood": true,
  "hasKitchenStove": true,
  "hasWasher": true,
  "hasMicrowave": true,
  "hasFurniture": true,
  "hasInternet": true
}
```

**CONDO-specific amenities:**

- `allowPet` - Allow pets (boolean)
- `hasAirCondition` - Has air conditioning (boolean)
- `hasKitchenStove` - Has kitchen stove (boolean)
- `hasMicrowave` - Has microwave (boolean)

#### For Non-CONDO Property Types

```json
"amenities": {
  "hasRefrigerator": true,
  "hasTV": true,
  "hasWaterHeater": true,
  "hasDigitalDoorLock": true,
  "hasHotTub": true,
  "hasKitchenHood": true,
  "hasWasher": true,
  "hasFurniture": true,
  "hasInternet": true,
  "hasPhone": true,
  "hasLift": true,
  "hasThaiKitchen": true,
  "hasPantryKitchen": true,
  "hasPersonalPool": true,
  "hasEvCharger": true,
  "hasBuildInCloset": true,
  "hasStorageRoom": true
}
```

**Non-CONDO specific amenities:**

- `hasPhone` - Has phone line (boolean)
- `hasLift` - Has lift/elevator (boolean)
- `hasThaiKitchen` - Has Thai kitchen (boolean)
- `hasPantryKitchen` - Has pantry kitchen (boolean)
- `hasPersonalPool` - Has personal pool (boolean)
- `hasEvCharger` - Has EV charger (boolean)
- `hasBuildInCloset` - Has built-in closet (boolean)
- `hasStorageRoom` - Has storage room (boolean)

---

### Pictures

Pictures can be provided in 3 different formats.

#### Format 1: Simple Array with URLs Only

```json
"pictures": [
  "https://example.com/image1.jpg",
  "https://example.com/image2.jpg",
  "https://example.com/image3.jpg"
]
```

#### Format 2: Simple Array with Objects (URLs + Captions)

```json
"pictures": [
  {
    "url": "https://example.com/image1.jpg",
    "caption": "Living room"
  },
  {
    "url": "https://example.com/image2.jpg",
    "caption": "Master bedroom"
  },
  {
    "url": "https://example.com/image3.jpg",
    "caption": "Kitchen"
  }
]
```

#### Format 3: Grouped by Category

```json
"pictures": {
  "listing": [
    {
      "url": "https://example.com/room1.jpg",
      "caption": "Master bedroom"
    },
    {
      "url": "https://example.com/room2.jpg",
      "caption": "Living room"
    }
  ],
  "buildingAndFacilities": [
    {
      "url": "https://example.com/pool.jpg",
      "caption": "Swimming pool"
    },
    {
      "url": "https://example.com/lobby.jpg",
      "caption": "Lobby"
    }
  ],
  "other": [
    {
      "url": "https://example.com/area.jpg",
      "caption": "Surrounding area"
    }
  ],
  "notSpecific": []
}
```

**Picture Categories** (for Format 3 only):

- `listing` - Pictures of the property
- `buildingAndFacilities` - Pictures of condo building, lobby, playground and facilities
- `other` - Other pictures (e.g., 3D render, surrounding area, neighborhood)
- `notSpecific` - Uncategorized pictures

---

### Contact & Additional Information

| Field                  | Description                                                                                                                             | Required |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| **contactInformation** | **ONLY applicable for Agency package.** Ignored for other packages.<br>**Type:** Object                                                 | No       |
| **tagName**            | Specific tags associated with this listing (maximum 5). Example: `["hot", "premium", "new"]`<br>**Type:** Array of String (max 5 items) | No       |
| **remark**             | Internal memo or remark for the listing (not displayed on listing page).<br>**Type:** String                                            | No       |

#### Contact Information (Agency Package Only)

```json
"contactInformation": {
  "name": "Agent Name",
  "lineId": "@agent-line-id",
  "email": "agent@example.com",
  "whatsApp": "+66812345678",
  "agentPhone": ["0812345678", "0887654321"]
}
```

| Field          | Description                                      |
| -------------- | ------------------------------------------------ |
| **name**       | Agent name (String)                              |
| **lineId**     | Line ID (String)                                 |
| **email**      | Email address (String, email format)             |
| **whatsApp**   | WhatsApp number (String)                         |
| **agentPhone** | Agent phone numbers (Array of String, maximum 2) |

---

## Complete Example

### CONDO FOR_RENT Example

```json
{
  "updatedAt": "2024-01-15T10:30:00Z",
  "listingCount": 1,
  "listingData": [
    {
      "refNo": "CONDO-001-R",
      "propertyType": "CONDO",
      "postType": "FOR_RENT",
      "title": {
        "th": "คอนโดหรู ใจกลางเมือง",
        "en": "Luxury Condo in City Center"
      },
      "detail": {
        "th": "คอนโดพร้อมเฟอร์นิเจอร์ครบ วิวสวย",
        "en": "Fully furnished condo with beautiful view"
      },
      "roomType": "TWO_BED_ROOM",
      "onFloor": 15,
      "roomNumber": "1501",
      "floorArea": 75.5,
      "numberOfBed": 2,
      "numberOfBath": 2,
      "facingDirection": "SOUTH",
      "location": {
        "projectId": 12345,
        "projectName": "The Luxury Residence"
      },
      "price": {
        "forRent": {
          "priceType": "AMOUNT",
          "price": 35000,
          "advancePayment": {
            "advancePaymentType": "MONTH",
            "month": 2
          },
          "deposit": {
            "depositType": "MONTH",
            "month": 2
          }
        }
      },
      "amenities": {
        "allowPet": false,
        "hasAirCondition": true,
        "hasRefrigerator": true,
        "hasTV": true,
        "hasWaterHeater": true,
        "hasWasher": true,
        "hasFurniture": true,
        "hasInternet": true
      },
      "pictures": {
        "listing": [
          {
            "url": "https://example.com/living-room.jpg",
            "caption": "Living room"
          },
          {
            "url": "https://example.com/bedroom.jpg",
            "caption": "Master bedroom"
          }
        ],
        "buildingAndFacilities": [
          {
            "url": "https://example.com/pool.jpg",
            "caption": "Swimming pool"
          }
        ]
      },
      "tagName": ["hot", "furnished"]
    }
  ]
}
```

### HOME FOR_SALE Example

```json
{
  "updatedAt": "2024-01-15T10:30:00Z",
  "listingCount": 1,
  "listingData": [
    {
      "refNo": "HOME-001-S",
      "propertyType": "HOME",
      "postType": "FOR_SALE",
      "title": {
        "th": "บ้านเดี่ยวสวย พร้อมสวน",
        "en": "Beautiful Single House with Garden"
      },
      "detail": {
        "th": "บ้านสวย พร้อมอยู่ สวนหน้าบ้าน",
        "en": "Ready to move in, garden in front"
      },
      "landArea": 100,
      "floorArea": 250,
      "numberOfBed": 4,
      "numberOfBath": 3,
      "numberOfFloor": 2,
      "numberOfParking": 2,
      "furnished": "PARTIAL",
      "facingDirection": "EAST",
      "location": {
        "projectId": 54321,
        "projectName": "Green Valley Village",
        "homeAddress": "123/45",
        "soi": "Sukhumvit 101",
        "road": "Sukhumvit",
        "postCode": 10260,
        "lat": 13.7563,
        "lng": 100.5018
      },
      "price": {
        "forSale": {
          "priceType": "AMOUNT",
          "price": 12000000
        }
      },
      "amenities": {
        "hasLift": false,
        "hasFurniture": true,
        "hasRefrigerator": true,
        "hasInternet": true,
        "hasThaiKitchen": true,
        "hasPantryKitchen": true,
        "hasPersonalPool": true,
        "hasEvCharger": true
      },
      "pictures": ["https://example.com/house-front.jpg", "https://example.com/house-garden.jpg", "https://example.com/house-interior.jpg"],
      "contactInformation": {
        "name": "John Doe",
        "lineId": "@johndoe",
        "email": "john@example.com",
        "agentPhone": ["0812345678"]
      }
    }
  ]
}
```

---

## Validation

- Schema file: `propertyhub-feed-schema-v2.json`
- Validate with ajv-cli:
  - `npm i -g ajv-cli ajv-formats`
  - `ajv validate -s propertyhub-feed-schema-v2.json -d your_feed.json`

Notes:

- `listingCount` should equal the length of `listingData` (not enforced by schema).
- Use ISO 8601 (UTC) for date/time.
- Prices must be integers.
- Fields marked "ignored" are accepted by the schema but not used by PropertyHub, and may be dropped internally.

## Key Changes from v1.10

1. **Stricter Validation**: Property type specific requirements are now enforced through JSON Schema conditionals
2. **Cleaner Structure**: Uses JSON Schema 2020-12 draft with $defs for reusable definitions
3. **Flexible Pictures Format**: Supports both simple array and grouped object formats
4. **Better Documentation**: Inline descriptions in schema for all fields
5. **Deprecated Fields**: Clearly marked deprecated fields (status, provinceCode, districtCode, subDistrictCode)
6. **Conditional Requirements**: Smart validation based on property type and post type combinations
7. **Title Language Requirements**: Must provide either Thai or English title (or both)
8. **Field Restrictions**: Explicit guidance on fields that should NOT be sent for specific property types (e.g., no `landArea` for CONDO, no `floorArea` for LAND)

---

## Notes

- All boolean values should be `true` or `false` (lowercase)
- All date/time values should be in ISO 8601 format (UTC timezone)
- Prices must be integers (no decimal points)
- Empty strings should be represented as `""`
- Missing or null values can be omitted from the JSON
- Property type determines which fields are required and which are ignored
- CONDO properties must always include projectId
- Non-CONDO properties can use either projectId OR lat/lng for location
