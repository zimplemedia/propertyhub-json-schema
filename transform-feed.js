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
  
  // Convert non-string to string
  return String(value);
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
  
  // Special handling for projectId - keep original value even if invalid (for reference)
  if (transformed.projectId !== undefined) {
    const value = toInteger(transformed.projectId);
    if (value !== null) {
      transformed.projectId = value;
    }
    // Do NOT delete projectId if invalid - keep original for reference
  }
  
  // Other integer fields - remove if invalid
  const integerFields = ['externalProjectId', 'districtCode', 'subDistrictCode', 'postCode'];
  integerFields.forEach(field => {
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
  stringFields.forEach(field => {
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

function normalizeUrl(str) {
  if (!str || typeof str !== 'string') return null;
  const trimmed = str.trim();
  if (trimmed === '' || trimmed === '-') return null;
  
  try {
    // Parse the URL
    const url = new URL(trimmed);
    
    // Encode the pathname to handle special characters (spaces, Thai, etc.)
    // Split pathname into segments, encode each segment, then rejoin
    const pathSegments = url.pathname.split('/');
    const encodedSegments = pathSegments.map(segment => {
      // Don't encode if already encoded or if empty
      if (!segment || segment === encodeURIComponent(decodeURIComponent(segment))) {
        return segment;
      }
      // Encode the segment
      return encodeURIComponent(segment);
    });
    url.pathname = encodedSegments.join('/');
    
    return url.href;
  } catch {
    // If URL parsing fails, try encoding spaces first then retry
    try {
      return normalizeUrl(trimmed.replace(/ /g, '%20'));
    } catch {
      return null;
    }
  }
}

function isValidUrl(str) {
  return normalizeUrl(str) !== null;
}

function transformPictures(pictures) {
  if (!pictures) return pictures;
  
  // Handle array format: ["url1", "url2", ...]
  if (Array.isArray(pictures)) {
    const filtered = pictures
      .map(pic => {
        if (typeof pic === 'string') {
          const normalized = normalizeUrl(pic);
          return normalized ? normalized : null;
        } else if (pic && typeof pic === 'object' && pic.url) {
          const normalized = normalizeUrl(pic.url);
          if (normalized) {
            const transformed = { url: normalized };
            if (pic.caption && pic.caption.trim()) {
              transformed.caption = pic.caption.trim();
            }
            return transformed;
          }
          return null;
        }
        return null;
      })
      .filter(pic => pic !== null);
    
    return filtered.length > 0 ? filtered : undefined;
  }
  
  // Handle object format: { listing: [...], buildingAndFacilities: [...], ... }
  if (typeof pictures === 'object' && !Array.isArray(pictures)) {
    const transformed = {};
    let hasValidPictures = false;
    
    for (const [category, pics] of Object.entries(pictures)) {
      if (Array.isArray(pics)) {
        const filtered = pics
          .map(pic => {
            if (typeof pic === 'string') {
              const normalized = normalizeUrl(pic);
              return normalized ? normalized : null;
            } else if (pic && typeof pic === 'object' && pic.url) {
              const normalized = normalizeUrl(pic.url);
              if (normalized) {
                const transformedPic = { url: normalized };
                if (pic.caption && pic.caption.trim()) {
                  transformedPic.caption = pic.caption.trim();
                }
                return transformedPic;
              }
              return null;
            }
            return null;
          })
          .filter(pic => pic !== null);
        
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
  requiredStringFields.forEach(field => {
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
  optionalStringFields.forEach(field => {
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
  numberFields.forEach(field => {
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
  integerFields.forEach(field => {
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
  
  // Transform pictures
  if (transformed.pictures !== undefined) {
    const transformedPictures = transformPictures(transformed.pictures);
    if (transformedPictures !== undefined) {
      transformed.pictures = transformedPictures;
    } else {
      delete transformed.pictures;
    }
  }
  
  // Map legacy amenities fields
  if (transformed.amenities && typeof transformed.amenities === 'object') {
    const a = { ...transformed.amenities };
    if (a.hasAirCondition === undefined && a.hasAir !== undefined) {
      a.hasAirCondition = a.hasAir;
    }
    if (a.hasAir !== undefined) {
      delete a.hasAir;
    }
    transformed.amenities = a;
  }

  // Transform tagName (convert comma-separated string to array)
  if (transformed.tagName !== undefined) {
    if (typeof transformed.tagName === 'string') {
      // Split by comma and clean up each tag
      const tags = transformed.tagName
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag !== '' && tag !== '-');
      
      if (tags.length > 0) {
        transformed.tagName = tags;
      } else {
        delete transformed.tagName;
      }
    } else if (Array.isArray(transformed.tagName)) {
      // Already an array, just clean up the values
      const tags = transformed.tagName
        .map(tag => {
          if (typeof tag === 'string') {
            return cleanString(tag);
          }
          return tag;
        })
        .filter(tag => tag !== undefined && tag !== '' && tag !== '-');
      
      if (tags.length > 0) {
        transformed.tagName = tags;
      } else {
        delete transformed.tagName;
      }
    }
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
    transformed.listingData = transformed.listingData.map(listing => transformListing(listing));
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

// Export utility functions for testing
export { toNumber, toInteger, cleanString, normalizeUrl, isValidUrl, transformPictures, transformListing };
