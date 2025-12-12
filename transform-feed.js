/**
 * Transform relaxed feed data to strict schema-compliant format
 *
 * This function normalizes common variations in feed data:
 * - Converts string numbers to actual numbers (e.g., "12.5" -> 12.5)
 * - Treats empty strings ("", "-") as null/undefined
 * - Ensures integer fields are integers
 * - Cleans up deprecated or invalid data
 */

function toNumber(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    // Treat empty, "-", or invalid as null
    if (trimmed === '' || trimmed === '-') {
      return null;
    }

    // Remove commas (e.g., "1,000.50" -> "1000.50")
    const cleaned = trimmed.replace(/,/g, '');

    // Try to parse as number
    const parsed = parseFloat(cleaned);

    // Check if it's a valid number
    if (!isNaN(parsed) && isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function toInteger(value) {
  const num = toNumber(value);

  if (num === null) {
    return null;
  }

  return Math.floor(num);
}

function cleanString(value) {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    // Treat empty or "-" as undefined (field will be removed)
    if (trimmed === '' || trimmed === '-') {
      return undefined;
    }

    return trimmed;
  }

  // Convert non-string to string (e.g., numbers like 919 for soi, 501 for homeAddress)
  if (typeof value === 'number') {
    return String(value);
  }

  return String(value);
}

function toBoolean(value) {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim().toLowerCase();

    // Treat empty or "-" as undefined
    if (trimmed === '' || trimmed === '-') {
      return undefined;
    }

    // Convert string "true"/"false" to boolean
    if (trimmed === 'true') {
      return true;
    }
    if (trimmed === 'false') {
      return false;
    }
  }

  // For numbers: 0 = false, non-zero = true
  if (typeof value === 'number') {
    return value !== 0;
  }

  return undefined;
}

function transformLocation(location) {
  if (!location) return location;

  const transformed = { ...location };

  // Number fields
  if (transformed.lat !== undefined) {
    const lat = toNumber(transformed.lat);
    if (lat !== null) {
      transformed.lat = lat;
    } else {
      delete transformed.lat;
    }
  }

  if (transformed.lng !== undefined) {
    const lng = toNumber(transformed.lng);
    if (lng !== null) {
      transformed.lng = lng;
    } else {
      delete transformed.lng;
    }
  }

  // Special handling for projectId:
  // - If null or empty string, delete it (so validation doesn't fail on type)
  // - Convert valid values to integer
  // - Delete 0 or negative values (invalid projectId)
  // This allows early validation to catch CONDO listings without valid projectId
  if (transformed.projectId === null || transformed.projectId === '') {
    delete transformed.projectId;
  } else if (transformed.projectId !== undefined) {
    const value = toInteger(transformed.projectId);
    if (value !== null && value > 0) {
      transformed.projectId = value;
    } else {
      delete transformed.projectId;
    }
  }

  // Other integer fields - remove if invalid
  const integerFields = ['externalProjectId', 'districtCode', 'subDistrictCode', 'postCode'];
  integerFields.forEach((field) => {
    if (transformed[field] !== undefined) {
      const value = toInteger(transformed[field]);
      if (value !== null) {
        transformed[field] = value;
      } else {
        delete transformed[field];
      }
    }
  });

  // String fields
  const stringFields = ['projectName', 'roomNumber', 'roomHomeAddress', 'homeAddress', 'soi', 'road', 'provinceCode'];
  stringFields.forEach((field) => {
    if (transformed[field] !== undefined) {
      const value = cleanString(transformed[field]);
      if (value !== undefined) {
        transformed[field] = value;
      } else {
        delete transformed[field];
      }
    }
  });

  return transformed;
}

