import FilterListPage, { generateMetadata as createMetadata, type FilterListPageProps } from "@/components/filter/FilterListPage";

type Props = Pick<FilterListPageProps, "searchParams">;
export async function generateMetadata(props: Props) {
  return createMetadata({ ...props, defaultType: "single" });
}
export default function Page(props: Props) {
  return <FilterListPage {...props} defaultType="single" baseUrl="/phim-le" />;
}
