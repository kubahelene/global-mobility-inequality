/* ---------------- BASIC SETUP ---------------- */

const map = L.map("map", {
    zoomControl: true,
    worldCopyJump: true,

    minZoom: 1.475,
    maxZoom: 6
});

map.setView([20, 0], 2);
const worldBounds = L.latLngBounds(
    L.latLng(-85, -180),
    L.latLng(85, 180)
);

map.setMaxBounds(worldBounds);
map.options.maxBoundsViscosity = 1.0;

if (window.innerWidth <= 768) {
    map.options.maxBoundsViscosity = 0;
    map.setMinZoom(0.8);
    map.setView([20, 0], 1.15);
}

const scoreField = "Henley_PassportScore — PassportIndex2026_passport_score";
const countryField = "Henley_PassportScore — PassportIndex2026_country";
const isoField = "ADM0_A3";

let currentMode = "score";
let currentView = "2d";

let geojsonLayer;
let visaAccessData = {};
let worldGeojsonData;

let globe;
let globeInitialized = false;
let globeSelectedPassport = null;
let globeHoveredIso = null;

let pinnedCountry = null;
let pinnedRegionalCountries = [];

const totalCountries = 195;

const mapDiv = document.getElementById("map");
const globeDiv = document.getElementById("globe");
const infoBox = document.getElementById("infoBox");
const distributionView = document.getElementById("distributionView");
const extremesView = document.getElementById("extremesView");

const scoreMode = document.getElementById("scoreMode");
const visaMode = document.getElementById("visaMode");
const ringsMode = document.getElementById("ringsMode");
const distributionMode = document.getElementById("distributionMode");
const extremesMode = document.getElementById("extremesMode");

const view2D = document.getElementById("view2D");
const view3D = document.getElementById("view3D");

const tooltip = document.getElementById("chartTooltip");
const ringLegend = document.getElementById("ringLegend");

const regionalRingLayer = L.layerGroup().addTo(map);

const regionRingColors = {
    Europe: "#345c9c",
    Asia: "#7c8a4a",
    Africa: "#d9a441",
    Americas: "#d9774e",
    Oceania: "#8c4f7d"
};

const regionGroups = {
    Europe: ["ALB","AND","AUT","BEL","BIH","BGR","BLR","CHE","CYP","CZE","DEU","DNK","ESP","EST","FIN","FRA","GBR","GRC","HRV","HUN","IRL","ISL","ITA","LIE","LTU","LUX","LVA","MCO","MDA","MLT","MNE","MKD","NLD","NOR","POL","PRT","ROU","RUS","SMR","SRB","SVK","SVN","SWE","UKR","VAT","XKX"],
    Asia: ["AFG","ARE","ARM","AZE","BGD","BHR","BRN","BTN","CHN","GEO","HKG","IDN","IND","IRN","IRQ","ISR","JOR","JPN","KAZ","KGZ","KHM","KOR","KWT","LAO","LBN","LKA","MAC","MDV","MMR","MNG","MYS","NPL","OMN","PAK","PHL","PRK","PSE","QAT","SAU","SGP","SYR","THA","TJK","TKM","TLS","TUR","TWN","UZB","VNM","YEM"],
    Africa: ["AGO","BDI","BEN","BFA","BWA","CAF","CIV","CMR","COD","COG","COM","CPV","DJI","DZA","EGY","ERI","ETH","GAB","GHA","GIN","GMB","GNB","GNQ","KEN","LBR","LBY","LSO","MAR","MDG","MLI","MOZ","MRT","MUS","MWI","NAM","NER","NGA","RWA","SDN","SEN","SLE","SOM","SSD","STP","SWZ","SYC","TCD","TGO","TUN","TZA","UGA","ZAF","ZMB","ZWE"],
    Americas: ["ARG","ATG","BHS","BLZ","BOL","BRA","BRB","CAN","CHL","COL","CRI","CUB","DMA","DOM","ECU","GRD","GTM","GUY","HND","HTI","JAM","KNA","LCA","MEX","NIC","PAN","PER","PRY","SLV","SUR","TTO","URY","USA","VCT","VEN"],
    Oceania: ["AUS","FJI","FSM","KIR","MHL","NRU","NZL","PLW","PNG","SLB","TON","TUV","VUT","WSM"]
};

