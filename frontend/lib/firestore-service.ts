"use client"

import {
  collection,
  getDocs,
  query,
  limit,
  orderBy,
  startAfter,
  type DocumentData,
  type QueryDocumentSnapshot,
  where,
} from "firebase/firestore"
import { db } from "./firebase"
import type { Film } from "./types"

const FILMS_COLLECTION = "mubi_films"
const PAGE_SIZE = 20

export async function getFilms(
  lastDoc?: QueryDocumentSnapshot<DocumentData>,
): Promise<{ films: Film[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }> {
  try {
    let filmsQuery = query(collection(db, FILMS_COLLECTION), orderBy("popularity", "desc"), limit(PAGE_SIZE))

    // Apply pagination if lastDoc is provided
    if (lastDoc) {
      filmsQuery = query(
        collection(db, FILMS_COLLECTION),
        orderBy("popularity", "desc"),
        startAfter(lastDoc),
        limit(PAGE_SIZE),
      )
    }

    const querySnapshot = await getDocs(filmsQuery)
    const films: Film[] = []

    querySnapshot.forEach((doc) => {
      films.push({ id: doc.id, ...doc.data() } as Film)
    })

    const newLastDoc = querySnapshot.docs.length > 0 ? querySnapshot.docs[querySnapshot.docs.length - 1] : null

    return { films, lastDoc: newLastDoc }
  } catch (error) {
    console.error("Error fetching films:", error)
    return { films: [], lastDoc: null }
  }
}

export async function getTotalFilmsCount(): Promise<number> {
  try {
    const querySnapshot = await getDocs(collection(db, FILMS_COLLECTION))
    return querySnapshot.size
  } catch (error) {
    console.error("Error getting total films count:", error)
    return 0
  }
}

export async function getGenres(): Promise<string[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "genres"))
    const genres: string[] = []
    querySnapshot.forEach((doc) => {
      genres.push(doc.id) // Assuming document ID is the genre name
    })
    return genres
  } catch (error) {
    console.error("Error fetching genres:", error)
    return []
  }
}

export async function getCountries(): Promise<string[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "countries"))
    const countries: string[] = []
    querySnapshot.forEach((doc) => {
      countries.push(doc.id) // Assuming document ID is the country name
    })
    return countries
  } catch (error) {
    console.error("Error fetching countries:", error)
    return []
  }
}

export async function searchFilms(searchTerm: string): Promise<Film[]> {
  try {
    if (!searchTerm) {
      return []
    }

    const filmsQuery = query(
      collection(db, FILMS_COLLECTION),
      where("title_upcase", ">=", searchTerm.toUpperCase()),
      where("title_upcase", "<=", searchTerm.toUpperCase() + "\uf8ff"),
      limit(20),
    )

    const querySnapshot = await getDocs(filmsQuery)
    const films: Film[] = []
    querySnapshot.forEach((doc) => {
      films.push({ id: doc.id, ...doc.data() } as Film)
    })
    return films
  } catch (error) {
    console.error("Error searching films:", error)
    return []
  }
}

