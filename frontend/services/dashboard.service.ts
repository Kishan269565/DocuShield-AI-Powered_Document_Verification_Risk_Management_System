import api from "@/utils/api";
import { ApiDocument } from "@/types/document.types";

export const getDocuments = async (): Promise<ApiDocument[]> => {
  const res = await api.get("/document");

  const data = res.data;

  // ✅ Normalize backend response to ALWAYS return an array
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.documents)) return data.documents;
  if (Array.isArray(data.data)) return data.data;

  return [];
};