function transformPrice(price) {
  if (!price) return price;

  const transformed = { ...price };

  // Transform forSale
  if (transformed.forSale) {
    transformed.forSale = { ...transformed.forSale };

    if (transformed.forSale.priceType) {
      transformed.forSale.priceType = cleanString(transformed.forSale.priceType) || 'CALL';
    }

    if (transformed.forSale.price !== undefined) {
      const value = toInteger(transformed.forSale.price);
      if (value !== null) {
        transformed.forSale.price = value;
      } else {
        delete transformed.forSale.price;
      }
    }
  }

  // Transform forRent
  if (transformed.forRent) {
    transformed.forRent = { ...transformed.forRent };

    if (transformed.forRent.priceType) {
      transformed.forRent.priceType = cleanString(transformed.forRent.priceType) || 'CALL';
    }

    if (transformed.forRent.price !== undefined) {
      const value = toInteger(transformed.forRent.price);
      if (value !== null) {
        transformed.forRent.price = value;
      } else {
        delete transformed.forRent.price;
      }
    }

    // Transform deposit
    if (transformed.forRent.deposit) {
      transformed.forRent.deposit = { ...transformed.forRent.deposit };

      // Handle old field name: deposit.type -> deposit.depositType
      if (transformed.forRent.deposit.type && !transformed.forRent.deposit.depositType) {
        transformed.forRent.deposit.depositType = transformed.forRent.deposit.type;
        delete transformed.forRent.deposit.type;
      }

      if (transformed.forRent.deposit.depositType) {
        transformed.forRent.deposit.depositType = cleanString(transformed.forRent.deposit.depositType) || 'CALL';
      }

      if (transformed.forRent.deposit.amount !== undefined) {
        const value = toInteger(transformed.forRent.deposit.amount);
        if (value !== null) {
          transformed.forRent.deposit.amount = value;
        } else {
          delete transformed.forRent.deposit.amount;
        }
      }

      if (transformed.forRent.deposit.month !== undefined) {
        const value = toInteger(transformed.forRent.deposit.month);
        if (value !== null) {
          transformed.forRent.deposit.month = value;
        } else {
          delete transformed.forRent.deposit.month;
        }
      }
    }

    // Transform advancePayment
    if (transformed.forRent.advancePayment) {
      transformed.forRent.advancePayment = { ...transformed.forRent.advancePayment };

      // Handle old field name: advancePayment.type -> advancePayment.advancePaymentType
      if (transformed.forRent.advancePayment.type && !transformed.forRent.advancePayment.advancePaymentType) {
        transformed.forRent.advancePayment.advancePaymentType = transformed.forRent.advancePayment.type;
        delete transformed.forRent.advancePayment.type;
      }

      if (transformed.forRent.advancePayment.advancePaymentType) {
        transformed.forRent.advancePayment.advancePaymentType = cleanString(transformed.forRent.advancePayment.advancePaymentType) || 'CALL';
      }

      if (transformed.forRent.advancePayment.amount !== undefined) {
        const value = toInteger(transformed.forRent.advancePayment.amount);
        if (value !== null) {
          transformed.forRent.advancePayment.amount = value;
        } else {
          delete transformed.forRent.advancePayment.amount;
        }
      }

      if (transformed.forRent.advancePayment.month !== undefined) {
        const value = toInteger(transformed.forRent.advancePayment.month);
        if (value !== null) {
          transformed.forRent.advancePayment.month = value;
        } else {
          delete transformed.forRent.advancePayment.month;
        }
      }
    }
  }

  return transformed;
}

function transformAmenities(amenities) {
  if (!amenities || typeof amenities !== 'object') {
    return amenities;
  }

  const transformed = {};

  // List of all boolean amenity fields
  const booleanFields = [
    'allowPet',
    'hasAirCondition',
    'hasRefrigerator',
    'hasTV',
    'hasWaterHeater',
    'hasDigitalDoorLock',
    'hasHotTub',
    'hasKitchenHood',
    'hasKitchenStove',
    'hasWasher',
    'hasFurniture',
    'hasInternet',
    'hasPhone',
    'hasMicrowave',
    'hasLift',
    'hasThaiKitchen',
    'hasPantryKitchen',
    'hasPersonalPool',
    'hasEvCharger',
    'hasBuildInCloset',
    'hasStorageRoom',
  ];

  booleanFields.forEach((field) => {
    if (amenities[field] !== undefined) {
      const value = toBoolean(amenities[field]);
      if (value !== undefined) {
        transformed[field] = value;
      }
      // If undefined, field is omitted
    }
  });

  return Object.keys(transformed).length > 0 ? transformed : undefined;
}

