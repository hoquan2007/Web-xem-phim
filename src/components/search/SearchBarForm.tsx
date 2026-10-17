"use client";
import { MovieSearch } from "./MovieSearch";
export default function SearchBarForm({
  initialKeyword = "",
  onNavigate,
}: {
  initialKeyword?: string;
  onNavigate?: () => void;
}) {
  return <MovieSearch initialKeyword={initialKeyword} onNavigate={onNavigate} />;
}
