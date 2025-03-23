"use client"

import { useState } from "react"
import FilmCard from "@/components/film-card"
import type { Film } from "@/lib/types"
import { getFilms } from "@/lib/firestore-service"
import { Button } from "@/components/ui/button"
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore"
import LoadingFilms from "./loading-films"

interface FilmGridProps {
  initialFilms: Film[]
}

export default function FilmGrid({ initialFilms }: FilmGridProps) {
  const [films, setFilms] = useState<Film[]>(initialFilms)
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const loadMoreFilms = async () => {
    if (!hasMore || loading) return

    setLoading(true)
    try {
      const { films: newFilms, lastDoc: newLastDoc } = await getFilms(lastDoc)

      if (newFilms.length === 0) {
        setHasMore(false)
      } else {
        setFilms((prevFilms) => [...prevFilms, ...newFilms])
        setLastDoc(newLastDoc)
      }
    } catch (error) {
      console.error("Error loading more films:", error)
    } finally {
      setLoading(false)
    }
  }

  if (films.length === 0 && !loading) {
    return <div className="text-center py-10">No films found</div>
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {films.map((film) => (
          <FilmCard key={film.id} film={film} />
        ))}
      </div>

      {loading && (
        <div className="mt-8">
          <LoadingFilms />
        </div>
      )}

      {hasMore && !loading && (
        <div className="mt-8 flex justify-center">
          <Button onClick={loadMoreFilms} variant="outline" className="px-6">
            Load More
          </Button>
        </div>
      )}
    </div>
  )
}

