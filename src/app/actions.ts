"use server";

import { revalidatePath } from 'next/cache';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, Timestamp, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { respondentSchema, type Respondent, type RespondentFromFirestore } from '@/lib/definitions';

type ActionResponse = {
  success: boolean;
  message: string;
}

export async function addRespondent(data: Respondent): Promise<ActionResponse> {
  const validatedFields = respondentSchema.safeParse(data);

  if (!validatedFields.success) {
    return { success: false, message: "Validation failed. Please check your input." };
  }

  const { phone } = validatedFields.data;

  try {
    const q = query(collection(db, 'respondents'), where('phone', '==', phone));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return { success: false, message: "A respondent with this WhatsApp number already exists." };
    }

    await addDoc(collection(db, 'respondents'), {
      ...validatedFields.data,
      dob: Timestamp.fromDate(validatedFields.data.dob),
      createdAt: serverTimestamp(),
    });

    revalidatePath('/data');
    return { success: true, message: "Respondent added successfully." };
  } catch (error) {
    console.error("Error adding respondent:", error);
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function getRespondents(): Promise<RespondentFromFirestore[]> {
  try {
    const q = query(collection(db, 'respondents'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        dob: (data.dob as Timestamp).toDate().toISOString(),
        phone: data.phone,
        email: data.email,
        height: data.height,
        weight: data.weight,
        createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
      };
    });
  } catch (error) {
    console.error("Error fetching respondents:", error);
    return [];
  }
}

export async function updateRespondent(id: string, data: Respondent): Promise<ActionResponse> {
  const validatedFields = respondentSchema.safeParse(data);

  if (!validatedFields.success) {
    return { success: false, message: "Validation failed. Please check your input." };
  }
  
  const { phone } = validatedFields.data;

  try {
     const q = query(collection(db, 'respondents'), where('phone', '==', phone));
     const querySnapshot = await getDocs(q);
     if (!querySnapshot.empty && querySnapshot.docs[0].id !== id) {
       return { success: false, message: "Another respondent with this WhatsApp number already exists." };
     }

    const respondentRef = doc(db, 'respondents', id);
    await updateDoc(respondentRef, {
        ...validatedFields.data,
        dob: Timestamp.fromDate(validatedFields.data.dob),
    });

    revalidatePath('/data');
    return { success: true, message: "Respondent updated successfully." };
  } catch (error) {
    console.error("Error updating respondent:", error);
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function deleteRespondent(id: string): Promise<ActionResponse> {
  try {
    await deleteDoc(doc(db, 'respondents', id));
    revalidatePath('/data');
    return { success: true, message: "Respondent deleted successfully." };
  } catch (error) {
    console.error("Error deleting respondent:", error);
    return { success: false, message: "An unexpected error occurred." };
  }
}
