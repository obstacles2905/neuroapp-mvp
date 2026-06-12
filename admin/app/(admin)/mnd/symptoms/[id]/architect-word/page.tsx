import { ArchitectWordSlotsEditor } from '@/components/mnd/architect-word-slots-editor';
import { buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { apiGet } from '@/lib/api/server-client';
import type { ArchitectWordAdminSlot } from '@/lib/types/architect-word';
import type { LocalizedText, MndSymptom } from '@/lib/types/api';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type PageProps = {
  params: Promise<{ id: string }>;
};

function text(value?: LocalizedText | null): string {
  if (!value) {
    return '—';
  }
  return value.ru || value.uk || value.en || '—';
}

export default async function ArchitectWordPage(props: PageProps) {
  const { id } = await props.params;
  const [symptom, slots] = await Promise.all([
    apiGet<MndSymptom>(`/mnd/symptoms/${id}`),
    apiGet<ArchitectWordAdminSlot[]>(`/mnd/symptoms/${id}/architect-word`),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Слово Архитектора
          </p>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {text(symptom.title)}
          </h1>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {symptom.code}
          </p>
        </div>
        <Link href="/mnd" className={cn(buttonVariants({ variant: 'outline' }))}>
          ← MND
        </Link>
      </div>

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle>Два слота видео</CardTitle>
          <CardDescription>
            На каждый симптом — ровно два коротких ролика. Порядок блоков
            симптомов в приложении перемешивается.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ArchitectWordSlotsEditor symptomId={id} initialSlots={slots} />
        </CardContent>
      </Card>
    </div>
  );
}
