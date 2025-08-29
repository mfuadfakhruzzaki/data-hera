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

export default function RespondentsTable({ initialData }: { initialData: RespondentFromFirestore[] }) {
  const [data, setData] = useState<RespondentFromFirestore[]>(initialData);
  const [filter, setFilter] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [isPending, startTransition] = useTransition();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const formattedData = useMemo(() => {
    return data.map((item) => {
      const dob = new Date(item.dob);
      const age = differenceInYears(new Date(), dob);
      const heightInMeters = item.height / 100;
      const bmi = parseFloat((item.weight / (heightInMeters * heightInMeters)).toFixed(2));
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
      item.email.toLowerCase().includes(filter.toLowerCase()) ||
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
    setIsEditDialogOpen(false);
    setData(prevData => prevData.map(r => r.id === updatedRespondent.id ? { ...r, ...updatedRespondent, dob: updatedRespondent.dob.toISOString() } : r));
  };
  
  const exportToCsv = () => {
    const headers = ['ID', 'Name', 'Date of Birth', 'Age', 'Phone', 'Email', 'Height (cm)', 'Weight (kg)', 'BMI', 'Created At'];
    const csvRows = [headers.join(',')];
    
    for (const row of filteredData) {
      const values = [
        row.id,
        `"${row.name.replace(/"/g, '""')}"`,
        format(new Date(row.dob), 'yyyy-MM-dd'),
        row.age,
        row.phone,
        row.email,
        row.height,
        row.weight,
        row.bmi,
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
    { key: 'name', label: 'Name' },
    { key: 'age', label: 'Age' },
    { key: 'phone', label: 'WhatsApp' },
    { key: 'email', label: 'Email' },
    { key: 'height', label: 'Height (cm)' },
    { key: 'weight', label: 'Weight (kg)' },
    { key: 'bmi', label: 'BMI' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Filter by name, email, or phone..."
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
                  <Button variant="ghost" onClick={() => requestSort(header.key)}>
                    {header.label}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
              ))}
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.age}</TableCell>
                  <TableCell>{item.phone}</TableCell>
                  <TableCell>{item.email}</TableCell>
                  <TableCell>{item.height}</TableCell>
                  <TableCell>{item.weight}</TableCell>
                  <TableCell>{item.bmi}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                       <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogTrigger asChild>
                           <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Respondent</DialogTitle>
                          </DialogHeader>
                          <RespondentForm respondent={item} onSuccess={() => setIsEditDialogOpen(false)} />
                        </DialogContent>
                      </Dialog>
                      
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
