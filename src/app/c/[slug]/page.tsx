import { notFound } from "next/navigation";
import CountryPage, {
  generateMetadata as countryMetadata,
} from "@/app/quoc-gia/[slug]/page";
import CategoryPage, {
  generateMetadata as categoryMetadata,
} from "@/app/the-loai/[slug]/page";
import FilterListPage, {
  generateMetadata as listMetadata,
  type FilterListPageProps,
} from "@/components/filter/FilterListPage";

type Query = Record<string, string | string[] | undefined>;
interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Query>;
}

const collections: Record<
  string,
  { kind: "country" | "category" | "type"; slug: string }
> = {
  "phim-han-quoc-moi": { kind: "country", slug: "han-quoc" },
  "phim-trung-quoc-moi": { kind: "country", slug: "trung-quoc" },
  "phim-hoat-hinh-anime": { kind: "type", slug: "hoat-hinh" },
  "tv-shows-chuong-trinh-truyen-hinh": { kind: "type", slug: "tv-shows" },
  "phim-chieu-rap-moi": { kind: "type", slug: "phim-chieu-rap" },
  "phim-us-uk-moi": { kind: "country", slug: "au-my" },
  "phim-thai-lan": { kind: "country", slug: "thai-lan" },
};

export async function generateMetadata({ params, searchParams }: Props) {
  const { slug } = await params;
  const collection = Object.hasOwn(collections, slug)
    ? collections[slug]
    : undefined;
  if (!collection) return { title: "Chủ đề không tồn tại" };
  if (collection.kind === "type")
    return listMetadata({
      defaultType: collection.slug as FilterListPageProps["defaultType"],
      searchParams,
    });
  const props = {
    params: Promise.resolve({ slug: collection.slug }),
    searchParams,
  };
  return collection.kind === "country"
    ? countryMetadata(props)
    : categoryMetadata(props);
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const collection = Object.hasOwn(collections, slug)
    ? collections[slug]
    : undefined;
  if (!collection) notFound();
  if (collection.kind === "type")
    return (
      <FilterListPage
        defaultType={collection.slug as FilterListPageProps["defaultType"]}
        baseUrl={`/c/${slug}`}
        searchParams={searchParams}
      />
    );
  const props = {
    params: Promise.resolve({ slug: collection.slug }),
    searchParams,
  };
  return collection.kind === "country" ? (
    <CountryPage {...props} />
  ) : (
    <CategoryPage {...props} />
  );
}
