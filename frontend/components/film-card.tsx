"use client"

import Image from "next/image"
import Link from "next/link"
import { Clock, Globe, Award, Play } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { Film } from "@/lib/types"
import { useState } from "react"

interface FilmCardProps {
  film: Film
}

export default function FilmCard({ film }: FilmCardProps) {
  const [imageError, setImageError] = useState(false)

  // Format the rating to display with one decimal place
  const formattedRating = film.average_rating_out_of_ten ? film.average_rating_out_of_ten.toFixed(1) : "N/A"

  // Get the first director's name
  const directorName = film.directors && film.directors.length > 0 ? film.directors[0].name : ""

  // Get the first country
  const country = film.historic_countries && film.historic_countries.length > 0 ? film.historic_countries[0] : ""

  // Fallback image
  const fallbackImage = "/placeholder.svg?height=400&width=600"

  // Get image source with fallback
  const imageSource =
    imageError || !film.stills || !film.stills.large_overlaid ? fallbackImage : film.stills.large_overlaid

  return (
    <Link href={film.web_url || "#"} target="_blank" className="block">
      <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="relative aspect-video">
          <Image
            src={imageSource || "/placeholder.svg"}
            alt={film.title || "Film thumbnail"}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/30 backdrop-blur-sm rounded-full p-3">
              <Play className="h-8 w-8 text-white fill-white" />
            </div>
          </div>
          {film.hd && (
            <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">HD</div>
          )}
        </div>

        <div className="p-4">
          <h3 className="text-lg font-bold">{film.title || "Untitled Film"}</h3>
          {film.original_title && film.original_title !== film.title && (
            <span className="text-gray-500 text-sm">{film.original_title}</span>
          )}

          <div className="text-gray-500 text-sm mt-1">
            {directorName && `${directorName}, `}
            {film.year || "Unknown"}
            {country && `, ${country}`}
          </div>

          <div className="flex flex-wrap gap-4 mt-3">
            {film.duration && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{film.duration} mins</span>
              </div>
            )}

            {film.average_rating_out_of_ten && (
              <div className="flex items-center gap-1">
                <span className="text-yellow-500">★</span>
                <span>
                  {formattedRating} / 10 {film.number_of_ratings && `(${film.number_of_ratings})`}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-4 mt-2">
            {film.available_countries && film.available_countries.length > 0 && (
              <div className="flex items-center gap-1">
                <Globe className="h-4 w-4" />
                <span>{film.available_countries.length} country</span>
              </div>
            )}

            {film.highlighted_industry_event_entry && (
              <div className="flex items-center gap-1">
                <Award className="h-4 w-4" />
                <span>{film.highlighted_industry_event_entry.display_text}</span>
              </div>
            )}
          </div>

          {film.genres && film.genres.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {film.genres.slice(0, 3).map((genre) => (
                <Badge key={genre} variant="secondary" className="rounded-md">
                  {genre}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