function transformPictures(pictures) {
  if (!pictures) return pictures;

  // Helper to transform a single picture entry
  // Ensures schema compliance but does NOT modify URL string
  const transformPic = (pic) => {
    if (typeof pic === 'string') {
      // String URL -> object with url property
      const trimmed = pic.trim();
      return trimmed ? { url: trimmed } : null;
    } else if (pic && typeof pic === 'object' && pic.url) {
      const url = typeof pic.url === 'string' ? pic.url.trim() : '';
      if (!url) return null;
      const result = { url };
      // Keep caption if present and non-empty
      if (pic.caption && typeof pic.caption === 'string' && pic.caption.trim()) {
        result.caption = pic.caption.trim();
      }
      return result;
    }
    return null;
  };

  // Handle array format: ["url1", "url2", ...] or [{url: "..."}, ...]
  if (Array.isArray(pictures)) {
    const filtered = pictures.map(transformPic).filter((pic) => pic !== null);
    return filtered.length > 0 ? filtered : undefined;
  }

  // Handle object format: { listing: [...], property: [...], ... }
  if (typeof pictures === 'object' && !Array.isArray(pictures)) {
    const transformed = {};
    let hasValidPictures = false;

    for (const [category, pics] of Object.entries(pictures)) {
      if (Array.isArray(pics)) {
        const filtered = pics.map(transformPic).filter((pic) => pic !== null);
        if (filtered.length > 0) {
          transformed[category] = filtered;
          hasValidPictures = true;
        }
      }
    }

    return hasValidPictures ? transformed : undefined;
  }

  return pictures;
}

