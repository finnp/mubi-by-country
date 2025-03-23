import type { Film } from "./types"

interface FilmData {
  films: Film[]
  metadata: {
    total_films: number
    countries: string[]
    last_sync: {
      timestamp: string
      total_films: number
    }
  }
}

let cachedData: FilmData | null = null

async function loadData(): Promise<FilmData> {
  if (cachedData) return cachedData
  
  const response = await fetch('/mubi-films.json')
  cachedData = await response.json()
  return cachedData as FilmData
}

export async function getFilms(
  lastId?: string | number,
  genre?: string,
  year?: string,
  country?: string,
  pageSize: number = 20
): Promise<{ films: Film[]; lastId: string | number | null }> {
  try {
    const data = await loadData()
    let films = data.films

    // Apply filters
    if (genre && genre !== "All genres") {
      films = films.filter(film => film.genres?.includes(genre))
    }

    if (year && year !== "all") {
      const yearNum = parseInt(year)
      films = films.filter(film => {
        if (!film.year) return false
        if (yearNum === 2020) return film.year >= 2020
        return film.year >= yearNum && film.year < yearNum + 10
      })
    }

    if (country && country !== "All countries") {
      films = films.filter(film => film.filmCountries?.includes(country))
    }

    // Sort by popularity (descending)
    films.sort((a, b) => (b.popularity || 0) - (a.popularity || 0))

    // Handle pagination
    let startIndex = 0
    if (lastId) {
      const lastIndex = films.findIndex(f => f.id === lastId)
      if (lastIndex !== -1) {
        startIndex = lastIndex + 1
      }
    }

    const paginatedFilms = films.slice(startIndex, startIndex + pageSize)
    const newLastId = paginatedFilms.length > 0 ? paginatedFilms[paginatedFilms.length - 1].id : null

    return { 
      films: paginatedFilms,
      lastId: newLastId
    }
  } catch (error) {
    console.error("Error fetching films:", error)
    return { films: [], lastId: null }
  }
}

export async function getTotalFilmsCount(
  genre?: string, 
  year?: string,
  country?: string
): Promise<number> {
  try {
    const data = await loadData()
    let films = data.films

    if (genre && genre !== "All genres") {
      films = films.filter(film => film.genres?.includes(genre))
    }

    if (year && year !== "all") {
      const yearNum = parseInt(year)
      films = films.filter(film => {
        if (!film.year) return false
        if (yearNum === 2020) return film.year >= 2020
        return film.year >= yearNum && film.year < yearNum + 10
      })
    }

    if (country && country !== "All countries") {
      films = films.filter(film => film.filmCountries?.includes(country))
    }

    return films.length
  } catch (error) {
    console.error("Error getting total films count:", error)
    return 0
  }
}

export async function getGenres(): Promise<string[]> {
  try {
    const data = await loadData()
    const genreSet = new Set<string>()
    
    data.films.forEach(film => {
      film.genres?.forEach(genre => genreSet.add(genre))
    })

    return Array.from(genreSet).sort()
  } catch (error) {
    console.error("Error fetching genres:", error)
    return []
  }
}

export async function getCountries(): Promise<string[]> {
  try {
    const data = await loadData()
    const countrySet = new Set<string>()
    
    data.films.forEach(film => {
      film.filmCountries?.forEach(country => countrySet.add(country))
    })

    return Array.from(countrySet).sort()
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

    const data = await loadData()
    const searchTermUpper = searchTerm.toUpperCase()
    
    return data.films
      .filter(film => film.title_upcase?.includes(searchTermUpper))
      .slice(0, 20)
  } catch (error) {
    console.error("Error searching films:", error)
    return []
  }
} 