const countryNameByIso = {
    ABW: "Aruba",
    AFG: "Afghanistan",
    AGO: "Angola",
    AIA: "Anguilla",
    ALB: "Albania",
    AND: "Andorra",
    ARE: "United Arab Emirates",
    ARG: "Argentina",
    ARM: "Armenia",
    ASM: "American Samoa",
    ATG: "Antigua and Barbuda",
    AUS: "Australia",
    AUT: "Austria",
    AZE: "Azerbaijan",
    BDI: "Burundi",
    BEL: "Belgium",
    BEN: "Benin",
    BES: "Caribbean Netherlands",
    BFA: "Burkina Faso",
    BGD: "Bangladesh",
    BGR: "Bulgaria",
    BHR: "Bahrain",
    BHS: "Bahamas",
    BIH: "Bosnia and Herzegovina",
    BLR: "Belarus",
    BLZ: "Belize",
    BMU: "Bermuda",
    BOL: "Bolivia",
    BRA: "Brazil",
    BRB: "Barbados",
    BRN: "Brunei",
    BTN: "Bhutan",
    BWA: "Botswana",
    CAF: "Central African Republic",
    CAN: "Canada",
    CHE: "Switzerland",
    CHL: "Chile",
    CHN: "China",
    CIV: "Côte d'Ivoire",
    CMR: "Cameroon",
    COD: "DR Congo",
    COG: "Republic of the Congo",
    COK: "Cook Islands",
    COL: "Colombia",
    COM: "Comoros",
    CPV: "Cabo Verde",
    CRI: "Costa Rica",
    CUB: "Cuba",
    CUW: "Curaçao",
    CYM: "Cayman Islands",
    CYP: "Cyprus",
    CZE: "Czechia",
    DEU: "Germany",
    DJI: "Djibouti",
    DMA: "Dominica",
    DNK: "Denmark",
    DOM: "Dominican Republic",
    DZA: "Algeria",
    ECU: "Ecuador",
    EGY: "Egypt",
    ERI: "Eritrea",
    ESP: "Spain",
    EST: "Estonia",
    ETH: "Ethiopia",
    FIN: "Finland",
    FJI: "Fiji",
    FLK: "Falkland Islands",
    FRA: "France",
    FRO: "Faroe Islands",
    FSM: "Micronesia",
    GAB: "Gabon",
    GBR: "United Kingdom",
    GEO: "Georgia",
    GHA: "Ghana",
    GIB: "Gibraltar",
    GIN: "Guinea",
    GLP: "Guadeloupe",
    GMB: "Gambia",
    GNB: "Guinea-Bissau",
    GNQ: "Equatorial Guinea",
    GRC: "Greece",
    GRD: "Grenada",
    GRL: "Greenland",
    GTM: "Guatemala",
    GUF: "French Guiana",
    GUM: "Guam",
    GUY: "Guyana",
    HKG: "Hong Kong",
    HND: "Honduras",
    HRV: "Croatia",
    HTI: "Haiti",
    HUN: "Hungary",
    IDN: "Indonesia",
    IND: "India",
    IRL: "Ireland",
    IRN: "Iran",
    IRQ: "Iraq",
    ISL: "Iceland",
    ISR: "Israel",
    ITA: "Italy",
    JAM: "Jamaica",
    JOR: "Jordan",
    JPN: "Japan",
    KAZ: "Kazakhstan",
    KEN: "Kenya",
    KGZ: "Kyrgyzstan",
    KHM: "Cambodia",
    KIR: "Kiribati",
    KNA: "Saint Kitts and Nevis",
    KOR: "South Korea",
    KWT: "Kuwait",
    LAO: "Laos",
    LBN: "Lebanon",
    LBR: "Liberia",
    LBY: "Libya",
    LCA: "Saint Lucia",
    LIE: "Liechtenstein",
    LKA: "Sri Lanka",
    LSO: "Lesotho",
    LTU: "Lithuania",
    LUX: "Luxembourg",
    LVA: "Latvia",
    MAC: "Macao",
    MAR: "Morocco",
    MCO: "Monaco",
    MDA: "Moldova",
    MDG: "Madagascar",
    MDV: "Maldives",
    MEX: "Mexico",
    MHL: "Marshall Islands",
    MKD: "North Macedonia",
    MLI: "Mali",
    MLT: "Malta",
    MMR: "Myanmar",
    MNE: "Montenegro",
    MNG: "Mongolia",
    MNP: "Northern Mariana Islands",
    MOZ: "Mozambique",
    MRT: "Mauritania",
    MSR: "Montserrat",
    MUS: "Mauritius",
    MWI: "Malawi",
    MYS: "Malaysia",
    MYT: "Mayotte",
    NAM: "Namibia",
    NCL: "New Caledonia",
    NER: "Niger",
    NGA: "Nigeria",
    NIC: "Nicaragua",
    NIU: "Niue",
    NLD: "Netherlands",
    NOR: "Norway",
    NPL: "Nepal",
    NRU: "Nauru",
    NZL: "New Zealand",
    OMN: "Oman",
    PAK: "Pakistan",
    PAN: "Panama",
    PER: "Peru",
    PHL: "Philippines",
    PLW: "Palau",
    PNG: "Papua New Guinea",
    POL: "Poland",
    PRI: "Puerto Rico",
    PRK: "North Korea",
    PRT: "Portugal",
    PRY: "Paraguay",
    PSE: "Palestine",
    PYF: "French Polynesia",
    QAT: "Qatar",
    REU: "Réunion",
    ROU: "Romania",
    RUS: "Russia",
    RWA: "Rwanda",
    SAU: "Saudi Arabia",
    SDN: "Sudan",
    SEN: "Senegal",
    SGP: "Singapore",
    SHN: "Saint Helena",
    SLB: "Solomon Islands",
    SLE: "Sierra Leone",
    SLV: "El Salvador",
    SMR: "San Marino",
    SOM: "Somalia",
    SRB: "Serbia",
    SSD: "South Sudan",
    STP: "São Tomé and Príncipe",
    SUR: "Suriname",
    SVK: "Slovakia",
    SVN: "Slovenia",
    SWE: "Sweden",
    SWZ: "Eswatini",
    SXM: "Sint Maarten",
    SYC: "Seychelles",
    SYR: "Syria",
    TCA: "Turks and Caicos Islands",
    TCD: "Chad",
    TGO: "Togo",
    THA: "Thailand",
    TJK: "Tajikistan",
    TKM: "Turkmenistan",
    TLS: "Timor-Leste",
    TON: "Tonga",
    TTO: "Trinidad and Tobago",
    TUN: "Tunisia",
    TUR: "Türkiye",
    TUV: "Tuvalu",
    TWN: "Taiwan",
    TZA: "Tanzania",
    UGA: "Uganda",
    UKR: "Ukraine",
    URY: "Uruguay",
    USA: "United States",
    UZB: "Uzbekistan",
    VAT: "Vatican City",
    VCT: "Saint Vincent and the Grenadines",
    VEN: "Venezuela",
    VGB: "British Virgin Islands",
    VIR: "U.S. Virgin Islands",
    VNM: "Vietnam",
    VUT: "Vanuatu",
    WSM: "Samoa",
    XKX: "Kosovo",
    YEM: "Yemen",
    ZAF: "South Africa",
    ZMB: "Zambia",
    ZWE: "Zimbabwe"
};

/* ---------------- HELPERS ---------------- */

function activateButton(activeButton) {
    [scoreMode, visaMode, ringsMode, distributionMode, extremesMode].forEach(button => {
        if (button) button.classList.remove("active");
    });

    if (activeButton) activeButton.classList.add("active");
}

function activateViewButton(activeView) {
    if (view2D) view2D.classList.remove("active");
    if (view3D) view3D.classList.remove("active");
    if (activeView) activeView.classList.add("active");
}

function allow3DView() {
    if (view3D) view3D.classList.remove("disabled");
}

function clearRegionalRings() {
    regionalRingLayer.clearLayers();

    if (ringLegend) {
        ringLegend.classList.add("hidden");
    }
}

