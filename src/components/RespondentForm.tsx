"use client";

import { useState, useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format, differenceInYears } from 'date-fns';

import { respondentSchema, type Respondent } from '@/lib/definitions';
import { addRespondent, updateRespondent } from '@/app/actions';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from './ui/card';

type RespondentFormProps = {
  respondent?: Respondent & { id: string };
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
        }
      : {
          name: '',
          phone: '',
          email: '',
          height: 0,
          weight: 0,
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
      const action = respondent ? () => updateRespondent(respondent.id, data) : () => addRespondent(data);
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dob"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date of Birth</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={'outline'}
                        className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                      >
                        {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
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
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>WhatsApp Number</FormLabel>
                <FormControl>
                  <Input placeholder="+1234567890" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="john.doe@example.com" {...field} />
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
                <FormLabel>Height (cm)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="175" {...field} />
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
                <FormLabel>Weight (kg)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="70" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
                <CardContent className="p-4">
                    <p className="text-sm font-medium text-muted-foreground">Calculated Age</p>
                    <p className="text-2xl font-bold">{age !== null ? `${age} years` : 'N/A'}</p>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-4">
                    <p className="text-sm font-medium text-muted-foreground">Calculated BMI</p>
                    <p className="text-2xl font-bold">{bmi !== null ? bmi : 'N/A'}</p>
                </CardContent>
            </Card>
        </div>

        <Button type="submit" disabled={isPending} className="w-full md:w-auto">
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {respondent ? 'Update Respondent' : 'Add Respondent'}
        </Button>
      </form>
    </Form>
  );
}
