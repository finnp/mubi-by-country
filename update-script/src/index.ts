import axios from "axios";
import fs from "fs";
import path from "path";

interface Director {
  name: string;
  name_upcase?: string;
  slug?: string;
}

interface MubiFilm {
  id: number;
  title: string;
  originalTitle: string;
  availableCountries: string[];
  filmCountries: string[];
  duration: number;
  genres: string[];
  webUrl: string;
  thumbnail: string | null;
  year?: number;
  directors?: string[];
}

interface MubiResponse {
  films: any[];
  meta: {
    current_page: number;
    total_pages: number;
    total_count: number;
  };
}

interface FilmChanges {
  added: number;
  removed: number;
  modified: number;
}

async function fetchMubiPage(
  page: number,
  country: string
): Promise<MubiResponse> {
  const response = await axios.get<MubiResponse>(
    "https://api.mubi.com/v4/browse/films",
    {
      params: {
        sort: "popularity_quality_score",
        playable: true,
        page,
      },
      headers: {
        "Accept-Language": "en",
        CLIENT: "web",
        "CLIENT-COUNTRY": country,
        Accept: "application/json",
      },
    }
  );
  return response.data;
}

function transformFilm(film: any): MubiFilm {
  return {
    id: film.id,
    title: film.title,
    originalTitle: film.original_title,
    availableCountries: film.available_countries || [],
    filmCountries: film.historic_countries || [],
    duration: film.duration,
    genres: film.genres || [],
    webUrl: film.web_url,
    thumbnail: film.stills?.large_overlaid || null,
    year: film.year,
    directors: film.directors?.map((d: Director) => d.name) || [],
  };
}

async function getExistingFilms(): Promise<Map<number, MubiFilm>> {
  const filePath = path.join(__dirname, "..", "..", "frontend", "public", "mubi-films.json");
  if (!fs.existsSync(filePath)) {
    return new Map();
  }

  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return new Map(data.films.map((film: MubiFilm) => [film.id, film]));
  } catch (error) {
    console.error("Error reading existing films:", error);
    return new Map();
  }
}

function compareFilms(oldFilm: MubiFilm, newFilm: MubiFilm): boolean {
  // Compare relevant fields to determine if the film was modified
  return JSON.stringify({
    title: oldFilm.title,
    originalTitle: oldFilm.originalTitle,
    availableCountries: oldFilm.availableCountries.sort(),
    filmCountries: oldFilm.filmCountries.sort(),
    duration: oldFilm.duration,
    genres: oldFilm.genres.sort(),
    webUrl: oldFilm.webUrl,
    thumbnail: oldFilm.thumbnail,
    year: oldFilm.year,
    directors: oldFilm.directors?.sort(),
  }) === JSON.stringify({
    title: newFilm.title,
    originalTitle: newFilm.originalTitle,
    availableCountries: newFilm.availableCountries.sort(),
    filmCountries: newFilm.filmCountries.sort(),
    duration: newFilm.duration,
    genres: newFilm.genres.sort(),
    webUrl: newFilm.webUrl,
    thumbnail: newFilm.thumbnail,
    year: newFilm.year,
    directors: newFilm.directors?.sort(),
  });
}

async function saveToJson(films: MubiFilm[], metadata: any): Promise<FilmChanges> {
  const existingFilms = await getExistingFilms();
  const newFilmIds = new Set(films.map(f => f.id));
  const existingFilmIds = new Set(existingFilms.keys());

  const changes: FilmChanges = {
    added: 0,
    removed: 0,
    modified: 0,
  };

  // Count added films
  for (const film of films) {
    if (!existingFilmIds.has(film.id)) {
      changes.added++;
    } else if (!compareFilms(existingFilms.get(film.id)!, film)) {
      changes.modified++;
    }
  }

  // Count removed films
  for (const id of existingFilmIds) {
    if (!newFilmIds.has(id)) {
      changes.removed++;
    }
  }

  const data = {
    films,
    metadata: {
      ...metadata,
      last_sync: {
        timestamp: new Date().toISOString(),
        total_films: films.length,
        changes,
      },
    },
  };

  // Save to frontend/public directory
  const outputPath = path.join(__dirname, "..", "..", "frontend", "public");
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  const filePath = path.join(outputPath, "mubi-films.json");
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`\nData saved to ${filePath}`);
  
  return changes;
}

async function fetchAllMubiFilms() {
  try {
    const countries = [
      "PT",
      "DE",
      "GB",
      "US",
      "FR",
      "JP",
      "AR",
      "ES",
      "IT",
      "CA",
      "BR",
      "AU",
      "NL",
      "SE",
      "IN", 
      "ZA", 
      "MX", 
      "AF", 
      "EG", 
      "KR", 
      "NO", 
      "CL", 
      "NZ", 
      "TR", 
    ];
    const filmsByCountry: Record<string, MubiFilm[]> = {};

    // Fetch films for each country
    for (const country of countries) {
      console.log(`\nFetching films for ${country}:`);

      // First, fetch page 1 to get total count
      const firstPage = await fetchMubiPage(1, country);
      const { total_pages, total_count } = firstPage.meta;

      console.log(`Total films available in ${country}: ${total_count}`);
      console.log(`Total pages: ${total_pages}`);

      // Array to store all films for this country
      let countryFilms: MubiFilm[] = firstPage.films.map((film) => ({
        ...transformFilm(film),
        availableCountries: [country],
      }));

      // Fetch remaining pages
      for (let page = 2; page <= total_pages; page++) {
        console.log(`Fetching page ${page}/${total_pages} for ${country}...`);
        try {
          const pageData = await fetchMubiPage(page, country);
          const filmsWithCountry = pageData.films.map((film) => ({
            ...transformFilm(film),
            availableCountries: [country],
          }));
          countryFilms = [...countryFilms, ...filmsWithCountry];

          // Add a small delay to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Error fetching page ${page} for ${country}:`, error);
          break;
        }
      }

      filmsByCountry[country] = countryFilms;
    }

    // Combine films from all countries
    const filmMap = new Map<number, MubiFilm>();

    // Process films from each country
    for (const [country, films] of Object.entries(filmsByCountry)) {
      for (const film of films) {
        if (filmMap.has(film.id)) {
          // Film already exists, add this country to its availability
          const existingFilm = filmMap.get(film.id)!;
          existingFilm.availableCountries.push(country);
        } else {
          // New film, add it to the map
          filmMap.set(film.id, film);
        }
      }
    }

    // Convert map to array and save to JSON
    const allFilms = Array.from(filmMap.values());
    const metadata = {
      total_films: allFilms.length,
      countries,
    };

    const changes = await saveToJson(allFilms, metadata);
    console.log("\nChanges summary:");
    console.log(`- Added: ${changes.added} films`);
    console.log(`- Removed: ${changes.removed} films`);
    console.log(`- Modified: ${changes.modified} films`);
    
    // Exit with status 0 if there are changes, 1 if no changes
    const hasChanges = changes.added > 0 || changes.removed > 0 || changes.modified > 0;
    process.exit(hasChanges ? 0 : 1);
  } catch (error) {
    console.error("Error in fetchAllMubiFilms:", error);
    process.exit(2);
  }
}

// Run the script
fetchAllMubiFilms();