function updateLegendVisibility() {
    if (currentMode === "score" && currentView === "2d") {
        document.body.classList.add("score-legend-active");
    } else {
        document.body.classList.remove("score-legend-active");
    }
}

function hidePassportLegend() {
    document.body.classList.remove("score-legend-active");
}

function getColor(score) {
    if (score === null || score === undefined || isNaN(score)) return "#d9d9d9";

    return score >= 170 ? "#465a39" :
           score >= 145 ? "#7c8a4a" :
           score >= 120 ? "#b5bc76" :
           score >= 85  ? "#ccc4a9" :
           score >= 65  ? "#e9b37e" :
           score >= 45  ? "#d9774e" :
                           "#c2512f";
}

function getMobilityTier(score) {
    if (score >= 170) return "Very High";
    if (score >= 145) return "High";
    if (score >= 120) return "Upper Medium";
    if (score >= 85) return "Medium";
    if (score >= 65) return "Lower Medium";
    if (score >= 45) return "Low";
    return "Very Low";
}

function getCountry(feature) {
    return feature.properties[countryField] ||
           feature.properties.ADMIN ||
           feature.properties.NAME ||
           feature.properties.name ||
           "Unknown";
}

function getIso(feature) {
    return feature.properties[isoField] ||
           feature.properties.ISO_A3 ||
           feature.properties.iso_a3 ||
           feature.properties.ADM0_A3;
}

function getScore(feature) {
    const country = getCountry(feature);

    if (country === "Antarctica") return null;

    const raw = feature.properties[scoreField];
    const number = Number(raw);

    if (raw === null || raw === undefined || raw === "" || isNaN(number)) return null;

    return number;
}

/* ---------------- 2D STYLES ---------------- */

function baseStyle(feature) {
    return {
        fillColor: getColor(getScore(feature)),
        weight: 0.3,
        opacity: 1,
        color: "#f7f7f7",
        fillOpacity: 1
    };
}

function visaNeutralStyle() {
    return {
        fillColor: "#d3cdbc",
        weight: 0.3,
        opacity: 1,
        color: "#f7f7f7",
        fillOpacity: 1
    };
}

function regionalNeutralStyle() {
    return {
        fillColor: "#d3cdbc",
        weight: 0.3,
        opacity: 1,
        color: "#f7f7f7",
        fillOpacity: 1
    };
}

/* ---------------- REGIONAL ACCESSIBILITY ---------------- */

function calculateRegionCounts(visaFreeCountries) {
    const regionCounts = {
        Europe: 0,
        Asia: 0,
        Africa: 0,
        Americas: 0,
        Oceania: 0
    };

    if (!Array.isArray(visaFreeCountries)) return regionCounts;

    visaFreeCountries.forEach(iso => {
        Object.keys(regionGroups).forEach(region => {
            if (regionGroups[region].includes(iso)) {
                regionCounts[region]++;
            }
        });
    });

    return regionCounts;
}

function clearRegionalRings() {
    regionalRingLayer.clearLayers();
}

function drawRegionalAccessibilityRings() {
    regionalRingLayer.clearLayers();
}

function drawRegionalAccessibilityRingsForCountry(iso, layer, keepExisting = false) {
    if (!geojsonLayer || !regionalRingLayer) return;

    if (!keepExisting) {
        regionalRingLayer.clearLayers();
    }

    const visaFreeCountries = visaAccessData[iso];
    if (!visaFreeCountries) return;

    const center = getBetterRingCenter(iso, layer);
    const counts = calculateRegionCounts(visaFreeCountries);

    const rings = Object.keys(regionRingColors)
        .map(region => {
            const value = counts[region];
            const total = regionGroups[region].length;
            const ratio = total > 0 ? value / total : 0;

            return { region, value, total, ratio };
        })
        .filter(item => item.value > 0)
        .sort((a, b) => a.ratio - b.ratio);

    let currentRadius = 6;

    rings.forEach(item => {
        const thickness = Math.max(5, item.ratio * 28);
        currentRadius += thickness;
        item.outerRadius = currentRadius;
    });

    rings
        .slice()
        .sort((a, b) => b.outerRadius - a.outerRadius)
        .forEach(item => {
            L.circleMarker(center, {
                radius: item.outerRadius,
                color: "#f7f7f7",
                weight: 0.9,
                opacity: 0.95,
                fillColor: regionRingColors[item.region],
                fillOpacity: 0.35,
                interactive: false
            }).addTo(regionalRingLayer);
        });
}

function getBetterRingCenter(iso, layer) {
    const customCenters = {
        USA: [39.5, -98.35],
        CAN: [56.13, -106.35],
        RUS: [61.5, 90.0],
        AUS: [-25.27, 133.77],
        BRA: [-14.24, -51.93],
        CHN: [35.86, 104.19],
        IND: [20.59, 78.96],
        IDN: [-2.5, 118.0],
        JPN: [36.2, 138.25],
        NZL: [-41.0, 174.0],
        PRT: [39.6, -8.0],
        ESP: [40.4, -3.7],
        FRA: [46.6, 2.2],
        GBR: [54.5, -2.5],
        NLD: [52.1, 5.3],
        DNK: [56.0, 10.0],
        NOR: [61.0, 8.0],
        ISL: [64.96, -19.02],
        IRL: [53.4, -8.2],
        CUB: [21.52, -77.78],
        DOM: [18.9, -70.1],
        HTI: [19.0, -72.3],
        JAM: [18.1, -77.3],
        FJI: [-17.7, 178.1],
        PNG: [-6.3, 145.0],
        PHL: [12.8, 122.7],
        MYS: [4.2, 101.9],
        BRN: [4.5, 114.7],
        SGP: [1.35, 103.82],
        MDV: [3.2, 73.2],
        MUS: [-20.2, 57.5],
        SYC: [-4.6, 55.45],
        COM: [-11.8, 43.3],
        CPV: [16.0, -24.0],
        STP: [0.3, 6.7],
        MHL: [7.1, 171.2],
        FSM: [6.9, 158.2],
        PLW: [7.5, 134.6],
        KIR: [1.9, -157.4],
        TUV: [-7.1, 177.7],
        NRU: [-0.52, 166.93],
        WSM: [-13.75, -172.1],
        TON: [-21.2, -175.2],
        VUT: [-15.4, 166.9],
        SLB: [-9.6, 160.2]
    };

    if (customCenters[iso]) {
        return L.latLng(customCenters[iso][0], customCenters[iso][1]);
    }

    return layer.getBounds().getCenter();
}

