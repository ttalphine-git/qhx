/* Auditor checklists — data transcribed from
   F0427-2 Manufacturing Plants, F0434-2 Slaughtering Plants, F0435-2 Meat Processing Plants
   Revision 05, 8 March 2022. */

export type Question = [number, string, string?];
export type Section = { id: string; title: string; qs: Question[] };
export type Part = { n: string; title: string; sections: Section[] };
export type DocItem = [string, string?];
export type Checklist = {
  key: AuditType;
  name: string;
  short: string;
  form: string;
  rev: string;
  parts: Part[];
  docs: DocItem[];
};
export type AuditType = "manufacturing" | "slaughterhouse" | "meatprocessing";

export const AUDIT_TYPES: AuditType[] = ["manufacturing", "slaughterhouse", "meatprocessing"];

/* Shared reference material, printed on page 2 of all three forms. */
export const REFERENCE: {
  risk: [string, string][];
  terms: [string, string][];
} = {
  risk: [
    ["Very High", "Chemicals and pharmaceuticals \u201cnot elsewhere classified\u201d; processed meat products; genetically modified products; food additives; bio cultures; cosmetics; processing aids; land and aquatic animal slaughtering; flavoring and aroma; fragrances; microorganisms; gelatin; collagen"],
    ["High", "Cheese products; biscuits; snacks; edible oil; beverages; dietary supplements; cleaning agents; packaging and wrapping material; leather products; processed fish or shellfish products"],
    ["Medium", "Dairy products; fish products; egg products; beekeeping; spices; horticultural products; preserved fruits; preserved vegetables; canned products; pasta; sugar; animal feed; fish feed; transportation and storage; warehousing"],
    ["Low", "Fresh line caught fish; egg production; milk production; fishing; hunting; fruits; vegetables; grain; fresh fruits and fresh juices; drinking water; flour; salt; inorganic components; minerals; plants"]
  ],
  terms: [
    ["Halal (permissible)", "simply means the permissible; all matters, foods, beverages, medicines, or injectables <strong>permitted</strong> based on the Sharia Law or by a fatwa"],
    ["Haram (forbidden)", "simply means the prohibited; all matters, foods, beverages, medicines, or injectables <strong>prohibited</strong> based on the Sharia Law or by a fatwa"],
    ["Non-Halal Meats (non-Halal)", "Animals which have been sacrificed (slaughtered) in which the name of Allah SWT (God) is <strong>not</strong> mentioned during the zabah (slaughtering) process. Even if the animal is a Halal animal, it shall be deemed as not permissible for consumption in any method"],
    ["Najis (unclean)", "simply means the <strong>impure</strong>. Strong examples hereof are Halal items that have been <strong>contaminated</strong> with non-Halal items or Halal items which come into <strong>direct contact</strong> with non-Halal items"]
  ]
};

