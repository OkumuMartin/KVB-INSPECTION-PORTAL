const REGIONS = {
  Mombasa: ['Changamwe', 'Jomvu', 'Kisauni', 'Likoni', 'Mvita', 'Nyali'],
  Kwale: ['Msambweni', 'Lunga Lunga', 'Matuga', 'Kinango'],
  Kilifi: ['Kilifi North', 'Kilifi South', 'Kaloleni', 'Rabai', 'Ganze', 'Malindi', 'Magarini'],
  'Tana River': ['Garsen', 'Galole', 'Bura'],
  Lamu: ['Lamu East', 'Lamu West'],
  'Taita Taveta': ['Taveta', 'Wundanyi', 'Mwatate', 'Voi'],
  Garissa: ['Garissa Township', 'Balambala', 'Lagdera', 'Dadaab', 'Fafi', 'Ijara'],
  Wajir: ['Wajir North', 'Wajir East', 'Wajir South', 'Wajir West', 'Eldas', 'Tarbaj'],
  Mandera: ['Mandera West', 'Mandera North', 'Mandera South', 'Mandera East', 'Lafey', 'Banissa'],
  Marsabit: ['Moyale', 'North Horr', 'Saku', 'Laisamis'],
  Isiolo: ['Isiolo North', 'Isiolo South', 'Garbatulla'],
  Meru: ['Imenti North', 'Imenti South', 'Central Imenti', 'Tigania East', 'Tigania West', 'Igembe North', 'Igembe South', 'Igembe Central', 'Buuri'],
  'Tharaka-Nithi': ['Tharaka North', 'Tharaka South', 'Chuka', "Igambang'ombe", 'Maara', 'Chiakariga'],
  Embu: ['Manyatta', 'Runyenjes', 'Mbeere South', 'Mbeere North'],
  Kitui: ['Kitui Central', 'Kitui West', 'Kitui Rural', 'Kitui South', 'Kitui East', 'Mwingi North', 'Mwingi West', 'Mwingi Central', 'Mutito', 'Ikutha'],
  Machakos: ['Machakos Town', 'Mavoko', 'Kangundo', 'Matungulu', 'Masinga', 'Yatta', 'Kathiani'],
  Makueni: ['Makueni', 'Kibwezi West', 'Kibwezi East', 'Mbooni', 'Kaiti', 'Kilome'],
  Nyandarua: ['Kinangop', 'Kipipiri', 'Ol Kalou', 'Ol Joro Orok', 'Ndaragwa'],
  Nyeri: ['Nyeri Town', 'Tetu', 'Kieni East', 'Kieni West', 'Mathira East', 'Mathira West', 'Othaya', 'Mukurweini'],
  Kirinyaga: ['Mwea West', 'Mwea East', 'Gichugu', 'Kirinyaga Central', 'Kirinyaga West'],
  "Murang'a": ['Kiharu', 'Kangema', 'Mathioya', 'Kigumo', 'Kandara', 'Gatanga', 'Murang\'a South', 'Kahuro'],
  Kiambu: ['Thika Town', 'Ruiru', 'Juja', 'Gatundu South', 'Gatundu North', 'Githunguri', 'Kiambu', 'Kiambaa', 'Kabete', 'Kikuyu', 'Limuru', 'Lari'],
  Turkana: ['Turkana North', 'Turkana West', 'Turkana Central', 'Turkana East', 'Turkana South', 'Loima'],
  'West Pokot': ['Kapenguria', 'Pokot South', 'Sigor', 'Kacheliba'],
  Samburu: ['Samburu East', 'Samburu North', 'Samburu West'],
  'Trans Nzoia': ['Kwanza', 'Endebess', 'Saboti', 'Cherangany', 'Kiminini'],
  'Uasin Gishu': ['Eldoret East', 'Eldoret North', 'Eldoret South', 'Kesses', 'Moiben', 'Soy', 'Turbo'],
  'Elgeyo-Marakwet': ['Keiyo North', 'Keiyo South', 'Marakwet East', 'Marakwet West'],
  Nandi: ['Aldai', 'Chesumei', 'Emgwen', 'Mosop', 'Nandi Hills', 'Tinderet'],
  Baringo: ['Baringo Central', 'Baringo North', 'Baringo South', 'Eldama Ravine', 'Mogotio', 'Tiaty'],
  Laikipia: ['Laikipia East', 'Laikipia West', 'Laikipia North', 'Nyahururu', 'Rumuruti'],
  Nakuru: ['Nakuru Town West', 'Nakuru Town East', 'Bahati', 'Gilgil', 'Kuresoi North', 'Kuresoi South', 'Molo', 'Naivasha', 'Njoro', 'Rongai', 'Subukia'],
  Narok: ['Narok North', 'Narok South', 'Narok East', 'Narok West', 'Transmara West', 'Transmara East'],
  Kajiado: ['Kajiado North', 'Kajiado Central', 'Kajiado East', 'Kajiado West', 'Kajiado South'],
  Kericho: ['Belgut', 'Ainamoi', 'Bureti', 'Kipkelion East', 'Kipkelion West', 'Soin/Sigowet'],
  Bomet: ['Bomet Central', 'Bomet East', 'Chepalungu', 'Konoin', 'Sotik'],
  Kakamega: ['Lurambi', 'Malava', 'Matungu', 'Mumias East', 'Mumias West', 'Navakholo', 'Nambale/Likuyani', 'Lugari', 'Khwisero', 'Butere', 'Ikolomani', 'Shinyalu'],
  Vihiga: ['Vihiga', 'Sabatia', 'Luanda', 'Emuhaya', 'Hamisi'],
  Bungoma: ['Bungoma Central', 'Bungoma North', 'Bungoma South', 'Bungoma East', 'Mt. Elgon', 'Bumula', 'Kimilili', 'Sirisia', 'Tongaren'],
  Busia: ['Teso North', 'Teso South', 'Nambale', 'Matayos', 'Butula', 'Funyula', 'Budalangi'],
  Siaya: ['Gem', 'Alego Usonga', 'Bondo', 'Rarieda', 'Ugenya', 'Ugunja'],
  Kisumu: ['Kisumu East', 'Kisumu West', 'Kisumu Central', 'Seme', 'Nyando', 'Muhoroni', 'Nyakach'],
  'Homa Bay': ['Homa Bay Town', 'Kabondo Kasipul', 'Karachuonyo', 'Kasipul', 'Mbita', 'Ndhiwa', 'Rangwe', 'Suba'],
  Migori: ['Rongo', 'Awendo', 'Suna East', 'Suna West', 'Uriri', 'Nyatike', 'Kuria West', 'Kuria East', 'Kanyada/Suba'],
  Kisii: ['Bonchari', 'South Mugirango', 'Bomachoge Borabu', 'Bomachoge Chache', 'Bobasi', 'Nyaribari Masaba', 'Nyaribari Chache', 'Kitutu Chache North', 'Kitutu Chache South'],
  Nyamira: ['Nyamira North', 'Nyamira South', 'Borabu', 'West Mugirango', 'North Mugirango'],
  Nairobi: ['Westlands', 'Dagoretti North', 'Dagoretti South', "Lang'ata", 'Kibra', 'Roysambu', 'Kasarani', 'Ruaraka', 'Embakasi South', 'Embakasi North', 'Embakasi Central', 'Embakasi East', 'Embakasi West', 'Makadara', 'Kamukunji', 'Starehe', 'Mathare'],
};

const COUNTIES = Object.keys(REGIONS).sort((a, b) => a.localeCompare(b));

const COUNTY_LOOKUP = new Map(
  COUNTIES.flatMap((county) => [county, ...REGIONS[county]].map((name) => [name.toLowerCase(), county])),
);

function listCounties() {
  return COUNTIES.map((county) => ({ county, subCounties: REGIONS[county] }));
}

function isValidCounty(county) {
  return typeof county === 'string' && Object.prototype.hasOwnProperty.call(REGIONS, county.trim());
}

function isValidSubCounty(county, subCounty) {
  if (typeof subCounty !== 'string' || !subCounty.trim()) return false;
  if (!isValidCounty(county)) return true;
  const target = subCounty.trim().toLowerCase();
  return REGIONS[county.trim()].some((name) => name.toLowerCase() === target);
}

function isValidRegionName(name) {
  return typeof name === 'string' && COUNTY_LOOKUP.has(name.trim().toLowerCase());
}

module.exports = {
  REGIONS,
  COUNTIES,
  listCounties,
  isValidCounty,
  isValidSubCounty,
  isValidRegionName,
};
