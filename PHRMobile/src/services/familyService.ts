import api from './api'

export interface FamilyMember {
  _id: string
  userId: string
  name: string
  relation: string
  gender?: 'M' | 'F' | 'Other'
  dob?: string
  bloodGroup?: string
  phone?: string
  createdAt: string
}

export interface FamilyMemberPayload {
  name: string
  relation: string
  gender?: 'M' | 'F' | 'Other'
  dob?: string
  bloodGroup?: string
  phone?: string
}

interface ListResponse {
  success: boolean
  count: number
  data: FamilyMember[]
}

interface SingleResponse {
  success: boolean
  data: FamilyMember
}

export function getFamilyMembers(): Promise<ListResponse> {
  return api.get<never, ListResponse>('/family-members')
}

export function getFamilyMemberById(id: string): Promise<SingleResponse> {
  return api.get<never, SingleResponse>(`/family-members/${id}`)
}

export function addFamilyMember(payload: FamilyMemberPayload): Promise<SingleResponse> {
  return api.post<never, SingleResponse>('/family-members', payload)
}

export function updateFamilyMember(id: string, payload: Partial<FamilyMemberPayload>): Promise<SingleResponse> {
  return api.put<never, SingleResponse>(`/family-members/${id}`, payload)
}

export function deleteFamilyMember(id: string): Promise<{ success: boolean; message: string }> {
  return api.delete(`/family-members/${id}`)
}
