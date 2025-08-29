import { z } from 'zod';

export const respondentSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  dob: z.date({ required_error: "Date of birth is required." }),
  phone: z.string().min(10, { message: "Please enter a valid phone number." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  height: z.coerce.number().positive({ message: "Height must be a positive number." }).min(1, { message: "Height is required." }),
  weight: z.coerce.number().positive({ message: "Weight must be a positive number." }).min(1, { message: "Weight is required." }),
});

export const respondentSchemaWithId = respondentSchema.extend({
  id: z.string(),
});

export type Respondent = z.infer<typeof respondentSchema>;
export type RespondentWithId = z.infer<typeof respondentSchemaWithId>;

// Type for data coming from Firestore, with Timestamps converted to strings
export type RespondentFromFirestore = Omit<RespondentWithId, 'dob' | 'createdAt'> & {
  dob: string;
  createdAt: string;
};
