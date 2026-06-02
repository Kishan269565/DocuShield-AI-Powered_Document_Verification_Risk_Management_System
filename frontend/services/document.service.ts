import api from "@/utils/api";

interface CreateDocumentPayload {
  title: string;
  content: string;
}

export const createDocument = (data: CreateDocumentPayload) => {
  return api.post("/document", data);
};

export const getDocuments = () => {
  return api.get("/document");
};