function formatRegionalValue(regionCounts, region) {
    const value = regionCounts[region];
    const total = regionGroups[region].length;
    const percent = Math.round((value / total) * 100);

    return value + " / " + total + " (" + percent + "%)";
}

function buildRegionalInfoHTML(iso, country, removable = false) {
    const visaFreeCountries = visaAccessData[iso];

    if (!visaFreeCountries) {
        return (
            "<div class='regional-card'>" +
                "<strong>" + country + "</strong><br>" +
                "No regional accessibility data available." +
            "</div>"
        );
    }

    const regionCounts = calculateRegionCounts(visaFreeCountries);

    return (
        "<div class='regional-card'>" +
            "<div class='regional-card-header'>" +
                "<strong>" + country + "</strong>" +
                (removable ? "<button class='regional-remove' onclick='removePinnedRegionalCountry(\"" + iso + "\")'>×</button>" : "") +
            "</div>" +

            "<div class='regional-subtitle'>Visa-free destinations by region</div>" +

            "<div class='region-grid'>" +
                "<div><span class='legend-dot africa'></span>Africa: " + formatRegionalValue(regionCounts, "Africa") + "</div>" +
                "<div><span class='legend-dot europe'></span>Europe: " + formatRegionalValue(regionCounts, "Europe") + "</div>" +
                "<div><span class='legend-dot americas'></span>Americas: " + formatRegionalValue(regionCounts, "Americas") + "</div>" +
                "<div><span class='legend-dot oceania'></span>Oceania: " + formatRegionalValue(regionCounts, "Oceania") + "</div>" +
                "<div><span class='legend-dot asia'></span>Asia: " + formatRegionalValue(regionCounts, "Asia") + "</div>" +
            "</div>" +
        "</div>"
    );
}

function showRegionalAccessibilityInfo(iso, country) {
    infoBox.classList.add("compact", "wide");
    infoBox.innerHTML = buildRegionalInfoHTML(iso, country, false);
}

function renderPinnedRegionalComparison() {
    clearRegionalRings();

    if (pinnedRegionalCountries.length === 0) {
        setRegionalDefaultInfo();
        return;
    }

    pinnedRegionalCountries.forEach(item => {
        drawRegionalAccessibilityRingsForCountry(item.iso, item.layer, true);
    });

    infoBox.classList.add("compact", "wide");

    infoBox.innerHTML =
        "<strong>Regional comparison</strong><br>" +
        "<span class='region-caption'>Up to three selected passports</span>" +
        "<div style='height:8px;'></div>" +
        pinnedRegionalCountries
            .map(item => buildRegionalInfoHTML(item.iso, item.country, true))
            .join("");
}

function removePinnedRegionalCountry(iso) {
    pinnedRegionalCountries = pinnedRegionalCountries.filter(item => item.iso !== iso);
    renderPinnedRegionalComparison();
}

function setRegionalDefaultInfo() {
    infoBox.classList.remove("compact", "wide");

    infoBox.innerHTML =
        "<strong>Regional Accessibility</strong><br>" +
        "Hover over a country to see its visa-free destinations by continent and select up to three countries for comparison.";
}

/* ---------------- VIEW HANDLING ---------------- */

function showMapView(activeButton) {
    distributionView.classList.add("hidden");
    extremesView.classList.add("hidden");

    infoBox.style.display = "block";

    activateButton(activeButton);

    if (currentView === "2d") {
        document.body.classList.remove("globe-active");
        mapDiv.style.display = "block";
        globeDiv.style.display = "none";

        updateLegendVisibility();

        setTimeout(() => map.invalidateSize(), 100);
    }

    if (currentView === "3d") {
        document.body.classList.add("globe-active");
        mapDiv.style.setProperty("display", "none", "important");
        globeDiv.style.setProperty("display", "block", "important");

        hidePassportLegend();

        setTimeout(() => {
            updateGlobeMode();
            resizeGlobe();
        }, 200);
    }
}

function showChartView(view, activeButton) {
    document.body.classList.remove("globe-active");

    mapDiv.style.display = "none";
    globeDiv.style.display = "none";

    distributionView.classList.add("hidden");
    extremesView.classList.add("hidden");

    view.classList.remove("hidden");
    infoBox.style.display = "none";

    hidePassportLegend();

    clearRegionalRings();
    activateButton(activeButton);
}

/* ---------------- MODES ---------------- */

function setScoreMode() {
    allow3DView();

    currentMode = "score";
    globeHoveredIso = null;
    globeSelectedPassport = null;
    pinnedCountry = null;

    clearRegionalRings();
    showMapView(scoreMode);
    updateLegendVisibility();

    infoBox.classList.remove("compact", "wide");   
    
    infoBox.innerHTML =
        "<strong>Passport Strength</strong><br>Hover over a country to see its passport score.";

    if (currentView === "2d" && geojsonLayer) {
        geojsonLayer.setStyle(baseStyle);
        map.closePopup();
    }

    if (currentView === "3d") {
        hidePassportLegend();
        updateGlobeMode();
    }
}

function setVisaMode() {
    allow3DView();

    currentMode = "visa";
    globeHoveredIso = null;
    globeSelectedPassport = null;
    pinnedCountry = null;

    clearRegionalRings();
    showMapView(visaMode);
    updateLegendVisibility();

    infoBox.classList.remove("compact", "wide");

    infoBox.innerHTML =
        "<strong>Visa-Free Access</strong><br>Hover over a country to see its visa-free access.";

    if (currentView === "2d" && geojsonLayer) {
        geojsonLayer.setStyle(visaNeutralStyle);
        map.closePopup();
    }

    if (currentView === "3d") {
        hidePassportLegend();
        updateGlobeMode();
    }
}

