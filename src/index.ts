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
  total_count: number;
}

async function fetchMubiFilms() {
  try {
    const response = await axios.get<MubiResponse>(
      "https://api.mubi.com/v4/browse/films",
      {
        params: {
          sort: "popularity_quality_score",
          playable: true,
          page: 1,
        },
        headers: {
          "Accept-Language": "en",
          CLIENT: "web",
          "CLIENT-COUNTRY": "PT",
          Accept: "application/json",
        },
      }
    );

    // Create output directory if it doesn't exist
    const outputDir = path.join(__dirname, "../output");
    await fs.mkdir(outputDir, { recursive: true });

    // Save the response to a JSON file
    const outputFile = path.join(outputDir, "mubi_films.json");
    await fs.writeFile(
      outputFile,
      JSON.stringify(response.data, null, 2),
      "utf-8"
    );

    console.log(`Successfully fetched ${response.data.films.length} films`);
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
fetchMubiFilms();
