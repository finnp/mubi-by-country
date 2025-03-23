"use client"

import { useState, useEffect } from "react"
import FilmGrid from "@/components/film-grid"
import LoadingFilms from "@/components/loading-films"
import { getFilms, getTotalFilmsCount, getCountries } from "@/lib/json-service"
import type { Film } from "@/lib/types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Github } from "lucide-react"

const GENRES = [
  "All genres",
  "Action",
  "Animation",
  "Comedy",
  "Documentary",
  "Drama",
  "Fantasy",
  "Biography",
  "Horror",
  "Musical",
  "Sci-Fi",
  "Short",
  "Silent",
  "Sport",
  "Thriller",
  "Western",
  "Avant-Garde",
  "Crime",
  "Romance",
  "LGBTQ+",
  "TV Movie",
  "Adventure",
  "Cult",
  "Family",
  "History",
  "War",
  "Mystery",
  "Erotica",
  "Music Video",
  "Film noir",
  "TV Mini-series",
  "Commercial",
  "Music",
  "Anthology",
  "TV Series"
]

const YEARS = [
  { value: "all", label: "All years" },
  { value: "2020", label: "2020+" },
  { value: "2010", label: "2010-19" },
  { value: "2000", label: "2000-09" },
  { value: "1990", label: "1990-99" },
  { value: "1980", label: "1980-89" },
  { value: "1970", label: "1970-79" },
  { value: "1960", label: "1960-69" },
  { value: "1950", label: "1950-59" },
  { value: "1940", label: "1940-49" },
  { value: "1930", label: "1930-39" },
  { value: "1920", label: "1920-29" },
  { value: "1910", label: "1910-19" },
  { value: "1900", label: "1900-09" },
  { value: "1890", label: "1890-99" },
  { value: "1880", label: "1880-89" },
  { value: "1870", label: "1870-79" },
]

export default function Home() {
  const [films, setFilms] = useState<Film[]>([])
  const [totalFilms, setTotalFilms] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedGenre, setSelectedGenre] = useState<string>("All genres")
  const [selectedYear, setSelectedYear] = useState<string>("all")
  const [selectedCountry, setSelectedCountry] = useState<string>("All countries")
  const [countries, setCountries] = useState<string[]>([])
  const [lastId, setLastId] = useState<string | number | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    // Load available countries
    const loadCountries = async () => {
      const countryList = await getCountries()
      setCountries(["All countries", ...countryList])
    }
    loadCountries()
  }, [])

  const fetchFilms = async (lastId?: string | number) => {
    try {
      const { films: newFilms, lastId: newLastId } = await getFilms(
        lastId, 
        selectedGenre, 
        selectedYear,
        selectedCountry
      )

      if (newFilms.length === 0) {
        setHasMore(false)
      } else {
        if (lastId) {
          setFilms(prev => [...prev, ...newFilms])
        } else {
          setFilms(newFilms)
        }
        setLastId(newLastId)
      }
    } catch (error) {
      console.error("Error fetching films:", error)
      setError("Failed to load films. Please try again later.")
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setLastId(null)
        setHasMore(true)
        setFilms([])

        // Fetch films and total count in parallel
        const [_, count] = await Promise.all([
          fetchFilms(),
          getTotalFilmsCount(
            selectedGenre, 
            selectedYear,
            selectedCountry
          )
        ])

        setTotalFilms(count)
      } catch (err) {
        console.error("Error fetching data:", err)
        setError("Failed to load films. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedGenre, selectedYear, selectedCountry])

  const loadMoreFilms = async () => {
    if (!hasMore || loadingMore) return

    setLoadingMore(true)
    try {
      await fetchFilms(lastId)
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold">MUBI by Country</h1>
        <a
          href="https://github.com/yourusername/mubi-by-country"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <Github className="h-5 w-5" />
          <span>GitHub</span>
        </a>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <div className="flex gap-4">
          <Select value={selectedGenre} onValueChange={setSelectedGenre}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select genre" />
            </SelectTrigger>
            <SelectContent>
              {GENRES.map((genre) => (
                <SelectItem key={genre} value={genre}>
                  {genre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((year) => (
                <SelectItem key={year.value} value={year.value}>
                  {year.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedCountry} onValueChange={setSelectedCountry}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="text-gray-500 font-medium">{totalFilms} films</span>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

      {loading ? (
        <LoadingFilms />
      ) : (
        <FilmGrid 
          films={films} 
          onLoadMore={loadMoreFilms}
          hasMore={hasMore}
          loadingMore={loadingMore}
        />
      )}

      <div className="mt-8 text-sm text-gray-500 text-center">
        <p>This website is not affiliated with, authorized, maintained, sponsored, or endorsed by MUBI or any of its affiliates or subsidiaries. This is an independent project created for educational purposes only.</p>
        <p className="mt-2">Made with ♥ in Porto</p>
      </div>
    </main>
  )
}

