function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index').setTitle('Vehicle Description Generator');
}

function getVehicleDescription(
  vin,
  exteriorColor,
  interiorColor,
  mileage,
  features,
  dealershipName 
) {
  vin = vin.trim().toUpperCase();
  
  const template = "retail";

  // VIN validation
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
    return "Error. Please enter a valid 17 character VIN.";
  }

  try {
    const vinData = decodeVin(vin);

    if (!vinData.year || !vinData.make || !vinData.model) {
      return "Error. VIN could not be decoded.";
    }

    const description = buildVehicleDescription(
      vin,
      vinData,
      exteriorColor,
      interiorColor,
      mileage,
      features,
      template
    );

    // Fetch the specific dealership signature from the Sheet
    const dealershipSignature = getSignatureFromSheet(dealershipName);

    // Performance Auto Group signature
    const pagSignature = "Performance Auto Group's mission is to make car buying easy. We are passionate about innovating so that your experience in any of our 39 dealerships is quick and enjoyable. You’ll enjoy working with our friendly teams, who are always available to help you make an informed decision. Purchase confidently with our industry-leading transparency tools that provide unprecedented information about the history and condition of our cars. Drive with confidence knowing that we have the most rigorous inspection and reconditioning process in the country, handled by our team of factory-trained technicians. We invite you to experience the difference - at Performance Auto Group.";


    const formattedDescription = description.split('\n\n')
      .map(para => "<br>" + para.trim() + "<br>")
      .join('\n\n');

    const formattedDealershipSig = dealershipSignature ? "<br>" + dealershipSignature.trim() + "<br>" : "";
    const formattedPagSig = "<br>" + pagSignature.trim() + "<br>";

    // Combine everything into the final output
    const finalOutput = [
      "VIN: " + vin,
      formattedDescription,
      formattedDealershipSig,
      formattedPagSig
    ].filter(Boolean).join("\n\n");

    return finalOutput;

  } catch (e) {
    Logger.log(e);
    return "Error generating description. Please try again.";
  } 
}

function getSignatureFromSheet(dealershipName) {
  try {
    const ssId = "1BzpkpSaW78Jh2jDjvqE9nfVjA85t2Xnpu3znZiemVUo"; 
    const sheet = SpreadsheetApp.openById(ssId).getSheetByName("Signatures");
    const data = sheet.getDataRange().getValues();
    
    for (let i = 0; i < data.length; i++) {
      if (data[i][0] === dealershipName) {
        return data[i][1]; 
      }
    }
  } catch (err) {
    Logger.log("Signature Fetch Error: " + err);
  }
  return ""; 
}

function getDealershipNames() {
  try {
    const ssId = "1BzpkpSaW78Jh2jDjvqE9nfVjA85t2Xnpu3znZiemVUo";
    const ss = SpreadsheetApp.openById(ssId);
    const sheet = ss.getSheetByName("Signatures");
    
    if (!sheet) {
      Logger.log("Error: Sheet named 'Signatures' not found.");
      return ["Error: Sheet Not Found"];
    }

    const data = sheet.getDataRange().getValues();
    const names = data.slice(1)
      .map(row => row[0])
      .filter(name => name && name.toString().trim() !== "");
    
    if (names.length === 0) return ["No dealerships found"];

    return names.sort(); 
  } catch (err) {
    Logger.log("Critical Error: " + err.toString());
    return ["Error: Check Permissions/ID"];
  }
}

// VIN decoder 
function decodeVin(vin) {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(vin);

  if (cached) {
    return JSON.parse(cached);
  }

  const url = "https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/" + vin + "?format=json";

  const response = UrlFetchApp.fetch(url);
  const data = JSON.parse(response.getContentText());

  if (!data.Results || data.Results.length === 0) {
    return {};
  }

  const r = data.Results[0];

  const result = {
    year: r.ModelYear,
    make: r.Make,
    model: r.Model,
    series: r.Series || "",
    trim: r.Trim || "",
    body: r.BodyClass,
    drivetrain: r.DriveType,
    engine: r.EngineModel || r.EngineCylinders || "",
    fuel: r.FuelTypePrimary,
    transmission: r.TransmissionStyle || ""
  };

  cache.put(vin, JSON.stringify(result), 21600);
  return result;
}

// Gemini description builder 
function buildVehicleDescription(
  vin,
  vinData,
  exteriorColor,
  interiorColor,
  mileage,
  features,
  template
) {

  const CLOUD_FUNCTION_URL = "https://gemini-wrapper-769592788241.us-central1.run.app";
  const requestId = Utilities.getUuid();

  let toneRules =
    "Write in a professional dealership retail tone for Canadian buyers.\n" +
    "Confident, informative, and well structured.\n" +
    "Highlight performance, comfort, technology, and safety.\n" +
    "Use natural sales language without exaggeration.\n" +
    "You may describe common features typically included with this model or trim.\n" +
    "If trim is known, you may reference it directly.\n" +
    "If trim is unknown, avoid naming specific packages.\n";

  const prompt =
    "You are generating a short vehicle description.\n\n" +

    "Required information.\n" +
    "VIN: " + vin + "\n" +
    "Year: " + vinData.year + "\n" +
    "Make: " + vinData.make + "\n" +
    "Model: " + vinData.model + "\n" +
    "Exterior Color: " + exteriorColor + "\n" +
    "Mileage: " + mileage + "\n" +
    "Series: " + (vinData.series || "not specified") + "\n" +
    "Trim: " + (vinData.trim || "not specified") + "\n" +
    "Transmission: " + (vinData.transmission || "not specified") + "\n" +
    "Key Features: " + features + "\n\n" +

    "Optional information.\n" +
    "Interior Color: " + (interiorColor || "not specified") + "\n" +
    "Body Type: " + (vinData.body || "not specified") + "\n" +
    "Drivetrain: " + (vinData.drivetrain || "not specified") + "\n" +
    "Engine: " + (vinData.engine || "not specified") + "\n" +
    "Fuel Type: " + (vinData.fuel || "not specified") + "\n\n" +

    "Rules.\n" +
    toneRules +
    "Do not guess missing information.\n" +
    "If data is unavailable, say not specified.\n" +
    "CRITICAL: You must incorporate the provided Key Features within the first 100 words of the description.\n" +
    "Paragraph one. Strong feature driven opening sentence that highlights engine or performance, comfort features, and technology.\n" +
    "Paragraph two. Expanded details on powertrain, interior comfort, infotainment, and convenience features.\n" +
    "Paragraph three. Safety systems and overall value statement tailored to Canadian driving conditions.\n";

  const userEmail = Session.getActiveUser().getEmail() || "unknown";
  const payload = {
    requestId: requestId,
    userEmail: userEmail,
    prompt: prompt
  };

  const options = {
    method: "post",
    contentType: "application/json",
    headers: {
      Authorization: "Bearer " + ScriptApp.getOAuthToken()
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(CLOUD_FUNCTION_URL, options);
  const json = JSON.parse(response.getContentText());

  if (json.requestId !== requestId) {
    throw new Error("Request mismatch. Please retry.");
  }

  if (!json.text) {
    throw new Error("AI generation failed.");
  }

  return json.text
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
