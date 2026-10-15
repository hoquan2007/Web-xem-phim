import Link from "next/link";
import { MovieListItem } from "@/types/movie";
import { MovieCard } from "@/components/ui/MovieCard";
export interface CountryGroup {
  id: string;
  title: string;
  viewAllHref: string;
  movies: MovieListItem[];
}
export function CountryMovieSection({ groups }: { groups: CountryGroup[] }) {
  return (
    <section>
      <div className="section-heading">
        <h2>Điện ảnh qua những vùng đất</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {groups
          .filter((g) => g.movies.length)
          .map((group) => (
            <div key={group.id}>
              <div className="flex justify-between items-center mb-3 gap-3">
                <h3 className="text-base font-semibold">{group.title}</h3>
                <Link className="text-link" href={group.viewAllHref}>
                  Khám phá →
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {group.movies.slice(0, 2).map((movie) => (
                  <MovieCard
                    key={movie._id}
                    movie={movie}
                    aspectRatio="landscape"
                  />
                ))}
              </div>
            </div>
          ))}
      </div>
    </section>
  );
}
