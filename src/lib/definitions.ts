import { z } from 'zod';

export const respondentSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  pob: z.string().min(2, { message: "Place of birth must be at least 2 characters." }),
  dob: z.date({ required_error: "Date of birth is required." }),
  gender: z.enum(['male', 'female'], { required_error: "Gender is required." }),
  address: z.string().min(5, { message: "Address must be at least 5 characters." }),
  semester: z.coerce.number().min(1, { message: "Semester must be at least 1." }),
  phone: z.string().min(10, { message: "Please enter a valid phone number." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  height: z.coerce.number().positive({ message: "Height must be a positive number." }).min(1, { message: "Height is required." }),
  weight: z.coerce.number().positive({ message: "Weight must be a positive number." }).min(1, { message: "Weight is required." }),
  medicalHistory: z.string().optional(),
});

export type Respondent = z.infer<typeof respondentSchema>;

export type RespondentWithId = Respondent & {
  id: string;
}

// Type for data coming from Firestore, with Timestamps converted to strings
export type RespondentFromFirestore = Omit<RespondentWithId, 'dob' | 'createdAt'> & {
  dob: string;
  createdAt: string;
};
