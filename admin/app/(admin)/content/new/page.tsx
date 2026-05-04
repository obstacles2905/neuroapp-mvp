import { NewCategoryForm } from '@/components/forms/new-category-form';
import Link from 'next/link';

export default function NewCategoryPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <Link
          href="/content"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          ← К категориям
        </Link>
        <h1 className="mt-4 font-heading text-2xl font-semibold tracking-tight text-foreground">
          Новая категория
        </h1>
      </div>
      <NewCategoryForm />
    </div>
  );
}
