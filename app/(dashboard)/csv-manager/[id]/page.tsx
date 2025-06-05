import { CsvFileView } from "@/components/csv/csv-file-view";

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function CsvFilePage({ params, searchParams }: Props) {
  const [{ id }, search] = await Promise.all([params, searchParams]);
  return <CsvFileView fileId={id} />;
}