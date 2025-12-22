import axios from "axios";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export const wsExecute = `${WS_URL}/execute`;

export const apiStats = {
    list: () => axios.get(`${API_URL}/stats`)
};

export const apiScript = {
    list: () => axios.get(`${API_URL}/scripts`),
    save: async (data: any, id: string | undefined) => {
        return id
            ? await axios.put(`${API_URL}/scripts/${id}`, data)
            : await axios.post(`${API_URL}/scripts`, data);
    },
    delete: async (id: string | undefined) => await axios.delete(`${API_URL}/scripts/${id}`),
};

export const apiExecution = {
    list: () => axios.get(`${API_URL}/executions`)
};