function setRegionalAccessibilityMode() {
    currentView = "2d";
    currentMode = "regional";

    pinnedCountry = null;
    pinnedRegionalCountries = [];

    activateViewButton(view2D);

    if (view3D) {
        view3D.classList.add("disabled");
    }

    document.body.classList.remove("globe-active");

    mapDiv.style.display = "block";
    globeDiv.style.display = "none";

    clearRegionalRings();
    showMapView(ringsMode);
    hidePassportLegend();

    if (ringLegend) {
        ringLegend.classList.add("hidden");
    }

    setRegionalDefaultInfo();

    if (geojsonLayer) {
        geojsonLayer.setStyle(regionalNeutralStyle);
        map.closePopup();
    }

    setTimeout(() => {
        map.invalidateSize();
    }, 100);
}

/* ---------------- VISA ACCESS 2D ---------------- */

function resetVisaModeView() {
    if (!geojsonLayer) return;

    geojsonLayer.setStyle(visaNeutralStyle);

    infoBox.classList.remove("compact", "wide");

    infoBox.innerHTML =
        "<strong>Visa-Free Access</strong><br>Hover over a country to see its visa-free access.";
}

function showVisaAccess(passportIso) {
    if (!geojsonLayer) return;

    const visaFreeCountries = visaAccessData[passportIso];

    if (!visaFreeCountries) {
        resetVisaModeView();

        infoBox.innerHTML =
            "<strong>Visa-Free Access</strong><br>No prototype data available for this passport.<br><br>" +
            "Available: Germany, Austria, Singapore, UAE, USA, Brazil, Ukraine, China, Nigeria, Iran, Afghanistan, Yemen.";
        return;
    }

    geojsonLayer.eachLayer(layer => {
        const feature = layer.feature;
        const iso = getIso(feature);

        if (iso === passportIso) {
            layer.setStyle({
                fillColor: "#1d2a18",
                weight: 1.6,
                color: "#111111",
                fillOpacity: 1
            });
        } else if (visaFreeCountries.includes(iso)) {
            layer.setStyle({
                fillColor: "#7c8a4a",
                weight: 0.35,
                color: "#f7f7f7",
                fillOpacity: 1
            });
        } else {
            layer.setStyle({
                fillColor: "#d4cebf",
                weight: 0.3,
                color: "#f7f7f7",
                fillOpacity: 1
            });
        }
    });

    const accessPercent = Math.round((visaFreeCountries.length / totalCountries) * 100);
    const regionCounts = calculateRegionCounts(visaFreeCountries);
    const countryName = countryNameByIso[passportIso] || passportIso;

    infoBox.classList.add("compact");

    infoBox.innerHTML =
    "<strong style='display:block;margin-bottom:0;'>" + countryName + "</strong>" +
    "Visa-free destinations: " + visaFreeCountries.length + "<br>" +
    "Global access: " + accessPercent + "%" +

    "<div style='height:8px;'></div>" +

    "<strong>Regional distribution</strong><br>" +
    "<span class='region-caption'>Countries accessible visa-free</span>" +

    "<div class='region-grid'>" +
        "<div>Africa: " + regionCounts.Africa + "</div>" +
        "<div>Europe: " + regionCounts.Europe + "</div>" +

        "<div>Americas: " + regionCounts.Americas + "</div>" +
        "<div>Oceania: " + regionCounts.Oceania + "</div>" +

        "<div>Asia: " + regionCounts.Asia + "</div>" +
    "</div>";
}

/* ---------------- 3D GLOBE ---------------- */

function getGlobePolygonColor(feature) {
    const iso = getIso(feature);
    const score = getScore(feature);

    if (currentMode === "score") {
        if (iso === globeHoveredIso) return "#1d2a18";
        return getColor(score);
    }

    if (currentMode === "visa") {
        if (!globeSelectedPassport) {
            if (iso === globeHoveredIso && visaAccessData[iso]) return "#1d2a18";
            return "#e5e1d5";
        }

        const visaFreeCountries = visaAccessData[globeSelectedPassport];

        if (!visaFreeCountries) return "#e5e1d5";
        if (iso === globeSelectedPassport) return "#1d2a18";
        if (visaFreeCountries.includes(iso)) return "#7c8a4a";
        if (iso === globeHoveredIso) return "#d8d2bf";

        return "#e5e1d5";
    }

    return "#e5e1d5";
}

function getGlobePolygonAltitude(feature) {
    const iso = getIso(feature);

    if (currentMode === "score") {
        return iso === globeHoveredIso ? 0.018 : 0.006;
    }

    if (currentMode === "visa") {
        if (iso === globeSelectedPassport) return 0.022;

        const visaFreeCountries = visaAccessData[globeSelectedPassport];

        if (visaFreeCountries && visaFreeCountries.includes(iso)) return 0.014;
        if (iso === globeHoveredIso) return 0.012;

        return 0.004;
    }

    return 0.004;
}

function getGlobePolygonStrokeColor(feature) {
    const iso = getIso(feature);

    if (iso === globeHoveredIso || iso === globeSelectedPassport) {
        return "rgba(20,20,20,0.95)";
    }

    return "rgba(255,255,255,0.85)";
}

function showGlobeScoreInfo(feature) {
    const country = getCountry(feature);
    const score = getScore(feature);

    infoBox.classList.add("compact");

    if (score === null || score === undefined || isNaN(score)) {
        infoBox.innerHTML =
            "<strong style='display:block;margin-bottom:0;'>" + country + "</strong>" +
            "No separate passport ranking";
        return;
    }

    const accessPercent = Math.round((score / totalCountries) * 100);
    const mobilityTier = getMobilityTier(score);

    infoBox.innerHTML =
        "<strong style='display:block;margin-bottom:0;'>" + country + "</strong>" +
        "Passport score: " + score + "<br>" +
        "Global access: " + accessPercent + "%" +
        "<div style='height:8px;'></div>" +
        "<strong>Mobility tier</strong><br>" +
        mobilityTier;
}

