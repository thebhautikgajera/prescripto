import { useState, useEffect } from 'react';
import { getSymptomHistory } from '../services/symptomHistoryService';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const SymptomHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedItem, setExpandedItem] = useState(null);

  useEffect(() => {
    fetchSymptomHistory();
  }, []);

  const fetchSymptomHistory = async () => {
    try {
      setLoading(true);
      const response = await getSymptomHistory();
      if (response.success) {
        setHistory(response.history);
      }
    } catch (error) {
      console.error('Error fetching symptom history:', error);
      toast.error('Failed to load symptom history');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    if (expandedItem === id) {
      setExpandedItem(null);
    } else {
      setExpandedItem(id);
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy - h:mm a');
    } catch (error) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-600">You haven't checked any symptoms yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((item) => (
        <div key={item._id} className="bg-white rounded-lg shadow-md overflow-hidden">
          <div 
            className="p-4 cursor-pointer hover:bg-gray-50 flex justify-between items-center"
            onClick={() => toggleExpand(item._id)}
          >
            <div>
              <p className="font-medium text-gray-800 truncate max-w-xs md:max-w-md">
                {item.symptoms.length > 100 ? `${item.symptoms.substring(0, 100)}...` : item.symptoms}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-500">{formatDate(item.createdAt)}</p>
                {item.language && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    {item.language.charAt(0).toUpperCase() + item.language.slice(1)}
                  </span>
                )}
              </div>
            </div>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-5 w-5 text-gray-500 transition-transform ${expandedItem === item._id ? 'transform rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          
          {expandedItem === item._id && (
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="mb-4">
                <h3 className="font-semibold text-gray-800 mb-2">Symptoms</h3>
                <p className="text-gray-700 whitespace-pre-line">{item.symptoms}</p>
              </div>
              
              <div className="mb-4">
                <h3 className="font-semibold text-gray-800 mb-2">Analysis</h3>
                <p className="text-gray-700 whitespace-pre-line">{item.analysis}</p>
              </div>
              
              {item.suggestedDoctors && item.suggestedDoctors.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Suggested Doctors</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {item.suggestedDoctors.map((doctor, index) => (
                      <div key={index} className="flex items-center p-3 border border-gray-200 rounded-md">
                        <img 
                          src={doctor.image || 'https://via.placeholder.com/50'} 
                          alt={doctor.name} 
                          className="w-10 h-10 rounded-full object-cover mr-3"
                        />
                        <div>
                          <p className="font-medium text-gray-800">{doctor.name}</p>
                          <p className="text-sm text-gray-600">{doctor.speciality}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default SymptomHistory;