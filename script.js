let userLat = null;
let userLon = null;

const headingDisplay = document.getElementById("heading-val");
const alphaDisplay = document.getElementById("val-alpha");
const betaDisplay = document.getElementById("val-beta");
const gammaDisplay = document.getElementById("val-gamma");
const startBtn = document.getElementById("start-btn");
const btnText = document.getElementById("btn-text");
const coordsResult = document.getElementById("coords-result");
const satResult = document.getElementById("sat-result");

/**
 * Fetches user coordinates (Latitude/Longitude) using the Nominatim API
 * based on the provided Zip, City, or Address.
 */
async function getCoordinates() {
  const query = document.getElementById("geo-input").value;
  if (!query) return alert("Please enter a location");
  coordsResult.innerText = "Searching...";
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
    );
    const data = await response.json();
    if (data && data.length > 0) {
      userLat = parseFloat(data[0].lat);
      userLon = parseFloat(data[0].lon);
      coordsResult.innerText = `Lat: ${userLat.toFixed(4)} | Lon: ${userLon.toFixed(4)}`;
    } else {
      coordsResult.innerText = "Location not found.";
    }
  } catch (error) {
    coordsResult.innerText = "Error fetching data.";
  }
}

/**
 * Calculates the Azimuth (compass direction) and Elevation (upward angle)
 * to a target geostationary satellite based on its longitude.
 */
function calculateSatellite() {
  const satLonInput = document.getElementById("sat-input").value;

  if (userLat === null || userLon === null) {
    return alert("Please complete Step 1 (Search Location) first.");
  }
  if (satLonInput === "") {
    return alert("Please enter the Satellite Longitude.");
  }

  const satLon = parseFloat(satLonInput);
  const R_EARTH = 6371.0;
  const R_SAT = 42164.0; // Orbital radius (altitude + Earth radius)

  const phi = userLat * (Math.PI / 180); // Convert Lat to radians
  const deltaL = (satLon - userLon) * (Math.PI / 180); // Longitude difference in radians

  // Elevation calculation
  const cosC = Math.cos(phi) * Math.cos(deltaL);
  const elevationRad = Math.atan(
    (cosC - R_EARTH / R_SAT) / Math.sqrt(1 - cosC * cosC),
  );
  const elevationDeg = elevationRad * (180 / Math.PI);

  // Azimuth calculation
  let azimuthDeg =
    180 + (180 / Math.PI) * Math.atan(Math.tan(deltaL) / Math.sin(phi));
  if (userLat < 0) azimuthDeg -= 180; // Adjustment for Southern Hemisphere

  satResult.innerHTML = `AZIMUTH: ${Math.round(azimuthDeg)}° <br> ELEVATION: ${Math.round(elevationDeg)}°`;
}

/**
 * Updates the compass heading and Alpha value based on device orientation.
 */
function handleCompass(event) {
  let heading = event.webkitCompassHeading || event.alpha || 0;
  const finalHeading = Math.round(heading) % 360;
  headingDisplay.innerText = finalHeading;
  alphaDisplay.innerText = finalHeading + "°";
}

/**
 * Updates Beta and Gamma values (tilt/pitch/roll) based on device motion.
 */
function handleTilt(event) {
  betaDisplay.innerText = Math.round(event.beta || 0) + "°";
  gammaDisplay.innerText = Math.round(event.gamma || 0) + "°";
}

/**
 * Requests permission for device sensors (iOS 13+) and starts listening
 * for orientation and motion events.
 */
async function initSensors() {
  startBtn.classList.add("active");
  btnText.innerText = "Sensors Active";
  startBtn.disabled = true;

  if (typeof DeviceOrientationEvent.requestPermission === "function") {
    try {
      const permission = await DeviceOrientationEvent.requestPermission();
      if (permission === "granted") {
        window.addEventListener("deviceorientation", (e) => {
          handleCompass(e);
          handleTilt(e);
        });
      }
    } catch (err) {
      console.error(err);
    }
  } else {
    window.addEventListener("deviceorientationabsolute", handleCompass, true);
    window.addEventListener("deviceorientation", handleTilt, true);
  }
}

startBtn.addEventListener("click", initSensors);

/**
 * Security/UX Check: Shows the desktop blocker if the app is accessed
 * from a desktop browser instead of a mobile device.
 */
window.onload = () => {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (!isMobile && window.innerWidth > 1024) {
    document.getElementById("desktop-blocker").style.display = "block";
    document.getElementById("main-content").style.display = "none";
  }
};
