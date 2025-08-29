import AppLayout from '@/components/layout/AppLayout';
import RespondentForm from '@/components/RespondentForm';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function Home() {
  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Respondent Entry</h1>
        </div>
        <Card className="max-w-3xl mx-auto">
            <CardHeader>
                <CardTitle>New Respondent</CardTitle>
                <CardDescription>Fill out the form to add a new respondent. Age and BMI will be calculated automatically.</CardDescription>
            </CardHeader>
            <CardContent>
                <RespondentForm />
            </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
