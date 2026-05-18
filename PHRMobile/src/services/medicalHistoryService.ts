import api from './api'

export interface Condition {
  _id: string
  name: string
  diagnosedAt?: string
  notes?: string
}

export interface Allergy {
  _id: string
  name: string
  severity?: 'mild' | 'moderate' | 'severe'
  reaction?: string
}

export interface Medication {
  _id: string
  name: string
  dose: string
  frequency: string
  since: string
  notes?: string
}

export interface MedicalHistoryData {
  conditions: Condition[]
  allergies: Allergy[]
  medications: Medication[]
}

interface MedHistResponse<T> { success: boolean; data: T }

export async function getMedicalHistory(): Promise<MedHistResponse<MedicalHistoryData>> {
  return api.get('/medical-history')
}

// Conditions
export async function addCondition(payload: Omit<Condition, '_id'>): Promise<MedHistResponse<Condition[]>> {
  return api.post('/medical-history/conditions', payload)
}
export async function updateCondition(id: string, payload: Partial<Omit<Condition, '_id'>>): Promise<MedHistResponse<Condition[]>> {
  return api.put(`/medical-history/conditions/${id}`, payload)
}
export async function deleteCondition(id: string): Promise<MedHistResponse<Condition[]>> {
  return api.delete(`/medical-history/conditions/${id}`)
}

// Allergies
export async function addAllergy(payload: Omit<Allergy, '_id'>): Promise<MedHistResponse<Allergy[]>> {
  return api.post('/medical-history/allergies', payload)
}
export async function updateAllergy(id: string, payload: Partial<Omit<Allergy, '_id'>>): Promise<MedHistResponse<Allergy[]>> {
  return api.put(`/medical-history/allergies/${id}`, payload)
}
export async function deleteAllergy(id: string): Promise<MedHistResponse<Allergy[]>> {
  return api.delete(`/medical-history/allergies/${id}`)
}

// Medications
export async function addMedication(payload: Omit<Medication, '_id'>): Promise<MedHistResponse<Medication[]>> {
  return api.post('/medical-history/medications', payload)
}
export async function updateMedication(id: string, payload: Partial<Omit<Medication, '_id'>>): Promise<MedHistResponse<Medication[]>> {
  return api.put(`/medical-history/medications/${id}`, payload)
}
export async function deleteMedication(id: string): Promise<MedHistResponse<Medication[]>> {
  return api.delete(`/medical-history/medications/${id}`)
}