function showGlobeVisaInfo(feature) {
    const iso = getIso(feature);
    const country = getCountry(feature);
    const visaFreeCountries = visaAccessData[iso];

    globeSelectedPassport = iso;

    if (!visaFreeCountries) {
        infoBox.innerHTML =
            "<strong>" + country + "</strong><br>" +
            "No prototype data available for this passport.<br><br>" +
            "Available: Afghanistan, Austria, Brazil, China, Germany, Iran, Nigeria, Singapore, UAE, Ukraine, USA and Yemen.";
        refreshGlobe();
        return;
    }

    const accessPercent = Math.round((visaFreeCountries.length / totalCountries) * 100);
    const regionCounts = calculateRegionCounts(visaFreeCountries);

    infoBox.innerHTML =
        "<strong>Regional distribution</strong><br>" +
        "<span class='region-caption'>Countries accessible visa-free</span>" +
        "<div class='region-grid'>" +
        "<div>Africa: " + regionCounts.Africa + "</div>" +
        "<div>Europe: " + regionCounts.Europe + "</div>" +
        "<div>Americas: " + regionCounts.Americas + "</div>" +
        "<div>Oceania: " + regionCounts.Oceania + "</div>" +
        "<div>Asia: " + regionCounts.Asia + "</div>" +

"</div>";

    refreshGlobe();
}

function initGlobe() {
    console.log("INIT GLOBE FIXED");

    hidePassportLegend();

    if (typeof Globe === "undefined") {
        infoBox.innerHTML =
            "<strong>3D Globe Error</strong><br>Globe.gl library did not load.";
        return;
    }

    if (!worldGeojsonData || !worldGeojsonData.features) {
        infoBox.innerHTML =
            "<strong>3D Globe Error</strong><br>GeoJSON data is not loaded.";
        return;
    }

    globeDiv.innerHTML = "";
    globeDiv.style.display = "block";
    globeDiv.style.position = "fixed";
    globeDiv.style.top = "88px";
    globeDiv.style.left = "0";
    globeDiv.style.width = "100vw";
    globeDiv.style.height = "calc(100vh - 88px)";
    globeDiv.style.zIndex = "50";
    globeDiv.style.background = "#e3eef8";

    mapDiv.style.display = "none";
    document.body.classList.add("globe-active");

    globe = Globe()(globeDiv);

    globe
        .width(window.innerWidth)
        .height(window.innerHeight - 88)
        .backgroundColor("#e3eef8")
        .showAtmosphere(false)
        .showGlobe(true)
        .globeImageUrl("https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg")
        .polygonsData(worldGeojsonData.features)
        .polygonCapColor(feature => getGlobePolygonColor(feature))
        .polygonSideColor(() => "rgba(80,80,80,0.25)")
        .polygonStrokeColor(feature => getGlobePolygonStrokeColor(feature))
        .polygonAltitude(feature => getGlobePolygonAltitude(feature))
        .onPolygonHover(feature => {
            globeHoveredIso = feature ? getIso(feature) : null;

            if (feature && currentMode === "score") {
                showGlobeScoreInfo(feature);
            }

            refreshGlobe();
        })
        .onPolygonClick(feature => {
            if (!feature) return;

            if (currentMode === "score") {
                showGlobeScoreInfo(feature);
            }

            if (currentMode === "visa") {
                showGlobeVisaInfo(feature);
            }
        });

    globeInitialized = true;

    setTimeout(() => {
        resizeGlobe();

        globe.pointOfView({
            lat: 20,
            lng: 10,
            altitude: 2.4
        }, 0);

        refreshGlobe();
    }, 500);
}

function refreshGlobe() {
    if (!globe || !worldGeojsonData) return;

    globe
        .polygonCapColor(feature => getGlobePolygonColor(feature))
        .polygonStrokeColor(feature => getGlobePolygonStrokeColor(feature))
        .polygonAltitude(feature => getGlobePolygonAltitude(feature));
}

function resizeGlobe() {
    if (!globe) return;

    globe
        .width(window.innerWidth)
        .height(window.innerHeight - 88);
}

function updateGlobeMode() {
    hidePassportLegend();

    if (!worldGeojsonData) {
        infoBox.innerHTML =
            "<strong>3D Globe</strong><br>GeoJSON data is not loaded yet.";
        return;
    }

    document.body.classList.add("globe-active");

    mapDiv.style.display = "none";
    globeDiv.style.display = "block";

    if (!globeInitialized) {
        initGlobe();
    }

    globeHoveredIso = null;
    globeSelectedPassport = null;

    if (currentMode === "score") {
        infoBox.innerHTML =
            "<strong>3D Passport Strength</strong><br>" +
            "Hover over a country to see its passport score.";
    }

    if (currentMode === "visa") {
        infoBox.innerHTML =
            "<strong>3D Visa-Free Access</strong><br>" +
            "Hover over Afghanistan, Austria, Brazil, China, Germany, Iran, Nigeria, Singapore, UAE, Ukraine, USA or Yemen";
    }

    setTimeout(() => {
        resizeGlobe();
        refreshGlobe();
    }, 100);
}

/* ---------------- CHARTS ---------------- */

function showTooltip(event, html) {
    tooltip.innerHTML = html;
    tooltip.classList.remove("hidden");
    tooltip.style.left = event.clientX + 14 + "px";
    tooltip.style.top = event.clientY + 14 + "px";
}

function hideTooltip() {
    tooltip.classList.add("hidden");
}

function attachTooltip(element, html) {
    element.addEventListener("mousemove", event => showTooltip(event, html));
    element.addEventListener("mouseleave", hideTooltip);
}

function createDistributionBar(value, className) {
    const bar = document.createElement("div");
    bar.className = "bar " + className;
    bar.style.width = (value / 200 * 100) + "%";
    return bar;
}

