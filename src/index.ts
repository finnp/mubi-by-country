import axios from "axios";
import fs from "fs/promises";
import path from "path";

interface MubiFilm {
  id: number;
  title: string;
  available_countries: string[];
  // Add other properties as needed based on the API response
}

interface MubiResponse {
  films: MubiFilm[];
  meta: {
    current_page: number;
    total_pages: number;
    total_count: number;
  };
}

async function fetchMubiPage(page: number, country: string): Promise<MubiResponse> {
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

async function fetchAllMubiFilms() {
  try {
    const countries = ["PT", "DE"];
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
      let countryFilms: MubiFilm[] = firstPage.films.map(film => ({
        ...film,
        available_countries: [country]
      }));

      // Fetch remaining pages
      for (let page = 2; page <= total_pages; page++) {
        console.log(`Fetching page ${page}/${total_pages} for ${country}...`);
        try {
          const pageData = await fetchMubiPage(page, country);
          const filmsWithCountry = pageData.films.map(film => ({
            ...film,
            available_countries: [country]
          }));
          countryFilms = [...countryFilms, ...filmsWithCountry];
          
          // Add a small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
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
          existingFilm.available_countries.push(country);
        } else {
          // New film, add it to the map
          filmMap.set(film.id, film);
        }
      }
    }

    // Convert map to array
    const combinedFilms = Array.from(filmMap.values());

    // Create output directory if it doesn't exist
    const outputDir = path.join(__dirname, "../output");
    await fs.mkdir(outputDir, { recursive: true });

    // Save the combined results to a JSON file
    const outputFile = path.join(outputDir, "all_mubi_films_by_country.json");
    await fs.writeFile(
      outputFile,
      JSON.stringify({ 
        films: combinedFilms, 
        total_count: combinedFilms.length,
        metadata: {
          countries,
          films_by_country: Object.fromEntries(
            Object.entries(filmsByCountry).map(([country, films]) => [country, films.length])
          ),
          last_updated: new Date().toISOString()
        }
      }, null, 2),
      "utf-8"
    );

    console.log(`\nSuccessfully fetched and combined films:`);
    console.log(`- Total unique films: ${combinedFilms.length}`);
    for (const country of countries) {
      console.log(`- Films in ${country}: ${filmsByCountry[country].length}`);
    }
    console.log(`Data saved to ${outputFile}`);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Error fetching data:", error.message);
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
      }
    } else {
      console.error("Unexpected error:", error);
    }
  }
}

// Execute the function
fetchAllMubiFilms();