export const CHECKLISTS: Record<AuditType, Checklist> = {

/* ============================== MANUFACTURING ============================== */
manufacturing: {
  key: "manufacturing",
  name: "Manufacturing Plants",
  short: "Manufacturing",
  form: "F0427-2",
  rev: "Revision 05 — 8 March 2022",
  parts: [
    { n: "1", title: "General Criteria", sections: [
      { id: "1.1", title: "Management and Internal Reviews", qs: [
        [1, "Does the company have documented management review procedures?"],
        [2, "Does the company schedule the management review each year?", "Record the last management review date in the auditor comment."],
        [3, "Does the management review take Halal certification activities into consideration?"],
        [4, "Does the company have documented procedures for internal auditing on Halal-related activities?", "Record the last internal audit report date in the auditor comment."]
      ]},
      { id: "1.2", title: "Quality and Food Safety Management Certification", qs: [
        [1, "If the company does not hold a Food Safety Management System certification, how is food safety ensured?", "Certificates themselves (body, number, expiry) are recorded on the Documents tab."]
      ]},
      { id: "1.3", title: "Halal Assurance System", qs: [
        [1, "Does the company have a policy which takes Halal certification activities into consideration?", "Please make sure that the Halal policy is sufficient by adding the necessary details and personnel involved to carry out this policy."],
        [2, "Does the company have a team which is responsible for Halal-related activities (Halal Management Team)?", "The company may create its own form to be approved upon or fill in the details on the Halal Quality Control form."],
        [3, "Did the company receive a Halal Training for its involved personnel?", "If the company is not aware of the requirements for a healthy Halal Assurance System, a Halal training may be mandatory to be carried out."],
        [4, "Does the company have a quality manual which describes Halal-related activities?", "This quality manual may be an existing manual or a separate quality manual for Halal-related activities."],
        [5, "Does the company have documented procedures for critical activities?", "Critical activities include material selections, supplier control, purchasing, storing, production lines, flow chart analyzing, risk assessments, and product developments."]
      ]},
      { id: "1.4", title: "Suppliers", qs: [
        [1, "Did the company mention all of its suppliers?", "All suppliers are to be mentioned into the Excel-form received by Halal Quality Control."],
        [2, "Did the company mention the Halal certification status of all of its suppliers on the Master Table form?"],
        [3, "Does the company keep track of the expiration dates of the Halal certificates from suppliers?"],
        [4, "Are any suppliers supplying products which have been manufactured by third parties?", "If your supplier is a trader and not the producer, the trader is a third party."],
        [5, "Did the company reject any supplier(s) during the Halal certification process or period?"]
      ]}
    ]},
    { n: "2", title: "Quality Control Procedures", sections: [
      { id: "2.1", title: "General", qs: [
        [1, "Does the company have an in-house laboratory?"],
        [2, "If question 1 is answered 'yes', is this laboratory ISO 17025 certified?"],
        [3, "Does the company collaborate with external laboratories for testing purposes?"],
        [4, "Can the in-house laboratory detect porcine traces and/or alcohol traces?"],
        [5, "Can the external laboratory detect porcine traces and/or alcohol traces?"],
        [6, "When was the last sample taken for analyzing traces of porcine or alcohol?", "Record the date in the auditor comment, or mark N/A."],
        [7, "Is it ensured that the company communicates which Halal certificates it possesses from its suppliers or traders to Halal Quality Control?"],
        [8, "Does the company hold the flow process charts of all its products?"],
        [9, "Does the company hold the flow process charts of all products manufactured by another manufacturing plant?"],
        [10, "Is the company the rightful owner of the products and its formula?"]
      ]},
      { id: "2.2", title: "Halal Conformance Procedures", qs: [
        [1, "Does the company have documented procedures to handle non-Halal or forbidden products?"],
        [2, "Does the company have a clean and safe production or processing line for its Halal products?", "Please specify the process in the auditor comment."],
        [3, "Does the company have a documented recall procedure for non-conformance products sold or shipped?"],
        [4, "Does the company have a documented procedure on how to select its raw materials or formulations, taking Halal aspects into consideration?"],
        [5, "Does the company keep records of its recall system and tests performed?"]
      ]},
      { id: "2.3", title: "Tracing Procedures", qs: [
        [1, "Does the company have a working and operational tracing system?"],
        [2, "Does the company have a documented tracing procedure?"],
        [3, "Has any tracing test been marked as a failure in general?", "Please specify the reason in the auditor comment."],
        [4, "Is the company aware of its obligations to provide supporting documentation when requested upon by Halal Quality Control during any phase of its certification cycle with respect to traceability?", "Please note that this obligation can be linked back to the Service Agreement where it is mentioned in further details."],
        [5, "Has a trace test been conducted during the inspection or during a random market surveillance?", "Record item / market and whether results were successful, mixed or a failure in the auditor comment."]
      ]}
    ]},
    { n: "3", title: "Packaging Materials and Labeling", sections: [
      { id: "3.1", title: "Packaging Materials", qs: [
        [1, "Does the company hold the technical specifications or any Halal certificates of its packaging materials?"],
        [2, "Did the company mention its list of suppliers of the packaging materials?"],
        [3, "What type of packaging materials are used to package the products?", "Describe the packaging materials in the auditor comment."],
        [4, "Are the certified products labeled with a Halal Mark of Halal Quality Control or marked as Halal?"],
        [5, "Did the company describe its Halal ingredients correctly on the packaging?", "Example: Malt Beverages instead of Non-Alcoholic drink, Bovine/Fish Gelatin instead of 'Gelatin'."],
        [6, "Did the company send an example of its label to Halal Quality Control?"]
      ]}
    ]},
    { n: "4", title: "Facility Criteria", sections: [
      { id: "4.1", title: "General", qs: [
        [1, "Are any major changes made during the last year?", "Example: new management team, bought by another company, new production lines, new third party manufacturers, or new major suppliers."],
        [2, "If 'Yes', were there new production facility building(s)?"],
        [3, "If 'Yes', were there new internal or external warehouse(s)?"],
        [4, "If 'Yes', were there new production facilities or line(s)?"],
        [5, "Does the company have any signs, boards, special clothing, coloring, zones, or personnel for Halal productions?"],
        [6, "Is the company a Halal-dedicated (HD) facility?", "Halal-dedicated facility: manufacturing site with only Halal-suitable materials and no forbidden materials or products present. Answer 'No' if it is a sharing facility (SF): a site where Halal and non-Halal products are present under the same roof."],
        [7, "Is the manufacturing site free from porcine materials or meats?", "If yes, please request the porcine-free declaration form from Halal Quality Control. If no, describe in which area(s) present."],
        [8, "If question 4.1.7 is answered 'no', is it ensured that cross-contamination is safeguarded?", "Please describe how in the auditor comment."],
        [9, "Is the manufacturing site free from animal materials or meats?", "Example: free from animal gelatin, collagen, fat, proteins, and insect materials. If dairy, please describe."],
        [10, "Are the products, destined for Halal certification, manufactured by a third party?", "Example: the company is the owner of the formulation, but the manufacturing site is another company contracted by the formula owner. If yes: by whom, country, and is the manufacturing Halal certified?"],
        [11, "Are the products, destined for Halal certification, owned by a third party?", "Example: the company is the owner of the manufacturing site, but the formula owner is another company which contracts the manufacturing site. If yes: by whom, country, and is the formula owner Halal certified?"],
        [12, "Are the production lines, producing the Halal products, free from contamination with unclean and/or forbidden materials?", "If no, please describe."],
        [13, "Does the company have any dedicated production lines for Halal productions?", "Production lines which only are used to produce Halal products or production lines which do not handle any unclean or forbidden materials. If yes, which lines?"],
        [14, "Does the company operate supporting equipment which handle Halal and non-Halal materials?", "Example: oven, steaming cabins, tumblers, mixers, blenders, cutting machinery, or others. If yes, please describe."],
        [15, "Is the manufacturing site free from any alcohol?", "Not including cleaning materials."],
        [16, "If question 4.1.15 is answered 'no', is it ensured that cross-contamination is safeguarded?"],
        [17, "Does the company manufacture Fit for Human Consumption (FHC) products?", "FHC: products which are able to be consumed directly by a consumer in dry and liquid format. NFHC: products which are not able to be consumed directly by a consumer, such as intermediate products. Answer 'No' if NFHC only; note the mix in the auditor comment."]
      ]},
      { id: "4.2", title: "Storage / Cooling / Freezing Area", qs: [
        [1, "Does the company have documented procedures for storing Halal products in its storage area?"],
        [2, "Does the company have any separated area for storing Halal products?"],
        [3, "Does the company separate Halal and non-Halal and forbidden products within its storage area?"],
        [4, "Does the company rent any external warehouse for storing its products?", "If yes: by whom and in which country?"],
        [5, "Are Halal products labeled clearly?"],
        [6, "Are there any risks for cross-contamination within the storage area?"],
        [7, "Are there any open products (without packaging) present within the storage area?"]
      ]},
      { id: "4.3", title: "Logistics", qs: [
        [1, "Does the company have a documented procedure or guideline on the logistics for Halal goods?"],
        [2, "Are the logistic methods ensured to avoid cross-contamination?"],
        [3, "Are the Halal goods transported by owned vehicles?", "Answer 'No' if transported by third party vehicles; note the mix in the auditor comment."],
        [4, "If forbidden materials are loaded and transported with Halal goods, are measures taken to keep the transportation safe?", "Measures may be: not applicable (no forbidden materials present), procedures and guidelines in place, clear and visible separation during transportation, or other measures. Specify in the auditor comment."]
      ]}
    ]},
    { n: "5", title: "Production and Process Criteria", sections: [
      { id: "5.1", title: "General", qs: [
        [1, "Are the end products to be Halal certified Fit for Human Consumption (FHC)?", "FHC: products which are able to be consumed directly by a consumer in dry and liquid format. NFHC: products which are not able to be consumed directly by a consumer, such as intermediate products or cosmetics."],
        [2, "Do the end products to be Halal certified contain inappropriate names?", "Example: products resembling forbidden products such as bacon, beer, whiskey, hot dog etc. This criteria is mainly meant for Indonesia, Malaysia, Singapore, and Brunei and subject to approval."],
        [3, "Do the end products to be Halal certified resemble, smell, or taste like inappropriate products?", "Example: products resembling forbidden products such as bacon, beer, wine, erotism, etc. This criteria is mainly meant for Indonesia, Malaysia, Singapore, and Brunei and subject to approval."],
        [4, "Is the ethanol content of the end product lower than 0.1%?", "Some countries adhere to different maximum limits for FHC products; for NFHC products, more flexible terms apply. Record the actual percentage in the auditor comment."],
        [5, "Are any end products to be Halal certified repacked or relabeled for the company by other parties?", "If yes: by whom, country, and is the manufacturing Halal certified?"],
        [6, "Are any processing aids, media, cultures, microbes, hair, emulsifiers, or other helping tools derived from animal derivatives?", "If yes: which animal and which items?"],
        [7, "Are the end products to be Halal certified fit for vegetarians (V) and/or vegans (VG)?", "Specify V, VG or both in the auditor comment."],
        [8, "If the company manufactures vegetarian or vegan products, is it ensured that the production lines are free from porcine materials, even if cleaning takes place?"]
      ]}
    ]},
    { n: "6", title: "Cleaning and Hygienic Practices", sections: [
      { id: "6.1", title: "Cleaning Activities and Materials", qs: [
        [1, "Does the company have a documented procedure for its cleaning activities?"],
        [2, "Is the cleaning process conducted by a third party?", "If yes: which party and which area(s)?"],
        [3, "Is cleaning in place (CIP) used by the company?", "Other methods are a manual cleaning system or other. Specify in the auditor comment."],
        [4, "Are all cleaning materials stored and kept by the company itself?", "Alternatives: third party, mixed, or other. Specify in the auditor comment."],
        [5, "Are cleaning schedules fixed?", "Answer 'No' if schedules are flexible."],
        [6, "Does the company have all the specifications of its cleaning materials?"],
        [7, "Is (hot) water used as a cleaning material?", "Other materials may be chemicals, non-water materials, or others. Specify in the auditor comment."],
        [8, "Are any cleaning materials or agents Halal certified?", "If only some are certified, or certificates are in request, note this in the auditor comment."],
        [9, "Is ethanol used as a cleaning agent?"],
        [10, "Is the effectiveness of the cleaning activities ensured to remove traces of unclean materials?", "In case the production lines process non-Halal (but not forbidden) materials, the cleaning effectiveness should be verified by the company. The verification technique can be determined by the company or the auditor."]
      ]},
      { id: "6.2", title: "Cleaning of the Production Lines", qs: [
        [1, "Does the company have documented procedures on cleaning its production lines before or after production?"],
        [2, "Does the cleaning of the production line ensure the removal of any unclean leftovers?"],
        [3, "Does the company conduct testing on leftover materials after the cleaning process has ended?"],
        [4, "Is it ensured that forbidden materials are not being touched or contaminated with the utensils and equipment, even if cleaning has been conducted?", "Forbidden materials refer to materials which are prohibited to be consumed, such as any type of porcine materials, blood, alcohol for consumption, etc."]
      ]},
      { id: "6.3", title: "Cleaning of Utensils & Equipment", qs: [
        [1, "Does the company have documented procedures on cleaning its utensils and equipment to avoid contamination?"],
        [2, "Does the cleaning of the utensils and equipment ensure the removal of any unclean leftovers?"],
        [3, "Does the company conduct testing on leftover materials after the cleaning process?"],
        [4, "Is it ensured that forbidden materials are not being touched or contaminated with the utensils and equipment, even if cleaning has been conducted?", "Forbidden materials refer to materials which are prohibited to be consumed, such as any type of porcine materials, blood, alcohol for consumption, etc."]
      ]}
    ]},
    { n: "7", title: "Food Safety and Hazards", sections: [
      { id: "7", title: "Food Safety and Hazards", qs: [
        [1, "Does the company contract a third party to implement pest control activities?", "If yes, with whom?"],
        [2, "Has pest control been performed recently at the company?", "Record the date of the last pest control in the auditor comment."],
        [3, "Does the company have an HACCP plan implemented within the production facility?", "Record the date in the auditor comment."],
        [4, "Has the HACCP plan been tested or reviewed for its effectiveness?", "Record the date of the last test or review in the auditor comment."],
        [5, "Is there a washing and disinfection area for personnel and visitors before entering the production area?"],
        [6, "Does the company handle highly inflammable materials within its production location?"],
        [7, "Are all cleaning materials and/or hazardous chemicals clearly labeled and stored separately from all edible materials?"],
        [8, "Does the company recycle its water system?"],
        [9, "Are there special areas which are destined for pet foods or for non-edible purposes?"],
        [10, "Is it ensured that the personnel can store its clothes, goods, and food safely away from the production area?"],
        [11, "Does the company have a high-risk area?"]
      ]}
    ]}
  ],
  docs: [
    ["Floor Plan of the production facility"],
    ["Specifications of the packaging materials"],
    ["Specifications of the cleaning materials"],
    ["Laboratory analysis results of 1-3 products to be Halal certified", "This may also be requested during the inspection."],
    ["Flow process charts of the products to be Halal certified"],
    ["List of slaughtering personnel"],
    ["Completed Customer Questionnaire"],
    ["Halal Policy or Halal Guideline of the company", "A manual which describes how the company can ensure its Halal productions remain safe throughout the certification period."],
    ["HACCP Plan of the company", "The existing HACCP plan which is already in place."],
    ["Food Safety Management Certificates with its Grade or Results mentioned"],
    ["A request for a Halal Training", "Needed for first-timers. Needed for companies applying for exports towards Indonesia, Malaysia, Singapore, or Brunei. Needed for the Halal Management Team which did not receive a Halal Training for over 2 years."],
    ["Halal Master Table", "This form is sent by Halal Quality Control in Excel format which mentions the products, suppliers, and products of the customer."]
  ]
},

/* ============================== SLAUGHTERING ============================== */
slaughterhouse: {
  key: "slaughterhouse",
  name: "Slaughtering Plants",
  short: "Slaughterhouse",
  form: "F0434-2",
  rev: "Revision 05 — 8 March 2022",
  parts: [
    { n: "1", title: "General Criteria", sections: [
      { id: "1.1", title: "Management and Internal Reviews", qs: [
        [1, "Does the company have documented management review procedures?"],
        [2, "Does the company schedule the management review each year?", "Record the last management review date in the auditor comment."],
        [3, "Does the management review take Halal certification activities into consideration?"],
        [4, "Does the company have documented procedures for internal auditing on Halal-related activities?", "Record the last internal audit report date in the auditor comment."]
      ]},
      { id: "1.2", title: "Quality and Food Safety Management Certification", qs: [
        [1, "If the company does not hold a Food Safety Management System certification, how is food safety ensured?", "Certificates themselves (body, number, expiry) are recorded on the Documents tab."]
      ]},
      { id: "1.3", title: "Halal Assurance System", qs: [
        [1, "Does the company have a policy which takes Halal certification activities into consideration?", "Please make sure that the Halal policy is sufficient by adding the necessary details and personnel involved to carry out this policy."],
        [2, "Does the company have a team which is responsible for Halal-related activities (Halal Management Team)?", "The company may create its own form to be approved upon or fill in the details on the Halal Quality Control form."],
        [3, "Did the company receive a Halal Training for its involved personnel?", "If the company is not aware of the requirements for a healthy Halal Assurance System, a Halal training may be mandatory to be carried out."],
        [4, "Does the company have a quality manual which describes Halal-related activities?", "This quality manual may be an existing manual or a separate quality manual for Halal-related activities."],
        [5, "Does the company have documented procedures for critical activities?", "Critical activities include material selections, supplier control, purchasing, storing, production lines, flow chart analyzing, risk assessments, and product developments."]
      ]},
      { id: "1.4", title: "Suppliers and Animal Feeding", qs: [
        [1, "Did the company mention all of its suppliers?", "All suppliers are to be mentioned into the Excel-form received by Halal Quality Control."],
        [2, "Did the company mention the Halal certification status of all of its suppliers on the Excel Master Table form?", "All suppliers of animal meat products must have an approved Halal certificate."],
        [3, "Does the company keep track of the expiration dates of the Halal certificates from suppliers?"],
        [4, "Are any suppliers supplying products which have been manufactured by third parties?", "If your supplier is a trader of meat products and not the producer, the trader is a third party."],
        [5, "Can the company declare or show the ingredients present in the animal feeding?", "Animal feeding should be free from forbidden materials 72 hours prior to being slaughtered as per Halal standard regulations."],
        [6, "Are any suppliers required to send a shipment Halal certificate per each batch?", "Some companies are Halal certified, but need a shipment certificate. This is usually mentioned in the certificate."]
      ]}
    ]},
    { n: "2", title: "Quality Control Procedures", sections: [
      { id: "2.1", title: "Laboratories and Sampling", qs: [
        [1, "Does the company have an in-house laboratory?"],
        [2, "If question 1 is answered 'yes', is this laboratory ISO 17025 certified?"],
        [3, "Does the company collaborate with external laboratories for testing purposes?"],
        [4, "Can the in-house laboratory detect porcine traces and/or alcohol traces?"],
        [5, "Can the external laboratory detect porcine traces and/or alcohol traces?"],
        [6, "When was the last sample taken for analyzing traces of porcine or alcohol?", "Record the date in the auditor comment, or mark N/A."],
        [7, "Is it ensured that the company communicates which Halal certificates it possesses from its suppliers or traders to Halal Quality Control?"],
        [8, "Does the company hold the flow process charts of all its slaughtered animals?"]
      ]},
      { id: "2.2", title: "Halal Conformance Procedures", qs: [
        [1, "Does the company have documented procedures to handle non-Halal or forbidden products?"],
        [2, "Does the company remove animals from the line if the slaughtering has been conducted wrongfully?", "Please specify the process in the auditor comment."],
        [3, "Does the company have a documented recall procedure for non-Halal slaughtered animals?", "This refers to animals being slaughtered incorrectly during the slaughtering process."],
        [4, "Does the company have a documented recall procedure for non-conformance products sold or shipped?", "This refers to products processed or sold from animals slaughtered incorrectly during the slaughtering process."],
        [5, "Does the company have a procedure on cleaning the slaughtering blades or slaughtering equipment?"]
      ]},
      { id: "2.3", title: "Tracing Procedures", qs: [
        [1, "Does the company have a working and operational tracing system?"],
        [2, "Does the company keep records of its tracing system and tests performed?"],
        [3, "Has any tracing test been marked as a failure?", "Please specify the reason in the auditor comment."],
        [4, "Is the company aware of its obligations to provide supporting documentation when requested upon by Halal Quality Control during any phase of its certification cycle with respect to traceability?", "Please note that this obligation can be linked back to the Service Agreement where it is mentioned in further details."],
        [5, "Has a trace test been conducted during the inspection or during a random market surveillance?", "Record item / market and whether results were successful, mixed or a failure in the auditor comment."]
      ]}
    ]},
    { n: "3", title: "Packaging Materials", sections: [
      { id: "3.1", title: "Packaging Materials", qs: [
        [1, "Does the company hold the technical specifications or Halal certificates of its packaging materials?"],
        [2, "Did the company mention its list of suppliers of the packaging materials?"],
        [3, "What type of packaging materials are used to package the products?", "Describe the packaging materials in the auditor comment."]
      ]}
    ]},
    { n: "4", title: "Facility Criteria", sections: [
      { id: "4.1", title: "General", qs: [
        [1, "Are any major changes made during the last year?"],
        [2, "If 'Yes', were there new production facility building(s)?"],
        [3, "If 'Yes', were there new internal or external warehouse(s)?"],
        [4, "If 'Yes', were there new production facilities or line(s)?"],
        [5, "Is the company a Halal-dedicated (HD) facility?", "Halal-dedicated facility: slaughtering site with only Halal slaughtering carried out and no forbidden materials or products present at all times. Answer 'No' if it is a sharing facility (SF): a site where Halal and non-Halal slaughtering is conducted under the same roof."],
        [6, "Does the company have any signs or boards mentioning Halal activities or Halal zones?"],
        [7, "Does the company provide a praying area for its personnel?"],
        [8, "Does the company have security measures to enter the production area?", "Measures may be chipcard, fingerprint scan, keys or other. Specify in the auditor comment."],
        [9, "Are any meat products, destined for Halal certification, manufactured by a third party?", "Example: the company is the owner of the formulation, but the manufacturing site is another company contracted by the formula owner. If yes: by whom, country, and is the manufacturing Halal certified?"],
        [10, "Are any products, destined for Halal certification, owned by a third party?", "Example: the company is the owner of the manufacturing site, but the formula owner is another company which contracts the manufacturing site. If yes: by whom, country, and is the manufacturing Halal certified?"]
      ]},
      { id: "4.2", title: "Other Areas", qs: [
        [1, "Does the company have a designated clothing changing area?"],
        [2, "Is there a special washing and cleaning section before entering the production area?"],
        [3, "Is there a special coatrack for Halal sections?"],
        [4, "Does the company provide special clothing for Halal activities, such as different colors or special outfits?"]
      ]},
      { id: "4.3", title: "Storage / Cooling / Freezing Area", qs: [
        [1, "Does the company have documented procedures for storing Halal products in its storage area?"],
        [2, "Does the company have a separated area for storing Halal products?"],
        [3, "Does the company separate Halal and non-Halal products within its storage area?"],
        [4, "Does the company mention any signs or instructions where to store its Halal products?"],
        [5, "Are special colors used for boxes, pallets, or packages when Halal products are stored?"],
        [6, "Are any porcine products present within the storage area at the time of Halal slaughtering?"],
        [7, "Are any non-Halal slaughtered products present within the storage area at the time of Halal slaughtering?"],
        [8, "Are any non-meat products present within the storage area?"],
        [9, "Are Halal and non-Halal slaughtered products present simultaneously within the storage area?"],
        [10, "Are Halal products labeled clearly?"],
        [11, "Are there any risks for cross-contamination within the storage area?"],
        [12, "Are all equipment and utensils safe to be used for Halal products within the storage area?"],
        [13, "Are there any open products (without packaging) present within the storage area?"]
      ]},
      { id: "4.4", title: "Equipment and Utensils", qs: [
        [1, "Is the production facility Halal dedicated, meaning it only conducts Halal productions?"],
        [2, "Are the equipment, machineries, and utensils Halal dedicated, meaning these tools are destined only for Halal products?"],
        [3, "Does the company have a procedure or guideline on keeping its tools and utensils free from unclean or forbidden materials?"],
        [4, "Does the company have a procedure or guideline on keeping its machineries and equipment free from unclean or forbidden materials?"],
        [5, "Does the company have porcine materials coming in contact with tools and utensils?"],
        [6, "Does the company have porcine materials coming in contact with machineries and equipment?"],
        [7, "Are there any special colors or labels for tools and utensils destined for Halal productions?"],
        [8, "Are there any signs or instructions for machineries or equipment destined for Halal productions?"]
      ]},
      { id: "4.5", title: "Logistics", qs: [
        [1, "Does the company have a procedure or guideline on the logistics for Halal goods?"],
        [2, "Are the logistic methods ensured to avoid cross-contamination?"],
        [3, "Are the Halal goods transported by owned vehicles?", "Answer 'No' if transported by third party vehicles; note the mix in the auditor comment."],
        [4, "If forbidden materials are loaded and transported with Halal goods, are measures taken to keep the transportation safe?", "Measures may be: not applicable (no forbidden materials present), procedures and guidelines in place, clear and visible separation during transportation, or other measures."],
        [5, "Are Halal and non-Halal slaughtered products shipped at the same time?"],
        [6, "Are there products other than fresh meats present during the transportation?"],
        [7, "Are the transportation vehicles cleaned before transporting the next goods?"]
      ]}
    ]},
    { n: "5", title: "Slaughtering Process", sections: [
      { id: "5.1", title: "Slaughtering Operational Hours", qs: [
        [1, "Does the company only slaughter Halal?", "If only on some days, answer 'No' and specify the days in the auditor comment."],
        [2, "Which types of animals are slaughtered within the slaughtering plant?", "List each animal type in the auditor comment."],
        [3, "How many animals are normally slaughtered per each working day?", "Record the amount per weekday in the auditor comment, or mark N/A."],
        [4, "How many animals are Halal slaughtered on working days?", "Record the amount per weekday in the auditor comment, or mark N/A."],
        [5, "From what time do the Halal slaughtering operations start and end?", "Record start and end time in the auditor comment."],
        [6, "From what time do the non-Halal slaughtering operations start and end?", "Record start and end time in the auditor comment, or mark N/A."],
        [7, "Does the company have dedicated days for Halal slaughtering?"]
      ]},
      { id: "5.2", title: "Animal Welfare and Transportation", qs: [
        [1, "What is the average percentage of deceased (dead) animals upon arrival at the facility?", "Record the percentage in the auditor comment."],
        [2, "What is the method of transportation of the animals?", "Describe the method in the auditor comment."],
        [3, "Does the company have a veterinarian present during the unloading of the animals?"],
        [4, "What does happen when an animal gets rejected by a veterinarian?", "Explain in the auditor comment."],
        [5, "Does the company employ any animal welfare personnel?"],
        [6, "How long may the animals rest after their arrival at the plant?", "Record the resting time in the auditor comment."],
        [7, "Is it ensured that during unloading, the animals are not harmed?"],
        [8, "Is it ensured there is sufficient water to be provided to the animals during their journey and arrival?"],
        [9, "Were there any sick, dehydrated, or injured animals during the arrival or unloading?"],
        [10, "Are permissible and prohibited animals unloaded at the same time?"],
        [11, "Is the time between shackling (if any) until immobilization less than 1 minute?", "Answer 'No' if more than 1 minute."]
      ]},
      { id: "5.3", title: "Immobilization Tools and Equipment", qs: [
        [1, "Does the company immobilize or calm down the animal before the slaughter occurs?"],
        [2, "If 5.3.1 is answered 'yes', does this occur before (pre) slaughtering?", "Answer 'No' if it occurs after (post) slaughtering, or mark N/A."],
        [3, "Does the company remove animals from the line after the immobilization or calming down process to control its reversibility (animal to stand up)?", "Record type of animal tested, amount of animals tested and results in the auditor comment."],
        [4, "Does the immobilization or calming down process ensure that the animal is alive at the time of slaughter?"],
        [5, "What is the duration between the immobilization or calming down process and the slaughtering of the animal?", "Record the duration in seconds in the auditor comment."],
        [6, "If immobilization is done by means of a water bath, how long do the animals stay inside the water?", "Record the duration in seconds in the auditor comment, or mark N/A."],
        [7, "If immobilization is done by shocking or knocking the head, how long does this process take?", "Record the duration in seconds in the auditor comment, or mark N/A."],
        [8, "Is it ensured that the company keeps records of the immobilization machines or equipment maintenance dates and failure detections?"],
        [9, "Does the company have instruction books on its immobilization machines or equipment?"],
        [10, "How often does the company test and maintain its immobilization machines or equipment?", "Record the frequency in the auditor comment."],
        [11, "If immobilization is done by means of a water bath, is it ensured that the water level and depth are in compliance?"],
        [12, "If immobilization is done by means of a water bath or electrical shocking, what are the parameters?", "Record the parameters in the auditor comment."]
      ]},
      { id: "5.4", title: "Slaughtering Personnel", qs: [
        [1, "Does the company have a list of approved Muslim slaughtering personnel by Halal Quality Control?"],
        [2, "Do the slaughtering personnel hold a recent Halal training certificate issued by a competent Halal trainer, not older than one year?"],
        [3, "Do the slaughtering personnel hold an approval by the local government or municipality to perform slaughtering?"],
        [4, "Is it ensured that record forms are kept updated during each slaughtering process?"],
        [5, "Is it ensured that the tasmiya (reciting Bismillah Allah Akbar) is said by the Muslim during each slaughtered animal?"],
        [6, "Is it ensured that a Halal supervisor is present next to the Muslim slaughtering personnel at all times?"],
        [7, "Is it ensured that the slaughtering personnel are equipped with the correct blades and tools to perform the slaughter correctly?"]
      ]},
      { id: "5.5", title: "Sacrificing the Animal — Four-Footers", qs: [
        [1, "Is it ensured that an animal is not sacrificed in front of another animal?"],
        [2, "Is it ensured that the slaughtering blades are not be sharpened in front of the animal to be sacrificed?"],
        [3, "Does the company have the possibility to face the animal towards Mekka (Qibla) at the time of sacrificing?"],
        [4, "Does the slaughtering ensure that the esophagus, two jugular veins, and the pharynx of the animal are cut correctly and in 1 sawing movement?"],
        [5, "Does the company have a sign or board mentioning the direction towards the Qibla (Mekka)?"],
        [6, "Is it ensured that the slaughtering tools are washed and sterilized with hot water or sterilization materials frequently?"],
        [7, "Is it ensured that only permissible animals are sacrificed on the production line?"],
        [8, "Is it ensured that the cleaning of the tools and machineries used during the processing are clean and free from forbidden sources?"]
      ]},
      { id: "5.5b", title: "Sacrificing the Animal — Poultry", qs: [
        [1, "What method of slaughtering is conducted for poultry?", "Manual (hand), mechanical, both, or other. Specify in the auditor comment."],
        [2, "Does the method of slaughtering ensure that the esophagus, two jugular veins, and the pharynx of the animal are cut correctly and in 1 sawing movement?"],
        [3, "Is it ensured that the poultry remains calm on the slaughtering line?"],
        [4, "Does the company have the possibility to face the animal towards Mekka (Qibla) at the time of sacrificing?"],
        [5, "If the slaughtering method is mechanical, is it ensured that the Muslim slaughtering personnel operates the machine and recites the correct words before starting the process?"],
        [6, "Is it ensured that only permissible animals are sacrificed on the production line?"],
        [7, "Is it ensured that the cleaning of the tools and machineries used during the processing are clean and free from forbidden sources?"]
      ]},
      { id: "5.6", title: "Bleeding Times and Head Stability", qs: [
        [1, "Four-footers: is the bleeding time after the slaughter (before being furtherly processed) sufficient?", "Halal Quality Control recommends a bleeding time of 3 minutes for all animals. Record the actual minutes and seconds in the auditor comment."],
        [2, "Four-footers: is a veterinarian present during the bleeding of the animal?"],
        [3, "Four-footers: is it ensured that the head of the animal is not cut off during the time of slaughtering?"],
        [4, "Poultry: is the bleeding time after the slaughter (before being furtherly processed) sufficient?", "Record the actual minutes and seconds in the auditor comment."],
        [5, "Poultry: is a veterinarian present during the bleeding or further processing of the animal?"],
        [6, "Poultry: is it ensured that the head of the animal is not cut off during the time of slaughtering?"]
      ]},
      { id: "5.7", title: "Oval and Skins", qs: [
        [1, "Does the company ensure that separation between Halal and non-Halal oval, skins, and other parts are separated?"],
        [2, "Are the oval and skins labeled or distinguished between Halal and non-Halal?"],
        [3, "Can the oval or skins be traced back to its slaughtering method?"],
        [4, "Do the oval and/or skins get mixed with other parts?"],
        [5, "Are any materials or products added to the oval or skins?"]
      ]},
      { id: "5.8", title: "Monitoring", qs: [
        [1, "Which person does monitor the health and condition of the animals after the slaughtering has been completed?", "Veterinarian, slaughtering personnel, Halal supervisor or other. Specify in the auditor comment."],
        [2, "Is the monitoring also conducted by third party members or officials?", "Government, municipality, animal welfare union or other. Specify in the auditor comment."],
        [3, "Are record documents kept at the slaughtering facility digitally?", "Answer 'No' if kept as hard copy (paper)."],
        [4, "Does the company have a procedure to handle animals which are slaughtered incorrectly?"],
        [5, "Does the company have a documented procedure to handle animals and their organs and skins which are slaughtered incorrectly?"],
        [6, "Does the company implement its procedures to avoid any contamination with non-Halal and forbidden materials?"]
      ]}
    ]},
    { n: "6", title: "Cleaning and Hygienic Practices", sections: [
      { id: "6.1", title: "Cleaning Activities and Materials", qs: [
        [1, "Does the company have a documented procedure for its cleaning activities?"],
        [2, "Is the cleaning process conducted by a third party?", "If yes, which sections?"],
        [3, "Is cleaning in place (CIP) used by the company?", "Other systems are a manual cleaning system or other. Specify in the auditor comment."],
        [4, "Are all cleaning materials stored and kept by the company itself?", "Alternatives: third party, mixed, or other. Specify in the auditor comment."],
        [5, "Are cleaning schedules fixed?", "Answer 'No' if schedules are flexible."],
        [6, "Does the company have all the specifications of its cleaning materials?"],
        [7, "Is (hot) water used as a cleaning material?", "Other materials may be chemicals, non-water materials, or others. Specify in the auditor comment."],
        [8, "Are any cleaning materials Halal certified?", "If only some are certified, or certificates are in request, note this in the auditor comment."],
        [9, "Is ethanol used as a cleaning agent?"]
      ]},
      { id: "6.2", title: "Cleaning of the Production Lines", qs: [
        [1, "Does the company have documented procedures on cleaning its production lines before or after Halal slaughtering?"],
        [2, "Does the cleaning of the production line ensure the removal of any unclean leftovers?"],
        [3, "Does the company conduct testing on leftover materials after the cleaning process?"],
        [4, "Is it ensured that forbidden animals or materials are not used on the production lines, even if cleaning has been conducted?"]
      ]},
      { id: "6.3", title: "Cleaning of Utensils & Equipment", qs: [
        [1, "Does the company have documented procedures on cleaning its utensils and equipment to avoid contamination?"],
        [2, "Does the cleaning of the utensils and equipment ensure the removal of any unclean leftovers?"],
        [3, "Does the company conduct testing on leftover materials after the cleaning process?"],
        [4, "Is it ensured that forbidden materials are not being touched or contaminated with the utensils and equipment, even if cleaning has been conducted?"]
      ]}
    ]},
    { n: "7", title: "Food Safety and Hazards", sections: [
      { id: "7", title: "Food Safety and Hazards", qs: [
        [1, "Does the company contract a third party to implement pest control activities?", "If yes, with whom?"],
        [2, "Has pest control been performed recently at the company?", "Record the date of the last pest control in the auditor comment."],
        [3, "Does the company have an HACCP plan implemented within the production facility?", "Record the date in the auditor comment."],
        [4, "Has the HACCP plan been tested or reviewed for its effectiveness?", "Record the date of the last test or review in the auditor comment."],
        [5, "Is there a washing and disinfection area for personnel and visitors before entering the production area?"],
        [6, "Are incoming trucks with live animals checked upon arrival for diseases?"],
        [7, "Are all cleaning materials and/or hazardous chemicals clearly labeled and stored separately from all edible materials?"],
        [8, "Does the company recycle its water system?"],
        [9, "Are there special boxes for meats which are destined for pet foods or for non-edible purposes?"],
        [10, "Is it ensured that the personnel can store its clothes, goods, and food safely away from the production area?"],
        [11, "Does the company provide an area where its personnel and visitors can have their meals during a break?"]
      ]}
    ]}
  ],
  docs: [
    ["Floor Plan of the slaughtering facility"],
    ["Specifications of the packaging materials"],
    ["Specifications of the cleaning materials"],
    ["Laboratory analysis results of 1-3 products to be Halal certified", "This may also be requested during the inspection."],
    ["Flow process charts of the animals to be Halal slaughtered"],
    ["List of approved Muslim slaughtering personnel"],
    ["Halal training certificates of the slaughtering personnel", "Issued by a competent Halal trainer, not older than one year."],
    ["Completed Customer Questionnaire"],
    ["Halal Policy or Halal Guideline of the company"],
    ["HACCP Plan of the company", "The existing HACCP plan which is already in place."],
    ["Food Safety Management Certificates with its Grade or Results mentioned"],
    ["A request for a Halal Training", "Needed for first-timers and for personnel who did not receive a Halal Training for over 2 years."],
    ["Halal Master Table", "Sent by Halal Quality Control in Excel format, mentioning the products, suppliers, and products of the customer."]
  ]
},

/* ============================== MEAT PROCESSING ============================== */
meatprocessing: {
  key: "meatprocessing",
  name: "Meat Processing Plants",
  short: "Meat processing",
  form: "F0435-2",
  rev: "Revision 05 — 8 March 2022",
  parts: [
    { n: "1", title: "General Criteria", sections: [
      { id: "1.1", title: "Management and Internal Reviews", qs: [
        [1, "Does the company have documented management review procedures?"],
        [2, "Does the company schedule the management review each year?", "Record the last management review date in the auditor comment."],
        [3, "Does the management review take Halal certification activities into consideration?"],
        [4, "Does the company have documented procedures for internal auditing on Halal-related activities?", "Record the last internal audit report date in the auditor comment."]
      ]},
      { id: "1.2", title: "Quality and Food Safety Management Certification", qs: [
        [1, "If the company does not hold a Food Safety Management System certification, how is food safety ensured?", "Certificates themselves (body, number, expiry) are recorded on the Documents tab."]
      ]},
      { id: "1.3", title: "Halal Assurance System", qs: [
        [1, "Does the company have a policy which takes Halal certification activities into consideration?", "Please make sure that the Halal policy is sufficient by adding the necessary details and personnel involved to carry out this policy."],
        [2, "Does the company have a team which is responsible for Halal-related activities (Halal Management Team)?", "The company may create its own form to be approved upon or fill in the details on the Halal Quality Control form."],
        [3, "Did the company receive a Halal Training for its involved personnel?", "If the company is not aware of the requirements for a healthy Halal Assurance System, a Halal training may be mandatory to be carried out."],
        [4, "Does the company have a quality manual which describes Halal-related activities?", "This quality manual may be an existing manual or a separate quality manual for Halal-related activities."],
        [5, "Does the company have documented procedures for critical activities?", "Critical activities include material selections, supplier control, purchasing, storing, production lines, flow chart analyzing, risk assessments, and product developments."]
      ]},
      { id: "1.4", title: "Suppliers", qs: [
        [1, "Did the company mention all of its suppliers?", "All suppliers are to be mentioned into the Excel-form received by Halal Quality Control."],
        [2, "Did the company mention the Halal certification status of all of its suppliers on the Master Table form?", "All suppliers of animal meat products must have an approved Halal certificate."],
        [3, "Does the company keep track of the expiration dates of the Halal certificates from suppliers?"],
        [4, "Are any suppliers supplying products which have been manufactured by third parties?", "If your supplier is a trader of meat products and not the producer, the trader is a third party."],
        [5, "Are any suppliers required to send a shipment Halal certificate per each batch?", "Some companies are Halal certified, but need a shipment certificate. This is usually mentioned in the certificate."]
      ]}
    ]},
    { n: "2", title: "Quality Control Procedures", sections: [
      { id: "2.1", title: "General", qs: [
        [1, "Does the company have an in-house laboratory?"],
        [2, "If question 1 is answered 'yes', is this laboratory ISO 17025 certified?"],
        [3, "Does the company collaborate with external laboratories for testing purposes?"],
        [4, "Can the in-house laboratory detect traces of porcine, bovine, poultry, or other animals?", "If yes, which animals?"],
        [5, "Can the external laboratory detect traces of porcine, bovine, poultry, or other animals?", "If yes, which animals?"],
        [6, "When was the last sample taken for analyzing traces of animal derivatives?", "Record the date in the auditor comment, or mark N/A."],
        [7, "Is it ensured that the company communicates which Halal certificates it possesses from its suppliers or traders to Halal Quality Control?"],
        [8, "Does the company hold the flow process charts of all its products?"],
        [9, "Does the company hold the flow process charts of all products manufactured by another manufacturing plant?"],
        [10, "Is the company the rightful owner of the products and its formula?"]
      ]},
      { id: "2.2", title: "Halal Conformance Procedures", qs: [
        [1, "Does the company have documented procedures to handle non-Halal or forbidden products?"],
        [2, "Does the company have a clean and safe production or processing line for its Halal products?", "Please specify the process in the auditor comment."],
        [3, "Does the company have a documented recall procedure for non-conformance products sold or shipped?"],
        [4, "Does the company keep records of its recall system and tests performed?"],
        [5, "Does the company have a documented procedure on how to select its raw materials or formulations, taking Halal aspects into consideration?"]
      ]},
      { id: "2.3", title: "Tracing Procedures and Obligations", qs: [
        [1, "Does the company have a working and operational tracing system?"],
        [2, "Does the company keep records of its tracing system and tests performed?"],
        [3, "Has any tracing test been marked as a failure in general?", "Please specify the reason in the auditor comment."],
        [4, "Is the company aware of its obligations to provide supporting documentation when requested upon by Halal Quality Control during any phase of its certification cycle with respect to traceability?", "Please note that this obligation can be linked back to the Service Agreement where it is mentioned in further details."],
        [5, "Has a trace test been conducted during the inspection or during a random market surveillance?", "Record item / market and whether results were successful, mixed or a failure in the auditor comment."]
      ]}
    ]},
    { n: "3", title: "Packaging Materials and Labeling", sections: [
      { id: "3.1", title: "Packaging Materials", qs: [
        [1, "Does the company hold the technical specifications or any Halal certificates of its packaging materials?"],
        [2, "Did the company mention its list of suppliers of the packaging materials?"],
        [3, "What type of packaging materials are used to package the products?", "Describe the packaging materials in the auditor comment."],
        [4, "Are the certified products labeled with a Halal Mark of Halal Quality Control or marked as Halal?"],
        [5, "Did the company describe its Halal ingredients correctly on the packaging?", "Example: Malt Beverages instead of Non-Alcoholic drink, Bovine/Fish Gelatin instead of 'Gelatin'."],
        [6, "Did the company send an example of its label to Halal Quality Control?"]
      ]}
    ]},
    { n: "4", title: "Facility Criteria", sections: [
      { id: "4.1", title: "General", qs: [
        [1, "Are any major changes made during the last year?", "Example: new management team, bought by another company, new production lines, new third party manufacturers, or new major suppliers."],
        [2, "If 'Yes', were there new production facility building(s)?"],
        [3, "If 'Yes', were there new internal or external warehouse(s)?"],
        [4, "If 'Yes', were there new production facilities or line(s)?"],
        [5, "Does the company have any signs, boards, special clothing, coloring, zones, or personnel for Halal productions?"],
        [6, "Is the company a Halal-dedicated (HD) facility?", "Halal-dedicated facility: manufacturing site with only Halal-suitable materials and no forbidden materials or products present. Answer 'No' if it is a sharing facility (SF)."],
        [7, "Is the manufacturing site free from porcine materials or meats?", "If yes, please request the porcine-free declaration form from Halal Quality Control. If no, describe in which area(s) present."],
        [8, "If question 4.1.7 is answered 'no', is it ensured that cross-contamination is safeguarded?", "Please describe how in the auditor comment."],
        [9, "Is the manufacturing site free from animal materials or meats?", "Example: free from animal gelatin, collagen, fat, proteins, and insect materials. If dairy, please describe."],
        [10, "Are any meat products or brands, destined for Halal certification, manufactured by a third party?", "Example: the company is the owner of the formulation, but the manufacturing site is another company contracted by the formula owner. If yes: by whom, country, and is the manufacturing Halal certified?"],
        [11, "Are any products or brands, destined for Halal certification, owned by a third party?", "Example: the company is the owner of the manufacturing site, but the formula owner is another company which contracts the manufacturing site. If yes: by whom, country, and is the formula owner Halal certified?"],
        [12, "Are the production lines, producing the Halal products, free from contamination with unclean and/or forbidden materials?", "Production lines may process or handle meats from permissible animals which are not slaughtered as Halal, but cleaning must have taken place before Halal meats can be processed or handled. Forbidden animals are not allowed to be processed or handled on the same production lines."],
        [13, "Does the company have any dedicated production lines for Halal productions?", "Production lines which only are used to produce Halal products or production lines which do not handle any unclean or forbidden materials. If yes, which lines?"],
        [14, "Does the company operate supporting equipment which handle Halal and non-Halal materials?", "Example: oven, steaming cabins, tumblers, mixers, blenders, cutting machinery, or others. If yes, please describe."],
        [15, "Is the manufacturing site free from any alcohol?", "Not including cleaning materials."],
        [16, "If question 4.1.15 is answered 'no', is it ensured that cross-contamination is safeguarded?"],
        [17, "Does the company manufacture and process Fresh/Frozen Meats (FFM)?", "FFM: meats which are not further processed by being cooked, heat-treated, fried, baked, smoked, or canned. TM (Treated Meats): meats which are further processed by any of the above examples. Answer 'No' if treated meats only; note the mix in the auditor comment."]
      ]},
      { id: "4.2", title: "Storage / Cooling / Freezing Area", qs: [
        [1, "Does the company have documented procedures for storing Halal products in its storage area?"],
        [2, "Does the company have any separated area for storing Halal products?"],
        [3, "Are any porcine meats or materials present within the storage area?"],
        [4, "If question 4.2.3 is answered 'yes', can the company ensure a physical separation between Halal meats and meats which are not destined for Halal certification within its storage area?"],
        [5, "Does the company rent any external warehouse for storing its products?", "If yes: by whom and in which country?"],
        [6, "Are Halal products labeled clearly?", "If yes, which color or shapes?"],
        [7, "Are there any further risks for cross-contamination within the storage area?"],
        [8, "Are there any open products (without packaging) present within the storage area?"],
        [9, "Are there any other types of products stored within the storage area which might endanger the Halal products?", "If yes, please describe."]
      ]},
      { id: "4.3", title: "Logistics", qs: [
        [1, "Does the company have a documented procedure or guideline on the logistics for Halal goods?"],
        [2, "Are the logistic methods ensured to avoid cross-contamination?"],
        [3, "Are the Halal goods transported by owned vehicles?", "Answer 'No' if transported by third party vehicles; note the mix in the auditor comment."],
        [4, "If forbidden materials are loaded and transported with Halal goods, are measures taken to keep the transportation safe?", "Measures may be: not applicable (no forbidden materials present), procedures and guidelines in place, clear and visible separation during transportation, or other measures."]
      ]}
    ]},
    { n: "5", title: "Production and Process Criteria", sections: [
      { id: "5.1", title: "General", qs: [
        [1, "Does the company manufacture and process Fresh/Frozen Meats (FM)?", "FFM: meats which are not further processed by being cooked, heat-treated, fried, baked, smoked, or canned. TM: meats which are further processed by any of the above examples."],
        [2, "If question 5.1.1 is answered 'yes', can the type of end product which is manufactured be described?", "Example: Gelatin, canned luncheon, smoked meats, etc. Describe in the auditor comment."],
        [3, "Are there any distinguishments during a Halal production?", "Example: different colors for personnel, signs or boards mentioned within the production area, specific days or shifts, etc."],
        [4, "If question 5.1.3 is answered 'no', is it ensured that a Halal production can be performed safely and in accordance to the procedures and protocol of the company?"],
        [5, "Are any end products, to be Halal certified, repacked or relabeled by the company?", "If yes: for whom and which products?"],
        [6, "Does the company keep sufficient records of its Halal productions?", "If yes, how often? If no, please explain."],
        [7, "Are any materials added to the products to be Halal certified, other than meat derivatives?", "Example: Flavoring, Aroma, Emulsifiers, Spices, Marinades, Whey, Fats, Protein, Breadcrumbs, etc. If yes, are these materials mentioned in the Halal Master Table?"],
        [8, "Are all supplied meats from the suppliers, destined for Halal certification, Halal certified?", "It is not allowed to have a supplier of meats without a Halal certificate."]
      ]},
      { id: "5.2", title: "Processing Activity: Deboning and/or Cutting", qs: [
        [1, "Does the company have a deboning or cutting area?", "If no, please skip the next questions or mark the section N/A."],
        [2, "How many deboning lines or tables are present within the production area?", "Record the amount in the auditor comment."],
        [3, "Does the company handle any forbidden meats on any deboning/cutting lines or tables within the production area?", "Forbidden meats are porcine products. If yes, are these areas physically and sufficiently separated?"],
        [4, "Do any deboning/cutting lines or tables which handle Halal products also handle forbidden meats?", "Forbidden meats are porcine products. Handling forbidden meats on the same deboning/cutting lines or tables is forbidden."],
        [5, "Do any deboning/cutting lines or tables which handle Halal products also handle non-Halal meats?", "Non-Halal meats are permissible animals which are not Halal slaughtered (poultry, bovine, ovine etc.). Handling non-Halal meats on the same lines or tables is permitted under conditions. If yes, which meats?"],
        [6, "If question 5.2.5 is answered 'yes', do these cutting/deboning lines or tables ensure that no cross-contamination can occur?", "Example: by producing on separate days or different shifts or by cleaning the lines before or after Halal productions. If no, please explain."],
        [7, "Can the company ensure that the equipment and utensils within the deboning or cutting area are considered safe to be used to process Halal products?", "Utensils may be knives, gloves, clothing, temperature-checking devices, tables, or boxes. If no, please explain which equipment or utensil."],
        [8, "Are any cutting/deboning lines or tables dedicated for Halal products only?", "This means that no other types of products other than Halal products are handled and processed."],
        [9, "Are any cutting/deboning equipment or utensils dedicated for Halal products only?", "This means that no other types of products other than Halal products are handled and processed."]
      ]},
      { id: "5.3", title: "Processing Activity: Cooking", qs: [
        [1, "Does the company have a cooking area?", "If no, please skip the next questions or mark the section N/A."],
        [2, "How many cooking lines are present within the production area?", "Record the amount in the auditor comment."],
        [3, "Does the company cook any forbidden meats on any cooking lines within the production area?", "Forbidden meats are porcine products. If yes, are these areas physically and sufficiently separated?"],
        [4, "Do any cooking lines which cook Halal products also cook forbidden meats?", "Forbidden meats are porcine products. Cooking forbidden meats on the same cooking lines is forbidden."],
        [5, "Do any cooking lines which cook Halal products also cook non-Halal meats?", "Non-Halal meats are permissible animals which are not Halal slaughtered (poultry, bovine, ovine etc.). Cooking non-Halal meats on the same lines is permitted under conditions. If yes, which meats?"],
        [6, "If question 5.3.5 is answered 'yes', do these cooking lines ensure that no cross-contamination can occur?", "Example: by cooking on separate days or different shifts or by cleaning the lines before or after Halal productions. If no, please explain."],
        [7, "Can the company ensure that the equipment and utensils within the cooking area are considered safe to be used to cook Halal products?", "If no, please explain which equipment or utensil."],
        [8, "Are any cooking lines dedicated for Halal products only?", "This means that no other types of products other than Halal products are handled and processed."],
        [9, "Are any cooking equipment or utensils dedicated for Halal products only?"]
      ]},
      { id: "5.4", title: "Processing Activity: Drying or Aging", qs: [
        [1, "Does the company have a drying/aging area?", "If no, please skip the next questions or mark the section N/A."],
        [2, "How many drying/aging areas are present within the production area?", "Record the amount in the auditor comment."],
        [3, "Does the company dry/age any forbidden within the production area?", "Forbidden meats are porcine products. If yes, are these areas physically and sufficiently separated?"],
        [4, "Do any drying/aging areas which process Halal products also dry/age forbidden meats?", "Forbidden meats are porcine products. Drying/aging forbidden meats within the same chambers is forbidden."],
        [5, "Do any drying/aging areas which process Halal products also dry/age non-Halal meats?", "Non-Halal meats are permissible animals which are not Halal slaughtered. Drying/aging non-Halal meats within the same chambers is permitted under conditions. If yes, which meats?"],
        [6, "If question 5.4.5 is answered 'yes', do these areas ensure that no cross-contamination can occur?", "Example: by drying/aging on separate days or different shifts or by having multiple chambers. If no, please explain."],
        [7, "How long does the drying/aging process take to become an end product?", "Please describe the amount of days, weeks, or months in the auditor comment."],
        [8, "Are any drying/aging chambers dedicated for Halal products only?", "This means that no other types of products other than Halal products are handled and processed."],
        [9, "Are the dried/aged meats within the chambers packed (P) products?", "Answer 'No' if unpacked (UP) products."]
      ]},
      { id: "5.5", title: "Processing Activity: Filling and Casing", qs: [
        [1, "Does the company have a filling area?", "If no, please skip the next questions or mark the section N/A."],
        [2, "How many filling areas are present within the production area?", "Record the amount in the auditor comment."],
        [3, "Does the company use fillings or casings of forbidden meats within the production area?", "Forbidden meats and casings are derived from porcine products. If yes, are these areas physically and sufficiently separated?"],
        [4, "Do any filling lines which fill or case Halal products also fill or case forbidden meats?", "Filling/casing derived from any forbidden meats on the same filling lines is forbidden."],
        [5, "Do any filling lines which fill or case Halal products also fill non-Halal meats during different shifts?", "Processing fillings or casings of non-Halal meats on the same lines is permitted under conditions. If yes, which items?"],
        [6, "If question 5.5.5 is answered 'yes', do these lines ensure that no cross-contamination and mixing can occur and that physical separation is ensured?", "Example: if the filling is Halal but the casing is non-Halal, then a contamination has been established and vice versa. If no, please explain."],
        [7, "Can the company ensure that the equipment and utensils used for the lines are considered safe for creating Halal products and that physical separation is ensured?", "Example: any tumblers, grinders, or other helping tools must not be mixed or contaminated. If no, please explain which equipment or utensil."],
        [8, "Are any filling or casing lines dedicated for Halal products only?", "This means that no other types of products other than Halal products are handled and processed."],
        [9, "Are the meats, destined to be used as filling, Halal certified?", "If no, how is this safeguarded?"]
      ]},
      { id: "5.6", title: "Mixing", qs: [
        [1, "Does the company have a mixing area?", "If no, please skip the next questions or mark the section N/A."],
        [2, "How many mixing areas are present within the production area?", "Record the amount in the auditor comment."],
        [3, "Does the company mix forbidden meats within the production area?", "Forbidden meats are derived from porcine products. If yes, are these areas physically and sufficiently separated?"],
        [4, "Does mixing occur between Halal meats and non-Halal meats?", "Mixing Halal and non-Halal meats on the same line is not permissible to be sold as Halal."],
        [5, "Are equipment which mix meats ensured that cross-contamination cannot occur?", "Non-Halal meats are permissible animals which are not Halal slaughtered. When mixing non-Halal meats, the line may be cleaned to continue mixing Halal-only meats. If no, please explain."],
        [6, "Can the company ensure that the equipment and utensils used for mixing permissible meats are considered safe for creating Halal products?", "Example: any tumblers, grinders, or other helping tools must not be mixed or contaminated. If no, please explain."],
        [7, "Are any mixing lines or areas dedicated for Halal products only?", "This means that no other types of products other than Halal products are handled and processed."]
      ]}
    ]},
    { n: "6", title: "Cleaning Activities", sections: [
      { id: "6.1", title: "Cleaning Activities and Materials", qs: [
        [1, "Does the company have a documented procedure for its cleaning activities?"],
        [2, "Is the cleaning process conducted by a third party?", "If yes: which party and which area(s)?"],
        [3, "Is cleaning in place (CIP) used by the company?", "Other methods are a manual cleaning system or other. Specify in the auditor comment."],
        [4, "Are all cleaning materials stored and kept by the company itself?", "Alternatives: third party, mixed, or other. Specify in the auditor comment."],
        [5, "Are cleaning schedules fixed?", "Answer 'No' if schedules are flexible."],
        [6, "Does the company have all the specifications of its cleaning materials?"],
        [7, "Is (hot) water used as a cleaning material?", "Other materials may be chemicals, non-water materials, or others. Specify in the auditor comment."],
        [8, "Are any cleaning materials or agents Halal certified?", "If only some are certified, or certificates are in request, note this in the auditor comment."],
        [9, "Is ethanol used as a cleaning agent?"],
        [10, "Is the effectiveness of the cleaning activities ensured to remove traces of unclean materials on production lines and equipment?", "In case the production lines process non-Halal (but not forbidden) materials, the cleaning effectiveness should be verified by the company. The verification technique can be determined by the company or the auditor."]
      ]},
      { id: "6.2", title: "Cleaning of the Production Lines", qs: [
        [1, "Does the company have documented procedures on cleaning its production lines before or after production?"],
        [2, "Does the cleaning of the production line(s) ensure the removal of any unclean leftovers?", "Such as traces of non-Halal (but not forbidden) meats."],
        [3, "Does the company conduct testing on leftover materials after the cleaning process has ended?", "Example: swab test. If yes, which method?"],
        [4, "How often and when does cleaning of the production lines take place?", "Please describe in the auditor comment."],
        [5, "Is it ensured that cleaning the production lines has been conducted before a Halal production has started?"]
      ]},
      { id: "6.3", title: "Cleaning of Utensils & Equipment", qs: [
        [1, "Does the company have documented procedures on cleaning its utensils and equipment to avoid contamination?"],
        [2, "Does the cleaning of the utensils and equipment ensure the removal of any unclean leftovers?"],
        [3, "Does the company conduct testing on leftover materials after the cleaning process?", "Example: swab test. If yes, which method?"],
        [4, "Is it ensured that all boxes and transportation tools within the production area are cleaned and free from risk for contamination?"],
        [5, "Is it ensured that cleaning the equipment and utensils has been conducted before a Halal production has started?"]
      ]}
    ]},
    { n: "7", title: "Food Safety and Hazards", sections: [
      { id: "7", title: "Food Safety and Hazards", qs: [
        [1, "Does the company contract a third party to implement pest control activities?", "If yes, with whom?"],
        [2, "Has pest control been performed recently at the company?", "Record the date of the last pest control in the auditor comment."],
        [3, "Does the company have an HACCP plan implemented within the production facility?", "Record the date in the auditor comment."],
        [4, "Has the HACCP plan been tested or reviewed for its effectiveness?", "Record the date of the last test or review in the auditor comment."],
        [5, "Is there a washing and disinfection area for personnel and visitors before entering the production area?"],
        [6, "Are temperatures checked on incoming meat products?"],
        [7, "Are all cleaning materials and/or hazardous chemicals clearly labeled and stored separately from all edible materials?"],
        [8, "Does the company recycle its water system?"],
        [9, "Are there special boxes for meats which are destined for pet foods or for non-edible purposes?"],
        [10, "Is it ensured that the personnel can store its clothes, goods, and food safely away from the production area?"],
        [11, "Does the company provide an area where its personnel and visitors can have their meals during a break?"]
      ]}
    ]}
  ],
  docs: [
    ["Floor Plan of the production facility"],
    ["Specifications of the packaging materials"],
    ["Specifications of the cleaning materials"],
    ["Laboratory analysis results of 1-3 products to be Halal certified", "This may also be requested during the inspection."],
    ["Flow process charts of the products to be Halal certified"],
    ["List of products to be Halal certified", "Optional."],
    ["Completed Customer Questionnaire", "Refers to this questionnaire."],
    ["HACCP Plan of the company", "The existing HACCP plan which is already in place."],
    ["Food Safety Management Certificates with its Grade or Results mentioned"],
    ["A request for a Halal Training", "Needed for first-timers. Needed for the Halal Management Team which did not receive a Halal Training for over 2 years."],
    ["Halal Master Table", "This form is sent by Halal Quality Control in Excel format which mentions the products, suppliers, and products of the customer."]
  ]
}

};
