import { CsvFileView } from "@/components/csv/csv-file-view";

export const dynamic = 'force-dynamic';

export default function CsvFilePage({ params }: { params: { id: string } }) {
  return <CsvFileView fileId={params.id} />;
}