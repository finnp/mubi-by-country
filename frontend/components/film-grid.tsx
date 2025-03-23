"use client"

import FilmCard from "@/components/film-card"
import type { Film } from "@/lib/types"
import { Button } from "@/components/ui/button"
import LoadingFilms from "./loading-films"

interface FilmGridProps {
  films: Film[]
  onLoadMore: () => Promise<void>
  hasMore: boolean
  loadingMore: boolean
}

export default function FilmGrid({ films, onLoadMore, hasMore, loadingMore }: FilmGridProps) {
  if (films.length === 0 && !loadingMore) {
    return <div className="text-center py-10">No films found</div>
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {films.map((film) => (
          <FilmCard key={film.id} film={film} />
        ))}
      </div>

      {loadingMore && (
        <div className="mt-8">
          <LoadingFilms />
        </div>
      )}

      {hasMore && !loadingMore && (
        <div className="mt-8 flex justify-center">
          <Button onClick={onLoadMore} variant="outline" className="px-6">
            Load More
          </Button>
        </div>
      )}
    </div>
  )
}