function renderDistributionChart() {
    const chart = document.getElementById("distributionChart");
    if (!chart) return;

    const data = [
        { region: "Africa", min: 32, minCountry: "Somalia", median: 55, medianCountry: "Madagascar", max: 154, maxCountry: "Seychelles" },
        { region: "Asia", min: 23, minCountry: "Afghanistan", median: 65, medianCountry: "Philippines", max: 192, maxCountry: "Singapore" },
        { region: "Europe", min: 77, minCountry: "Belarus", median: 182, medianCountry: "Slovakia", max: 186, maxCountry: "Sweden" },
        { region: "North America", min: 156, minCountry: "Mexico", median: 168, medianCountry: "Bahamas", max: 182, maxCountry: "Canada" },
        { region: "Oceania", min: 84, minCountry: "Papua New Guinea", median: 124, medianCountry: "Kiribati", max: 182, maxCountry: "Australia / New Zealand" },
        { region: "South America", min: 75, minCountry: "Suriname", median: 136, medianCountry: "Colombia", max: 174, maxCountry: "Chile" }
    ];

    chart.innerHTML = "";

    data.forEach(item => {
        const row = document.createElement("div");
        row.className = "chart-row";

        const label = document.createElement("div");
        label.className = "chart-label";
        label.textContent = item.region;

        const bars = document.createElement("div");
        bars.className = "distribution-bars";

        const minBar = createDistributionBar(item.min, "bar-min");
        attachTooltip(minBar, `<strong>${item.minCountry}</strong><br>${item.min} countries visa-free`);

        const medianBar = createDistributionBar(item.median, "bar-median");
        attachTooltip(medianBar, `<strong>${item.medianCountry}</strong><br>${item.median} countries visa-free`);

        const maxBar = createDistributionBar(item.max, "bar-max");
        attachTooltip(maxBar, `<strong>${item.maxCountry}</strong><br>${item.max} countries visa-free`);

        bars.appendChild(minBar);
        bars.appendChild(medianBar);
        bars.appendChild(maxBar);

        row.appendChild(label);
        row.appendChild(bars);
        chart.appendChild(row);
    });
}

function createExtremeRow(item, colorClass) {
    const row = document.createElement("div");
    row.className = "extreme-row";

    const name = document.createElement("div");
    name.className = "extreme-name";
    name.textContent = item.label;

    const wrap = document.createElement("div");
    wrap.className = "extreme-bar-wrap";

    const bar = document.createElement("div");
    bar.className = "extreme-bar " + colorClass;
    bar.style.width = (item.score / 200 * 100) + "%";

    wrap.appendChild(bar);

    const score = document.createElement("div");
    score.className = "extreme-score";
    score.textContent = item.score;

    row.appendChild(name);
    row.appendChild(wrap);
    row.appendChild(score);

    return row;
}

function renderExtremesChart() {
    const chart = document.getElementById("extremesChart");
    if (!chart) return;

    chart.innerHTML = "";

    const highData = [
        { label: "Singapore", score: 192 },
        { label: "Japan", score: 187 },
        { label: "South Korea", score: 187 },
        { label: "United Arab Emirates", score: 187 },
        { label: "Sweden", score: 186 },
        { label: "Denmark*", score: 185 }
    ];

    const lowData = [
        { label: "Afghanistan", score: 23 },
        { label: "Syria", score: 26 },
        { label: "Iraq", score: 29 },
        { label: "Pakistan", score: 30 },
        { label: "Yemen", score: 31 },
        { label: "Somalia", score: 32 },
        { label: "Nepal", score: 35 },
        { label: "North Korea", score: 35 },
        { label: "Bangladesh", score: 36 },
        { label: "Iran*", score: 38 }
    ];

    const highTitle = document.createElement("div");
    highTitle.className = "chart-section-title";
    highTitle.textContent = "Strongest passports";
    chart.appendChild(highTitle);

    highData.forEach(item => {
        chart.appendChild(createExtremeRow(item, "extreme-high"));
    });

    const note185 = document.createElement("div");
    note185.className = "chart-note";
    note185.innerHTML =
        "*Score 185 shared by Belgium, Denmark, Finland, France, Germany, Ireland, Italy, Luxembourg, Netherlands, Norway, Spain and Switzerland.";
    chart.appendChild(note185);

    const lowTitle = document.createElement("div");
    lowTitle.className = "chart-section-title";
    lowTitle.textContent = "Weakest passports";
    chart.appendChild(lowTitle);

    lowData.forEach(item => {
        chart.appendChild(createExtremeRow(item, "extreme-low"));
    });

    const note38 = document.createElement("div");
    note38.className = "chart-note";
    note38.innerHTML =
        "*Score 38 shared by Eritrea, Iran and Palestine.";
    chart.appendChild(note38);
}

/* ---------------- DATA LOADING ---------------- */

async function loadJsonFromPossiblePaths(paths, required = true) {
    let lastError = null;

    for (const path of paths) {
        try {
            const response = await fetch(path);

            if (!response.ok) {
                throw new Error(path + " returned " + response.status);
            }

            console.log("Loaded:", path);
            return await response.json();
        } catch (error) {
            console.warn("Could not load:", path, error);
            lastError = error;
        }
    }

    if (required) {
        throw lastError || new Error("Required data file missing.");
    }

    return {};
}

async function loadData() {
    try {
        infoBox.innerHTML =
            "<strong>Loading data...</strong><br>Trying to load GeoJSON and visa data.";

        const worldData = await loadJsonFromPossiblePaths([
            "data/world.geojson",
            "world.geojson",
            "data/countries.geojson",
            "countries.geojson"
        ], true);

        const visaData = await loadJsonFromPossiblePaths([
            "data/visa_access_all_iso3.json",
            "visa_access_all_iso3.json"
        ], false);

        worldGeojsonData = worldData;
        visaAccessData = visaData || {};

        console.log("World GeoJSON:", worldGeojsonData);
        console.log("Visa data:", visaAccessData);

        drawLeafletMap(worldGeojsonData);

        infoBox.innerHTML =
            "<strong>Passport Strength</strong><br>Hover over a country to see its passport score";

        updateLegendVisibility();

    } catch (error) {
        console.error("Data loading error:", error);

        infoBox.innerHTML =
            "<strong>Error</strong><br>" +
            "Could not load your GeoJSON.<br><br>" +
            "Check whether this file exists:<br>" +
            "<code>data/world.geojson</code><br><br>" +
            "Open the browser console for details.";
    }
}

