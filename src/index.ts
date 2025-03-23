import axios from "axios";
import fs from "fs/promises";
import path from "path";

interface MubiFilm {
  id: number;
  title: string;
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

async function fetchMubiPage(page: number): Promise<MubiResponse> {
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
        "CLIENT-COUNTRY": "PT",
        Accept: "application/json",
      },
    }
  );
  return response.data;
}

async function fetchAllMubiFilms() {
  try {
    // First, fetch page 1 to get total count
    const firstPage = await fetchMubiPage(1);
    const { total_pages, total_count } = firstPage.meta;

    console.log(`Total films available: ${total_count}`);
    console.log(`Total pages: ${total_pages}`);

    // Array to store all films
    let allFilms: MubiFilm[] = [...firstPage.films];

    // Fetch remaining pages
    for (let page = 2; page <= total_pages; page++) {
      console.log(`Fetching page ${page}/${total_pages}...`);
      try {
        const pageData = await fetchMubiPage(page);
        allFilms = [...allFilms, ...pageData.films];
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error fetching page ${page}:`, error);
        break;
      }
    }

    // Create output directory if it doesn't exist
    const outputDir = path.join(__dirname, "../output");
    await fs.mkdir(outputDir, { recursive: true });

    // Save the combined results to a JSON file
    const outputFile = path.join(outputDir, "all_mubi_films.json");
    await fs.writeFile(
      outputFile,
      JSON.stringify({ 
        films: allFilms, 
        total_count: allFilms.length,
        metadata: {
          total_available: total_count,
          pages_fetched: total_pages,
          last_updated: new Date().toISOString()
        }
      }, null, 2),
      "utf-8"
    );

    console.log(`Successfully fetched ${allFilms.length} films`);
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
