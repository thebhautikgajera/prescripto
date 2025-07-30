import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const getSymptomHistory = async () => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await axios.get(`${API_URL}/api/ai/symptom-history`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching symptom history:', error);
    throw error;
  }
};