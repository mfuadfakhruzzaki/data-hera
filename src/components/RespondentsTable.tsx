"use client";

import { useState, useMemo, useTransition } from 'react';
import { differenceInYears, format } from 'date-fns';
import { ArrowUpDown, Trash, Edit, Download, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import RespondentForm from './RespondentForm';
import type { RespondentFromFirestore, RespondentWithId } from '@/lib/definitions';
import { deleteRespondent } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

type SortConfig = {
  key: keyof FormattedRespondent;
  direction: 'ascending' | 'descending';
} | null;

type FormattedRespondent = RespondentFromFirestore & {
  age: number;
  bmi: number;
};

function EditDialog({ respondent, onUpdateSuccess }: { respondent: RespondentWithId, onUpdateSuccess: (respondent: RespondentWithId) => void }) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleSuccess = () => {
    // We need to construct the updated respondent object to pass back up
    // This is a bit of a workaround as the form doesn't return the full updated object
    // A better solution might involve the update action returning the updated object
    onUpdateSuccess(respondent); 
    setIsEditDialogOpen(false);
  };

  return (
     <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
      <DialogTrigger asChild>
         <Button variant="ghost" size="icon">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Responden</DialogTitle>
        </DialogHeader>
        <RespondentForm respondent={respondent} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  )
}


export default function RespondentsTable({ initialData }: { initialData: RespondentFromFirestore[] }) {
  const [data, setData] = useState<RespondentFromFirestore[]>(initialData);
  const [filter, setFilter] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const formattedData = useMemo(() => {
    return data.map((item) => {
      const dob = new Date(item.dob);
      const age = differenceInYears(new Date(), dob);
      const heightInMeters = item.height / 100;
      const bmi = (item.weight && item.height) ? parseFloat((item.weight / (heightInMeters * heightInMeters)).toFixed(2)) : 0;
      return { ...item, age, bmi };
    });
  }, [data]);

  const filteredData = useMemo(() => {
    let sortableItems = [...formattedData];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return sortableItems.filter((item) =>
      item.name.toLowerCase().includes(filter.toLowerCase()) ||
      item.phone.includes(filter)
    );
  }, [formattedData, filter, sortConfig]);

  const requestSort = (key: keyof FormattedRespondent) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteRespondent(id);
      if (result.success) {
        setData((prevData) => prevData.filter((item) => item.id !== id));
        toast({ title: 'Success', description: result.message });
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  };

  const handleUpdateSuccess = (updatedRespondent: RespondentWithId) => {
    // The form doesn't give us the updated data directly, so we have to refetch or manually merge.
    // For now, let's just optimistically update with the data we have.
    // A robust solution would have `updateRespondent` return the updated doc.
    setData(prevData => prevData.map(r => r.id === updatedRespondent.id ? { ...r, ...updatedRespondent, dob: new Date(updatedRespondent.dob).toISOString() } : r));
    
    // This is a bit of a hack to refresh data from server. Revalidating path should do this, but client state needs update.
    // A better approach would be to use a state management library that automatically re-fetches.
    async function refetch() {
        const { getRespondents } = await import('@/app/actions');
        const respondents = await getRespondents();
        setData(respondents);
    }
    refetch();
  };
  
  const exportToCsv = () => {
    const headers = ['ID', 'Name', 'Place of Birth', 'Date of Birth', 'Age', 'Gender', 'Address', 'Semester', 'Phone', 'Height (cm)', 'Weight (kg)', 'BMI', 'Medical History', 'Created At'];
    const csvRows = [headers.join(',')];
    
    for (const row of filteredData) {
      const values = [
        row.id,
        `"${row.name.replace(/"/g, '""')}"`,
        `"${row.pob.replace(/"/g, '""')}"`,
        format(new Date(row.dob), 'yyyy-MM-dd'),
        row.age,
        row.gender,
        `"${row.address.replace(/"/g, '""')}"`,
        row.semester,
        row.phone,
        row.height,
        row.weight,
        row.bmi,
        `"${(row.medicalHistory || '').replace(/"/g, '""')}"`,
        format(new Date(row.createdAt), 'yyyy-MM-dd HH:mm:ss')
      ];
      csvRows.push(values.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `respondents_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  const headers: { key: keyof FormattedRespondent; label: string }[] = [
    { key: 'name', label: 'Nama' },
    { key: 'age', label: 'Umur' },
    { key: 'gender', label: 'Jenis Kelamin' },
    { key: 'semester', label: 'Semester' },
    { key: 'phone', label: 'No. Whatsapp' },
    { key: 'bmi', label: 'IMT' },
    { key: 'createdAt', label: 'Tgl. Pengambilan' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Filter by name or phone..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={exportToCsv} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((header) => (
                <TableHead key={header.key}>
                  <Button
                    variant="ghost"
                    onClick={() => requestSort(header.key)}
                    className="px-0 hover:bg-transparent"
                  >
                    {header.label}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
              ))}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.age}</TableCell>
                  <TableCell>{item.gender === 'male' ? 'Laki-laki' : 'Perempuan'}</TableCell>
                  <TableCell>{item.semester}</TableCell>
                  <TableCell>{item.phone}</TableCell>
                  <TableCell>{item.bmi || 'N/A'}</TableCell>
                  <TableCell>{format(new Date(item.createdAt), 'dd-MM-yyyy')}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                       <EditDialog respondent={item} onUpdateSuccess={handleUpdateSuccess} />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash className="h-4 w-4" />}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the respondent's data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(item.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={headers.length + 1} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
