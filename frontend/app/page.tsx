"use client"

import { useState, useEffect } from "react"
import FilmGrid from "@/components/film-grid"
import LoadingFilms from "@/components/loading-films"
import { getFilms, getTotalFilmsCount } from "@/lib/firestore-service"
import type { Film } from "@/lib/types"
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore"
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
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | undefined>(undefined)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const fetchFilms = async (lastDoc?: QueryDocumentSnapshot<DocumentData>) => {
    try {
      const { films: newFilms, lastDoc: newLastDoc } = await getFilms(
        lastDoc, 
        selectedGenre, 
        selectedYear === "all" ? undefined : selectedYear
      )

      if (newFilms.length === 0) {
        setHasMore(false)
      } else {
        if (lastDoc) {
          setFilms(prev => [...prev, ...newFilms])
        } else {
          setFilms(newFilms)
        }
        if (newLastDoc) {
          setLastDoc(newLastDoc)
        }
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
        setLastDoc(undefined)
        setHasMore(true)
        setFilms([])

        // Fetch films and total count in parallel
        const [_, count] = await Promise.all([
          fetchFilms(),
          getTotalFilmsCount(
            selectedGenre, 
            selectedYear === "all" ? undefined : selectedYear
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
  }, [selectedGenre, selectedYear])

  const loadMoreFilms = async () => {
    if (!hasMore || loadingMore) return

    setLoadingMore(true)
    try {
      await fetchFilms(lastDoc)
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 
          className="text-2xl font-bold mb-2"
          title="This website is not affiliated with, authorized, maintained, sponsored, or endorsed by MUBI or any of its affiliates or subsidiaries. This is an independent project created for educational purposes only."
        >
          Mubi by Country
        </h1>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <a 
            href="https://github.com/finnp/mubi-by-country" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-gray-700 transition-colors flex items-center gap-1"
            title="View on GitHub"
          >
            <Github className="w-4 h-4" />
            Contribute to this project on GitHub
          </a>
          <span>•</span>
          <span>Not affiliated with MUBI</span>
        </div>
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

