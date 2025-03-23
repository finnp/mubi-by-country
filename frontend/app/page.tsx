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

export default function Home() {
  const [films, setFilms] = useState<Film[]>([])
  const [totalFilms, setTotalFilms] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedGenre, setSelectedGenre] = useState<string>("All genres")
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | undefined>(undefined)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const fetchFilms = async (lastDoc?: QueryDocumentSnapshot<DocumentData>) => {
    try {
      const { films: newFilms, lastDoc: newLastDoc } = await getFilms(lastDoc, selectedGenre)

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
          getTotalFilmsCount(selectedGenre)
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
  }, [selectedGenre])

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
      <div className="mb-6 flex justify-between items-center">
        <h1 
          className="text-2xl font-bold"
          title="This website is not affiliated with, authorized, maintained, sponsored, or endorsed by MUBI or any of its affiliates or subsidiaries. This is an independent project created for educational purposes only."
        >
          Mubi by Country
        </h1>
        <span className="text-gray-500 font-medium">{totalFilms} films</span>
      </div>

      <div className="mb-6">
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
      </div>
    </main>
  )
}

