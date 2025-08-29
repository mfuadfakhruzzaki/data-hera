"use client";

import { useState, useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format, differenceInYears } from 'date-fns';

import { respondentSchema, type Respondent, type RespondentWithId } from '@/lib/definitions';
import { addRespondent, updateRespondent } from '@/app/actions';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from './ui/textarea';

type RespondentFormProps = {
  respondent?: RespondentWithId;
  onSuccess?: () => void;
};

export default function RespondentForm({ respondent, onSuccess }: RespondentFormProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [age, setAge] = useState<number | null>(null);
  const [bmi, setBmi] = useState<number | null>(null);

  const form = useForm<Respondent>({
    resolver: zodResolver(respondentSchema),
    defaultValues: respondent
      ? {
          ...respondent,
          dob: new Date(respondent.dob),
          semester: respondent.semester || undefined,
          height: respondent.height || undefined,
          weight: respondent.weight || undefined,
        }
      : {
          name: '',
          pob: '',
          gender: undefined,
          address: '',
          phone: '',
          medicalHistory: '',
          semester: '' as any,
          height: '' as any,
          weight: '' as any,
        },
  });

  const { watch, setValue } = form;
  const dob = watch('dob');
  const height = watch('height');
  const weight = watch('weight');

  useEffect(() => {
    if (dob) {
      setAge(differenceInYears(new Date(), dob));
    } else {
      setAge(null);
    }
  }, [dob]);

  useEffect(() => {
    if (height > 0 && weight > 0) {
      const heightInMeters = height / 100;
      const calculatedBmi = weight / (heightInMeters * heightInMeters);
      setBmi(parseFloat(calculatedBmi.toFixed(2)));
    } else {
      setBmi(null);
    }
  }, [height, weight]);

  const onSubmit = (data: Respondent) => {
    startTransition(async () => {
      // Because data is serialized when passing from client to server,
      // the Date object becomes a string. We handle this on the server.
      const dataToSend = {
          ...data,
          dob: data.dob.toISOString(),
      };
      
      const action = respondent 
        ? () => updateRespondent(respondent.id, dataToSend) 
        : () => addRespondent(dataToSend);

      const result = await action();
      if (result.success) {
        toast({
          title: 'Success!',
          description: result.message,
        });
        if (!respondent) {
          form.reset();
          setAge(null);
          setBmi(null);
        }
        onSuccess?.();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.message,
        });
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama</FormLabel>
                <FormControl>
                  <Input placeholder="Nama Lengkap" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="pob"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tempat Lahir</FormLabel>
                <FormControl>
                  <Input placeholder="Kota Kelahiran" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dob"
            render={({ field }) => (
              <FormItem className="flex flex-col pt-2">
                <FormLabel>Tanggal Lahir</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={'outline'}
                        className={cn('w-full justify-start pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                      >
                        {field.value ? format(field.value, 'PPP') : <span>Pilih tanggal</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      captionLayout="dropdown-buttons"
                      fromYear={1900}
                      toYear={new Date().getFullYear()}
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem className="flex flex-col pt-2">
                <FormLabel>Jenis Kelamin</FormLabel>
                 <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis kelamin" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="male">Laki-laki</SelectItem>
                    <SelectItem value="female">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Alamat</FormLabel>
                <FormControl>
                  <Textarea placeholder="Jl. Jendral Sudirman No. 1, Jakarta" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="semester"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Semester</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="1" {...field} onChange={event => field.onChange(+event.target.value)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>No. Whatsapp</FormLabel>
                <FormControl>
                  <Input placeholder="08..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="height"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tinggi Badan (cm)</FormLabel>
                <FormControl>
                   <Input type="number" placeholder="175" {...field} onChange={event => field.onChange(+event.target.value)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Berat Badan (kg)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="70" {...field} onChange={event => field.onChange(+event.target.value)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
            <FormField
            control={form.control}
            name="medicalHistory"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Riwayat Penyakit</FormLabel>
                <FormControl>
                  <Textarea placeholder="Contoh: Asma, Diabetes" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <Card>
                <CardContent className="p-4">
                    <p className="text-sm font-medium text-muted-foreground">Umur</p>
                    <p className="text-2xl font-bold">{age !== null ? `${age} tahun` : 'N/A'}</p>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-4">
                    <p className="text-sm font-medium text-muted-foreground">IMT (BMI)</p>
                    <p className="text-2xl font-bold">{bmi !== null ? bmi : 'N/A'}</p>
                </CardContent>
            </Card>
        </div>

        <Button type="submit" disabled={isPending} className="w-full md:w-auto !mt-8">
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {respondent ? 'Update Responden' : 'Tambah Responden'}
        </Button>
      </form>
    </Form>
  );
}
