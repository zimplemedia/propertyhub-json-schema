**Propertyhub JSON feed**

Following JSON specification is a simple channel for authorized partners to provide property listing information to Propertyhub. 

**Definition**

| updatedAt | Update date and time of the list in ISO 8601 format (UTC timezone). Type: String in ISO format |
| :---- | :---- |
| listingCount | Number of elements in listingData field. Type: Integer |
| listingData | Array of listing data. Type: Array |
| refNo | Unique Reference No. in your system, this should be guaranteed to be the same for the same listing.   Type: String |
| propertyType  | Type of property  Allow value is one of following: CONDO HOME LAND SHOP\_HOUSE TOWN\_HOUSE APARTMENT (only FOR\_SALE) FACTORY OFFICE RETAIL\_SPACE HOME\_OFFICE TWIN\_HOUSE Noted: HOME \- บ้านเดี่ยว (detacted house, single house) TOWN\_HOUSE \- ทาวน์เฮ้าส์ ทาวน์โฮม (townhouse) SHOP\_HOUSE \- อาคารพานิชย์ (shophouse) TWIN\_HOUSE \- บ้านแฝด (semi-detacted house) HOME\_OFFICE \- โฮมออฟซิส ไม่ใช่พื้นที่ office ในตึกสำนักงาน (home office, not office space in office building) OFFICE \- เฉพาะ พื้นที่ office ในตึกสำนักงาน ถ้าต้องการลงประกาศบ้านว่าเป็น office ได้ให้ ระบุเป็น HOME\_OFFICE (only for office space in office building) RETAIL\_SPACE \- พื้นที่ขายของ (retain space) LAND \- ที่ดิน (land plot)  Type: Enum (String)  |
| postType | Type of listing  Allow value is one of following: FOR\_RENT FOR\_SALE Type: Enum (String) |
| status | \[DEPRECATED\]  System is no loger consider status field. The listings (refNo) that were presented in previous feed but missing from the most recent feed will be considered removed, and system will change status of the listing to OFFLINE. Status of the listing Allow value is one of following: ACTIVE DELETED Type: Enum (String) **Note:** we will handle listing on property according to this status. ACTIVE:  if status is ACTIVE and refNo is NOT present in propertyhub, we will create new listing. If refNo is present in our system, this listing will be updated. DELETED:  if status is DELETED and refNo is present in propertyhub, we will inactive listing on propertyhub. If refNo is NOT present in our system, this listing will be ignored. |
| title | Title of the listing. Type: Object of title in each language.  "title": {    "th": "",    "en": "" }  |
| location | Location of the property Type: Object of location information. |
| projectId (preferred option) | Project ID according to the “Project Mapping” document (Propertyhub Project ID) Type: Integer |
| externalProjectId | Project ID of the property (mapped to external source eg. DDproperty) Type: Integer |
| projectName | Project name of the property Type: String |
| homeAddress | Home address of the property, Type: String Note: this field is valid for following propertyType HOME SHOP\_HOUSE TOWN\_HOUSE APARTMENT FACTORY OFFICE SALE\_AREA HOME\_OFFICE For CONDO, please use the “roomHomeAddress” field. System will ignore this field when the property type is LAND or CONDO.  |
| soi | Alley name (eg. Sukhumvit 24\) Type: String Note: this field is not necessary for CONDO. System will ignore the field when propertyType is CONDO and use internal project data. |
| road | Road name Type: String Note: this field is not necessary for CONDO. System will ignore the field when propertyType is CONDO and use internal project data. |
| provinceCode | Province code of the property according to the “Province data” document. Type: String Note: this field is not necessary for CONDO. System will ignore the field when propertyType is CONDO and use internal project data. |
| districtCode | District code of the property according to the “Province data” document. Type: Integer Note: this field is not necessary for CONDO. System will ignore the field when propertyType is CONDO and use internal project data. |
| subDistrictCode | Sub District code of the property according to the “Province data” document. Type: Integer Note: this field is not necessary for CONDO. System will ignore the field when propertyType is CONDO and use internal project data. |
| postCode | Post code Type: Integer Note: this field is not necessary for CONDO. System will ignore the field when propertyType is CONDO and use internal project data. |
| lat | Latitude of the property Type: Floating number Note: this field is not necessary for CONDO. System will ignore the field when propertyType is CONDO and use internal project data. |
| lng | Longitude of the property Type: Floating number Note: this field is not necessary for CONDO. System will ignore the field when propertyType is CONDO and use internal project data. |
| onFloor | Floor number that the listing is on (for condo room) Type: String Note: this field is only valid for CONDO.   |
| landArea | Land size of the property. Type: Floating number The unit of land size is “sqaure wa” (1 square wa \= 4 square meters) Note: this field is not necessary for CONDO. System will ignore the field when propertyType is CONDO. |
| floorArea | Floor area of the property. For CONDO this is the room size. For other property type (eg. house, townhouse), this is the usable space of the property. Type: Floating number Note: this field is not necessary for LAND. System will ignore the field when propertyType is LAND.  |
| areaWidth | Width of the room Type: Floating number Note: this field is ONLY valid for RETAIL\_SPACE, OFFICE, FACTORY  |
| areaDepth | Depth of the room Type: Floating number Note: this field is ONLY valid for RETAIL\_SPACE, OFFICE, FACTORY |
| landWidth | Width of the land plot Type: Floating number Note: this field is ONLY valid for propertyType LAND  |
| landDepth | Depth of the land plot Type: Floating number Note: this field is ONLY valid for propertyType LAND  |
| roomType | Unit type of CONDO room. Allow value is one of following: STUDIO ONE\_BED\_ROOM TWO\_BED\_ROOM THREE\_BED\_ROOM FOUR\_BED\_ROOM FIVE\_BED\_ROOM SIX\_BED\_ROOM MOFF LOFT DUPLEX\_ONE\_BED DUPLEX\_TWO\_BED DUPLEX\_THREE\_BED DUPLEX\_FOUR\_BED DUPLEX\_FIVE\_BED PENTHOUSE VILLA ROOM\_TYPE\_OTHER  Type: Enum (String)  Note: this field is only valid for CONDO. System will ignore the field when propertyType is NOT CONDO. |
| roomNumber | Building room number of the CONDO room (eg. 2320, 12A10) Type: String Note: this field is only valid for CONDO. System will ignore the field when propertyType is NOT CONDO. |
| roomHomeAddress | Home address of CONDO room (eg. 5/333) Type: String Note: this field is only valid for CONDO. System will ignore the field when propertyType is NOT CONDO. |
| numberOfBed | Number of bed room Type: Integer |
| numberOfBath | Number of bath room Type: Integer |
| numberOfFloor | NUmber of floor of the property. Type: Integer Note: this field is NOT valid for CONDO and LAND. |
| numberOfParking | Number of parking lot available Type: Integer Note: this field is ONLY valid for HOME, SHOP\_HOUSE, TOWN\_HOUSE and HOME\_OFFICE |
| numberOfRoom | Number of room in the building Type: Integer Note: this field is ONLY valid for APARTMENT (for SALE) |
| avgRoomArea | Average size of room in this building Type: Float Note: this field is ONLY valid for APARTMENT (for SALE) |
| furnished | Furnishing condition of the property Allow value is one of following:  FULLY PARTIAL UNFURNISHED  Type: Enum (String)  Note: this field is ONLY valid for HOME, SHOP\_HOUSE, TOWN\_HOUSE and HOME\_OFFICE |
| facingDirection | Direction the property or room is facing. Allow value is one of following:  EAST NORTHEAST SOUTHEAST NORTH SOUTH NORTHWEST SOUTHWEST WEST  Type: Enum (String)   |
| price | Price field is object of price information of this property.  If postType is FOR\_RENT, the system will expect the  “forRent” key in this object. If postType is FOR\_SALE, the system will expect the  “forSale” key in this object. Type: Object of property price information. For example:.       "price": {        "forSale": {          "priceType": "AMOUNT",          "price": 5000000        },        "forRent": {          "priceType": "AMOUNT",          "price": 30000,          "advancePayment": {            "advancePaymentType": "MONTH",            "month": 1,          },          "deposit": {            "depositType": "AMOUNT",             "amount": 10000          }        }      },  |
| forSale | Detail about FOR\_SALE price. Type: forSale field consists of priceType field and price field.  |
| forRent | Detail about FOR\_RENT price. Type: forRent field consists of type priceType, price, advancePayment, deposit. |
| priceType | Price type of the property (for both FOR\_SALE, FOR\_RENT) Allow value is one of following:  CALL AMOUNT  Type: Enum (String)  Note: when priceType is AMOUNT, the system will expect value in the price field. |
| price | Price of the property (for both FOR\_SALE, FOR\_RENT) Type: Integer Note.  For FOR\_SALE listing, this is the selling price. For FOR\_RENT listing, this is the monthly rental price. |
| advancePayment | Information about advance payment for FOR\_RENT listing. Type: Object consists of fields type, amount, month  |
| advancePaymentType | Type of the advance payment Allow value is one of following: AMOUNT MONTH NO\_ADVANCE\_PAYMENT CALL Type: Enum (String)  Note:  when advancePaymentType is AMOUNT, the system will expect value in the amount field. when advancePaymentType is MONTH, the system will expect value in the month field.  |
| month | Amount of advance payment or deposit in THB. Type: Integer |
| amount | Number of months for advance payment or deposit. Type: Integer |
| deposit | Information about deposit payment for FOR\_RENT listing. Type: Object consists of fields type, amount, month  |
| depositType | Type of the deposit payment Allow value is one of following: AMOUNT MONTH NO\_DEPOSIT\_PAYMENT CALL Type: Enum (String)  Note:  when depositType is AMOUNT, the system will expect value in the amount field. when depositType is MONTH, the system will expect value in the month field.  |
| tenure | Tenure of the property Allow value is one of following: FREEHOLD, LEASEHOLD Type: Enum (String) Note: this field will only be considered for FOR\_SALE listing. |
| detail | detail of the listing. Type: Object of detail in each language.   "title": {    "th": "",    "en": "" }  |
| amenities | Amenities in the property: Amenities for CONDO propertyType:  {    "allowPet": true, // true,false    "hasAirCondition": true,    "hasRefrigerator": true,    "hasTV": true,    "hasWaterHeater": true,    "hasDigitalDoorLock": true,    "hasHotTub": true,    "hasKitchenHood": true,    "hasKitchenStove": true,    "hasWasher": true,    "hasMicrowave": true,    "hasFurniture": true,    "hasInternet": true } Amenities for OTHER propertyType (except LAND and APARTMENT (for sale ): LAND and APARTMENT doesn’t support amenities data  {  "hasLift": true,  "hasFurniture": true,  "hasAir": true,  "hasDigitalDoorLock": true,  "hasTV": true,  "hasRefrigerator": true,  "hasInternet": true,  "hasWaterHeater": true,  "hasHotTub": true,  "hasThaiKitchen": true,  "hasPantryKitchen": true,  "hasKitchenHood": true,  "hasWasher": true,  "hasPersonalPool": true,  "hasEvCharger": true,  "hasBuildInCloset": true,  "hasStorageRoom": true,  "hasPhone": true }   |
| pictures | In propertyhub, we will group pictures of listing into following type.  “listing” \- only pictures of the property “buildingAndFacilities” \- picture of condo building, lobby, playground and other facilities “other” \- other picture eg. 3d render, surrounding area, neighborhood  “notSpecific” \- in case you didn’t group pictures in types, it can go here first. Type: Object of picture groups. Each picture should be in following format  Pictures: {  "listing": \[ {    "url": "https://full-url.com/images/p/783473/7.jpg",    "caption": "living area", } \],  "buildingAndFacilities": \[...\],  "other": \[...\],  "notSpecific": \[...\], }  |
| contactInformation | ONLY applicable for Agency package. For other packages, this field will be ignored. Type: Object of agent contact detail: For example:   "contactInformation": {    "name": "agent number 1",    "lineId": "@agent-line-id",    "email": "[agent-email@example.com](mailto:agent-email@example.com)",    "whatsApp": "+6694949494",    "agentPhone": \["0818889999","09811112222"\] }  Noted: allow maximum of 2 phone number per agent.  |
| tagName | Specific tag that need to be associated with this listing. A listing can be specific up to 5 tags. Type: Array of String For example:   "tagName": \[ "hot", "premium"\] |

| remark | Any internal memo or remark for the listing (eg. property owner contact info, refNo). This field will not be displayed in listing detail page. Type: String |
| :---- | :---- |

Please see example json data in provided “example.json” file