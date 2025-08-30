import { getRespondents } from '@/app/actions';
import AppLayout from '@/components/layout/AppLayout';
import RespondentsTable from '@/components/RespondentsTable';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default async function DataPage() {
  const respondents = await getRespondents();

  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8">
        <div className="flex items-center justify-between space-y-2">
          
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Responden</CardTitle>
                <CardDescription>Lihat, edit, dan kelola data responden.</CardDescription>
            </CardHeader>
            <CardContent>
                <RespondentsTable initialData={respondents} />
            </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