function transformListing(listing) {
  if (!listing) return listing;

  const transformed = { ...listing };

  // String fields that should not be empty
  const requiredStringFields = ['refNo', 'propertyType', 'postType'];
  requiredStringFields.forEach((field) => {
    if (transformed[field] !== undefined) {
      const value = cleanString(transformed[field]);
      if (value !== undefined) {
        transformed[field] = value;
      } else {
        delete transformed[field];
      }
    }
  });

  // Optional string fields
  const optionalStringFields = ['roomType', 'onFloor', 'roomNumber', 'roomHomeAddress', 'facingDirection', 'furnished', 'tenure', 'status', 'remark'];
  optionalStringFields.forEach((field) => {
    if (transformed[field] !== undefined) {
      const value = cleanString(transformed[field]);
      if (value !== undefined) {
        transformed[field] = value;
      } else {
        delete transformed[field];
      }
    }
  });

  // Title object
  if (transformed.title) {
    transformed.title = { ...transformed.title };

    // Clean th
    if (transformed.title.th !== undefined) {
      const value = cleanString(transformed.title.th);
      if (value !== undefined) {
        transformed.title.th = value;
      } else {
        delete transformed.title.th;
      }
    }

    // Clean en
    if (transformed.title.en !== undefined) {
      const value = cleanString(transformed.title.en);
      if (value !== undefined) {
        transformed.title.en = value;
      } else {
        delete transformed.title.en;
      }
    }

    // If th is missing but en exists, copy en to th (match production behavior)
    if (!transformed.title.th && transformed.title.en) {
      transformed.title.th = transformed.title.en;
    }
  }

  // Detail object
  if (transformed.detail) {
    // If detail is a string, convert to object (match production behavior)
    if (typeof transformed.detail === 'string') {
      const detailStr = cleanString(transformed.detail);
      if (detailStr) {
        transformed.detail = { th: detailStr, en: detailStr };
      } else {
        delete transformed.detail;
      }
    } else {
      transformed.detail = { ...transformed.detail };

      // Clean th
      if (transformed.detail.th !== undefined) {
        const value = cleanString(transformed.detail.th);
        if (value !== undefined) {
          transformed.detail.th = value;
        } else {
          delete transformed.detail.th;
        }
      }

      // Clean en
      if (transformed.detail.en !== undefined) {
        const value = cleanString(transformed.detail.en);
        if (value !== undefined) {
          transformed.detail.en = value;
        } else {
          delete transformed.detail.en;
        }
      }

      // If th is missing but en exists, copy en to th (match production behavior)
      if (!transformed.detail.th && transformed.detail.en) {
        transformed.detail.th = transformed.detail.en;
      }
    }
  }

  // Number fields
  const numberFields = ['floorArea', 'landArea', 'areaWidth', 'areaDepth', 'landWidth', 'landDepth'];
  numberFields.forEach((field) => {
    if (transformed[field] !== undefined) {
      const value = toNumber(transformed[field]);
      if (value !== null) {
        transformed[field] = value;
      } else {
        delete transformed[field];
      }
    }
  });

  // Integer fields
  const integerFields = ['numberOfBed', 'numberOfBath', 'numberOfFloor', 'numberOfParking'];
  integerFields.forEach((field) => {
    if (transformed[field] !== undefined) {
      const value = toInteger(transformed[field]);
      if (value !== null) {
        transformed[field] = value;
      } else {
        delete transformed[field];
      }
    }
  });

  // Transform nested objects
  if (transformed.location) {
    transformed.location = transformLocation(transformed.location);
  }

  if (transformed.price) {
    transformed.price = transformPrice(transformed.price);
  }

  // Transform pictures to match schema structure (but don't modify URLs)
  if (transformed.pictures !== undefined) {
    const transformedPictures = transformPictures(transformed.pictures);
    if (transformedPictures !== undefined) {
      transformed.pictures = transformedPictures;
    } else {
      delete transformed.pictures;
    }
  }

  // Transform amenities (map legacy fields + convert string booleans to actual booleans)
  if (transformed.amenities && typeof transformed.amenities === 'object') {
    const a = { ...transformed.amenities };
    // Map legacy field name: hasAir -> hasAirCondition
    if (a.hasAirCondition === undefined && a.hasAir !== undefined) {
      a.hasAirCondition = a.hasAir;
    }
    if (a.hasAir !== undefined) {
      delete a.hasAir;
    }
    // Transform all boolean values (string "true"/"false" -> actual boolean)
    const transformedAmenities = transformAmenities(a);
    if (transformedAmenities !== undefined) {
      transformed.amenities = transformedAmenities;
    } else {
      delete transformed.amenities;
    }
  }

  // Transform contactInformation.agentPhone (ensure it's always an array)
  if (transformed.contactInformation?.agentPhone !== undefined) {
    const phone = transformed.contactInformation.agentPhone;
    if (typeof phone === 'string') {
      // Single phone string -> array
      const cleaned = cleanString(phone);
      if (cleaned) {
        transformed.contactInformation.agentPhone = [cleaned];
      } else {
        delete transformed.contactInformation.agentPhone;
      }
    } else if (Array.isArray(phone)) {
      // Already array, just clean up
      const cleaned = phone.map((p) => (typeof p === 'string' ? cleanString(p) : p)).filter((p) => p !== undefined && p !== '');
      if (cleaned.length > 0) {
        transformed.contactInformation.agentPhone = cleaned;
      } else {
        delete transformed.contactInformation.agentPhone;
      }
    }

    // Clean null/empty contactInformation fields (email, whatsApp, lineId, name, agentPhone)
    ['email', 'whatsApp', 'lineId', 'name', 'agentPhone'].forEach((field) => {
      const value = transformed.contactInformation[field];
      if (value === null || value === undefined) {
        delete transformed.contactInformation[field];
      } else if (typeof value === 'string') {
        const cleaned = cleanString(value);
        if (cleaned) {
          transformed.contactInformation[field] = cleaned;
        } else {
          delete transformed.contactInformation[field];
        }
      }
    });
  }

  // Transform tagName (convert comma-separated string to array)
  if (transformed.tagName !== undefined) {
    if (typeof transformed.tagName === 'string') {
      // Split by comma and clean up each tag
      const tags = transformed.tagName
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag !== '' && tag !== '-');

      if (tags.length > 0) {
        transformed.tagName = tags;
      } else {
        delete transformed.tagName;
      }
    } else if (Array.isArray(transformed.tagName)) {
      // Already an array, just clean up the values
      const tags = transformed.tagName
        .map((tag) => {
          if (typeof tag === 'string') {
            return cleanString(tag);
          }
          return tag;
        })
        .filter((tag) => tag !== undefined && tag !== '' && tag !== '-');

      if (tags.length > 0) {
        transformed.tagName = tags;
      } else {
        delete transformed.tagName;
      }
    }
  }

  // Remove fields that are not allowed for specific property types (per schema rules)
  if (transformed.propertyType === 'CONDO') {
    // CONDO properties must not have landArea or numberOfFloor
    delete transformed.landArea;
    delete transformed.numberOfFloor;
  } else if (transformed.propertyType === 'LAND') {
    // LAND properties must not have floorArea or numberOfFloor
    delete transformed.floorArea;
    delete transformed.numberOfFloor;
  }

  return transformed;
}

