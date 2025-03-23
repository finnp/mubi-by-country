"use client"

import { useState, useEffect } from "react"
import FilmGrid from "@/components/film-grid"
import LoadingFilms from "@/components/loading-films"
import { getFilms, getTotalFilmsCount } from "@/lib/firestore-service"
import type { Film } from "@/lib/types"

export default function Home() {
  const [films, setFilms] = useState<Film[]>([])
  const [totalFilms, setTotalFilms] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch films and total count in parallel
        const [filmsData, count] = await Promise.all([getFilms().then((result) => result.films), getTotalFilmsCount()])

        setFilms(filmsData)
        setTotalFilms(count)
      } catch (err) {
        console.error("Error fetching data:", err)
        setError("Failed to load films. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

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

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

      {loading ? <LoadingFilms /> : <FilmGrid initialFilms={films} />}

      <div className="mt-8 text-sm text-gray-500 text-center">
        <p>This website is not affiliated with, authorized, maintained, sponsored, or endorsed by MUBI or any of its affiliates or subsidiaries. This is an independent project created for educational purposes only.</p>
      </div>
    </main>
  )
}

