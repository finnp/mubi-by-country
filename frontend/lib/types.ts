export interface Director {
  name: string
  name_upcase?: string
  slug?: string
}

export interface ContentWarning {
  id: number
  name: string
  key: string
}

export interface ContentRating {
  label: string
  rating_code: string
  description: string
  icon_url: string | null
  label_hex_color: string
}

export interface Stills {
  small?: string
  medium?: string
  standard?: string
  retina?: string
  small_overlaid?: string
  large_overlaid?: string
}

export interface Artwork {
  format: string
  locale: string | null
  image_url: string
}

export interface OptimisedTrailer {
  url: string
  profile: string
}

export interface IndustryEvent {
  id: number
  name: string
  slug: string
  type: string
  logo_url: string
  white_logo_url: string
  cover_url: string
}

export interface HighlightedIndustryEventEntry {
  id: number
  year: number
  status: string
  display_text: string
  full_display_text: string
  industry_event: IndustryEvent
}

export interface Film {
  id: string | number
  slug?: string
  title?: string
  title_locale?: string
  original_title?: string
  year?: number
  duration?: number
  stills?: Stills
  still_focal_point?: {
    x: number
    y: number
  }
  hd?: boolean
  average_colour_hex?: string
  trailer_url?: string
  trailer_id?: number
  popularity?: number
  web_url?: string
  genres?: string[]
  average_rating?: number
  average_rating_out_of_ten?: number
  number_of_ratings?: number
  mubi_release?: boolean
  should_use_safe_still?: boolean
  still_url?: string
  title_upcase?: string
  critic_review_rating?: number
  content_rating?: ContentRating
  short_synopsis?: string
  short_synopsis_html?: string
  episode?: any
  historic_countries?: string[]
  portrait_image?: any
  title_treatment_url?: any
  default_editorial?: string
  default_editorial_html?: string
  cast_members_count?: number
  industry_events_count?: number
  comments_count?: number
  mubi_go_highlighted?: boolean
  optimised_trailers?: OptimisedTrailer[]
  directors?: Director[]
  consumable?: any
  press_quote?: any
  star_rating?: any
  award?: any
  experiment_stills?: any
  content_warnings?: ContentWarning[]
  artworks?: Artwork[]
  highlighted_industry_event_entry?: HighlightedIndustryEventEntry | null
  available_countries: string[]
}