export function transformFeed(feed) {
  if (!feed) return feed;

  const transformed = { ...feed };

  // Transform updatedAt
  if (transformed.updatedAt !== undefined) {
    const value = cleanString(transformed.updatedAt);
    if (value !== undefined) {
      transformed.updatedAt = value;
    }
  }

  // Transform listingCount
  if (transformed.listingCount !== undefined) {
    const value = toInteger(transformed.listingCount);
    if (value !== null) {
      transformed.listingCount = value;
    } else {
      delete transformed.listingCount;
    }
  }

  // Transform listingData array
  if (Array.isArray(transformed.listingData)) {
    transformed.listingData = transformed.listingData.map((listing) => transformListing(listing));
  }

  return transformed;
}

// For CLI usage
export function transformFeedJson(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    return transformFeed(data);
  } catch (error) {
    throw new Error(`Failed to parse JSON: ${error.message}`);
  }
}

/**
 * Compare original and transformed listing to track what changed.
 * Only tracks fields that were actually transformed (type conversions, mappings, etc.)
 */
export function trackTransforms(original, transformed, mappedProjectId = null) {
  const transforms = {};

  // Helper to get nested value
  const get = (obj, path) => {
    return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
  };

  // Fields to track: number conversions
  const numberFields = ['floorArea', 'landArea', 'areaWidth', 'areaDepth', 'landWidth', 'landDepth'];
  const integerFields = ['numberOfBed', 'numberOfBath', 'numberOfFloor', 'numberOfParking'];

  [...numberFields, ...integerFields].forEach((field) => {
    const origVal = get(original, field);
    const transVal = get(transformed, field);
    // Track if original was string and transformed is number
    if (typeof origVal === 'string' && typeof transVal === 'number') {
      transforms[field] = { from: origVal, to: transVal };
    }
  });

  // Track location.projectId changes
  const origProjectId = get(original, 'location.projectId');
  const transProjectId = get(transformed, 'location.projectId');
  if (origProjectId !== transProjectId) {
    const entry = { from: origProjectId, to: transProjectId };
    if (mappedProjectId) {
      entry.source = 'mapping';
    }
    transforms['location.projectId'] = entry;
  }

  // Track price conversions
  const priceFields = ['price.forSale.price', 'price.forRent.price', 'price.forRent.deposit.depositAmount', 'price.forRent.advancePayment.advancePaymentAmount'];
  priceFields.forEach((field) => {
    const origVal = get(original, field);
    const transVal = get(transformed, field);
    if (typeof origVal === 'string' && typeof transVal === 'number') {
      transforms[field] = { from: origVal, to: transVal };
    }
  });

  // Track agentPhone string -> array conversion
  const origPhone = get(original, 'contactInformation.agentPhone');
  const transPhone = get(transformed, 'contactInformation.agentPhone');
  if (typeof origPhone === 'string' && Array.isArray(transPhone)) {
    transforms['contactInformation.agentPhone'] = { from: origPhone, to: transPhone };
  }

  // Track amenities boolean string -> boolean conversion
  const amenityFields = [
    'amenities.allowPet',
    'amenities.hasAirCondition',
    'amenities.hasRefrigerator',
    'amenities.hasTV',
    'amenities.hasWaterHeater',
    'amenities.hasDigitalDoorLock',
    'amenities.hasHotTub',
    'amenities.hasKitchenHood',
    'amenities.hasKitchenStove',
    'amenities.hasWasher',
    'amenities.hasFurniture',
    'amenities.hasInternet',
    'amenities.hasPhone',
  ];
  amenityFields.forEach((field) => {
    const origVal = get(original, field);
    const transVal = get(transformed, field);
    // Track string "true"/"false" -> boolean true/false
    if (typeof origVal === 'string' && typeof transVal === 'boolean') {
      transforms[field] = { from: origVal, to: transVal };
    }
  });

  // Track forRent removal (when price is 0 or invalid)
  const origForRent = get(original, 'price.forRent');
  const transForRent = get(transformed, 'price.forRent');
  if (origForRent && !transForRent) {
    transforms['price.forRent'] = { from: 'removed due to invalid price', to: undefined };
  }

  return Object.keys(transforms).length > 0 ? transforms : null;
}

// Export utility functions for testing
export { toNumber, toInteger, cleanString, toBoolean, transformListing };
