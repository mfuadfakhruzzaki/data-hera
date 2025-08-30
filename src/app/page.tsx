import AppLayout from '@/components/layout/AppLayout';
import RespondentForm from '@/components/RespondentForm';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function Home() {
  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8">
        <div className="flex items-center justify-between space-y-2">
          
        </div>
        <Card className="max-w-3xl mx-auto">
            <CardHeader>
                <CardTitle>Responden Baru</CardTitle>
                <CardDescription>Isi formulir untuk menambahkan responden baru. Umur dan IMT akan dihitung secara otomatis.</CardDescription>
            </CardHeader>
            <CardContent>
                <RespondentForm />
            </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
