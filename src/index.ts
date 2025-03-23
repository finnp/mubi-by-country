import axios from "axios";
import * as admin from "firebase-admin";
import path from "path";

// Initialize Firebase Admin
const serviceAccount = require("../firebase-service-account.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

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

async function ensureCollectionExists(collectionName: string) {
  // Check if collection exists by trying to get any document
  const snapshot = await db.collection(collectionName).limit(1).get();
  if (snapshot.empty) {
    // Collection doesn't exist or is empty, create a dummy document and delete it
    const dummyDoc = await db.collection(collectionName).add({ dummy: true });
    await dummyDoc.delete();
  }
}

interface ExistingFilm extends MubiFilm {
  last_updated: FirebaseFirestore.Timestamp;
  first_seen?: FirebaseFirestore.Timestamp;
}

async function getCurrentFilmsInFirestore(): Promise<Map<number, ExistingFilm>> {
  const snapshot = await db.collection('mubi_films').get();
  const existingFilms = new Map<number, ExistingFilm>();
  
  snapshot.forEach(doc => {
    const film = doc.data() as ExistingFilm;
    existingFilms.set(film.id, film);
  });
  
  return existingFilms;
}

async function syncWithFirestore(newFilms: MubiFilm[], metadata: any) {
  const collectionRef = db.collection('mubi_films');
  
  // Ensure collections exist
  await ensureCollectionExists('mubi_films');
  await ensureCollectionExists('mubi_metadata');

  // Get existing films from Firestore
  console.log('Fetching current films from Firestore...');
  const existingFilms = await getCurrentFilmsInFirestore();
  
  // Create sets of film IDs for comparison
  const newFilmIds = new Set(newFilms.map(f => f.id));
  const existingFilmIds = new Set(existingFilms.keys());

  // Find films to delete (exist in Firestore but not in new data)
  const filmsToDelete = Array.from(existingFilmIds)
    .filter(id => !newFilmIds.has(id));

  // Find films to update (exist in both sets)
  const filmsToUpdate = newFilms.filter(film => existingFilmIds.has(film.id));

  // Find films to add (exist in new data but not in Firestore)
  const filmsToAdd = newFilms.filter(film => !existingFilmIds.has(film.id));

  console.log(`\nSync analysis:`);
  console.log(`- Films to delete: ${filmsToDelete.length}`);
  console.log(`- Films to update: ${filmsToUpdate.length}`);
  console.log(`- Films to add: ${filmsToAdd.length}`);

  // Process deletions in batches
  const batchSize = 500;
  for (let i = 0; i < filmsToDelete.length; i += batchSize) {
    const batch = db.batch();
    const currentBatch = filmsToDelete.slice(i, i + batchSize);
    
    for (const id of currentBatch) {
      const docRef = collectionRef.doc(id.toString());
      batch.delete(docRef);
    }
    
    await batch.commit();
    console.log(`Deleted batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(filmsToDelete.length / batchSize)}`);
  }

  // Process updates and additions in batches
  const filmsToWrite = [...filmsToUpdate, ...filmsToAdd];
  for (let i = 0; i < filmsToWrite.length; i += batchSize) {
    const batch = db.batch();
    const currentBatch = filmsToWrite.slice(i, i + batchSize);
    
    for (const film of currentBatch) {
      const docRef = collectionRef.doc(film.id.toString());
      const existingFilm = existingFilms.get(film.id);
      
      // If film exists, preserve any fields we don't want to override
      const dataToWrite = {
        ...film,
        last_updated: admin.firestore.FieldValue.serverTimestamp(),
        first_seen: existingFilm?.first_seen || admin.firestore.FieldValue.serverTimestamp()
      };
      
      batch.set(docRef, dataToWrite);
    }
    
    await batch.commit();
    console.log(`Processed batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(filmsToWrite.length / batchSize)}`);
  }

  // Update metadata
  const metadataRef = db.collection('mubi_metadata').doc('latest');
  await metadataRef.set({
    ...metadata,
    last_sync: {
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      added: filmsToAdd.length,
      updated: filmsToUpdate.length,
      deleted: filmsToDelete.length,
      total_after_sync: newFilms.length
    }
  });

  console.log('\nSync completed successfully');
}

async function fetchAllMubiFilms() {
  try {
    const countries = ["PT"];
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

    // Prepare metadata
    const metadata = {
      countries,
      films_by_country: Object.fromEntries(
        Object.entries(filmsByCountry).map(([country, films]) => [country, films.length])
      ),
      total_count: combinedFilms.length
    };

    // Sync with Firestore
    await syncWithFirestore(combinedFilms, metadata);

    console.log(`\nSync summary:`);
    console.log(`- Total unique films: ${combinedFilms.length}`);
    for (const country of countries) {
      console.log(`- Films in ${country}: ${filmsByCountry[country].length}`);
    }
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
  } finally {
    // Terminate the Firebase Admin app
    await admin.app().delete();
  }
}

// Execute the function
fetchAllMubiFilms();