function drawLeafletMap(worldData) {
    if (geojsonLayer) {
        map.removeLayer(geojsonLayer);
    }

    geojsonLayer = L.geoJSON(worldData, {
        style: baseStyle,

        onEachFeature: function(feature, layer) {

            const country = getCountry(feature);
            const score = getScore(feature);
            const iso = getIso(feature);

            layer.on({

    mouseover: function(e) {

        if (currentView !== "2d") return;

        if (currentMode === "score") {

            e.target.setStyle({
                weight: 1.0,
                color: "#222222"
            });

            infoBox.classList.add("compact");

            if (score === null || score === undefined || isNaN(score)) {

                infoBox.innerHTML =
                    "<strong style='display:block;margin-bottom:0;'>" + country + "</strong>" +
                    "No separate passport ranking";

            } else {

                const accessPercent =
                    Math.round((score / totalCountries) * 100);

                const mobilityTier =
                    getMobilityTier(score);

                infoBox.innerHTML =
                    "<strong style='display:block;margin-bottom:0;'>" + country + "</strong>" +
                    "Passport score: " + score + "<br>" +
                    "Global access: " + accessPercent + "%" +

                    "<div style='height:8px;'></div>" +

                    "<strong>Mobility tier</strong><br>" +
                    mobilityTier;
            }
        }

        if (currentMode === "visa") {
            showVisaAccess(iso);
        }

        if (currentMode === "regional") {

            geojsonLayer.setStyle(regionalNeutralStyle);

            e.target.setStyle({
                fillColor: "#d4cebf",
                fillOpacity: 1,
                color: "#222222",
                weight: 1,
                opacity: 1
            });

            if (pinnedRegionalCountries.length === 0) {
                drawRegionalAccessibilityRingsForCountry(iso, layer);
            }

            showRegionalAccessibilityInfo(iso, country);
        }
    },

    click: function(e) {

        if (currentView !== "2d") return;

        L.DomEvent.stopPropagation(e);

        pinnedCountry = iso;

        if (currentMode === "score") {

            infoBox.classList.add("compact");

            if (score === null || score === undefined || isNaN(score)) {

                infoBox.innerHTML =
                    "<strong style='display:block;margin-bottom:0;'>" + country + "</strong>" +
                    "No separate passport ranking";

            } else {

                const accessPercent =
                    Math.round((score / totalCountries) * 100);

                const mobilityTier =
                    getMobilityTier(score);

                infoBox.innerHTML =
                    "<strong style='display:block;margin-bottom:0;'>" + country + "</strong>" +
                    "Passport score: " + score + "<br>" +
                    "Global access: " + accessPercent + "%" +

                    "<div style='height:8px;'></div>" +

                    "<strong>Mobility tier</strong><br>" +
                    mobilityTier;
            }
        }

        if (currentMode === "visa") {
            showVisaAccess(iso);
        }

        if (currentMode === "regional") {
            const alreadyPinned = pinnedRegionalCountries.find(item => item.iso === iso);

            if (alreadyPinned) {
                pinnedRegionalCountries = pinnedRegionalCountries.filter(item => item.iso !== iso);
            } else {
                if (pinnedRegionalCountries.length >= 3) {
                    pinnedRegionalCountries.shift();
        }

                pinnedRegionalCountries.push({
                    iso,
                    layer,
                    country
                });
    }

    renderPinnedRegionalComparison();
}
    },

    mouseout: function(e) {

        if (currentView !== "2d") return;

        if (currentMode === "score") {

            geojsonLayer.resetStyle(e.target);

            if (!pinnedCountry) {

                infoBox.classList.remove("compact", "wide");

                infoBox.innerHTML =
                    "<strong>Passport Strength</strong><br>" +
                    "Hover over a country to see its passport score.";
            }
        }

        if (currentMode === "visa") {

            if (!pinnedCountry) {
                resetVisaModeView();
            }
        }

        if (currentMode === "regional") {

            e.target.setStyle(regionalNeutralStyle());

            if (pinnedRegionalCountries.length === 0) {
                clearRegionalRings();
                setRegionalDefaultInfo();
            } else {
                renderPinnedRegionalComparison();
    }
}
    }

});
        }
    }).addTo(map);

    try {

        if (window.innerWidth <= 768) {
            map.setView([20, 0], 1.15);
        } else {
            map.fitBounds(
                geojsonLayer.getBounds(),
                {
                    padding: [20, 20]
                }
            );
        }

    } catch (error) {

        map.setView(
            [20, 0],
            2
        );
    }
}

/* ---------------- EVENTS ---------------- */
scoreMode.addEventListener("click", () => {
    setScoreMode();
    closeMobileMenu();
});

visaMode.addEventListener("click", () => {
    setVisaMode();
    closeMobileMenu();
});

ringsMode.addEventListener("click", () => {
    setRegionalAccessibilityMode();
    closeMobileMenu();
});

distributionMode.addEventListener("click", () => {
    hidePassportLegend();
    showChartView(distributionView, distributionMode);
    closeMobileMenu();
});

extremesMode.addEventListener("click", () => {
    hidePassportLegend();
    showChartView(extremesView, extremesMode);
    closeMobileMenu();
});

/* 3D view toggle is currently disabled.
   The old view2D/view3D buttons were removed from index.html.
   Globe code stays in the file, but is not activated. */

map.on("click", () => {
    if (currentMode === "regional") {
        pinnedCountry = null;
        setRegionalDefaultInfo();
    }
});

window.addEventListener("resize", () => {
    map.invalidateSize();

    if (window.innerWidth <= 768) {
        map.setView(map.getCenter(), 1.15);
    }
});

/* ---------------- DEBUG ---------------- */

window.globeDebug = function() {
    console.log({
        currentMode,
        currentView,
        worldGeojsonData,
        visaAccessData,
        geojsonLayer,
        globe,
        globeInitialized,
        globeDiv,
        globeHTML: globeDiv ? globeDiv.innerHTML : null,
        globeType: typeof Globe
    });
};

/* ---------------- INIT ---------------- */

renderDistributionChart();
renderExtremesChart();
updateLegendVisibility();
loadData();

const mobileMenuButton = document.getElementById("mobileMenuButton");
const sideMenu = document.getElementById("sideMenu");

if (mobileMenuButton && sideMenu) {
    mobileMenuButton.addEventListener("click", () => {
        sideMenu.classList.toggle("mobile-open");
    });
}

function closeMobileMenu() {
    if (window.innerWidth <= 768 && sideMenu) {
        sideMenu.classList.remove("mobile-open");
    }
}

const enterProject = document.getElementById("enterProject");

if (enterProject) {
    enterProject.addEventListener("click", () => {
        document.getElementById("app").scrollIntoView({
            behavior: "smooth"
        });
    });
}