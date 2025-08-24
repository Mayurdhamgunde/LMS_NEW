import React, { useState, useEffect } from 'react';
import axios from '../../utils/axiosConfig';
import { API_CONFIG } from '../../config/api';

const ApiTest: React.FC = () => {
  const [status, setStatus] = useState<string>('Testing...');
  const [apiUrl, setApiUrl] = useState<string>('');
  const [testResults, setTestResults] = useState<any>({});

  useEffect(() => {
    setApiUrl(API_CONFIG.BASE_URL);
    testApiConnection();
  }, []);

  const testApiConnection = async () => {
    try {
      // Test basic connection
      const response = await axios.get('/');
      setTestResults(prev => ({
        ...prev,
        basicConnection: {
          status: '✅ Success',
          data: response.data,
          statusCode: response.status
        }
      }));
      setStatus('✅ API connection successful');
    } catch (error: any) {
      setTestResults(prev => ({
        ...prev,
        basicConnection: {
          status: '❌ Failed',
          error: error.message,
          statusCode: error.response?.status
        }
      }));
      setStatus('❌ API connection failed');
    }

    // Test auth endpoint (should return 401 without token)
    try {
      await axios.get('/api/auth/me');
    } catch (error: any) {
      if (error.response?.status === 401) {
        setTestResults(prev => ({
          ...prev,
          authEndpoint: {
            status: '✅ Success (401 expected without token)',
            statusCode: error.response.status
          }
        }));
      } else {
        setTestResults(prev => ({
          ...prev,
          authEndpoint: {
            status: '❌ Unexpected response',
            statusCode: error.response?.status,
            error: error.message
          }
        }));
      }
    }

    // Test courses endpoint
    try {
      const response = await axios.get('/courses');
      setTestResults(prev => ({
        ...prev,
        coursesEndpoint: {
          status: '✅ Success',
          statusCode: response.status,
          hasData: !!response.data
        }
      }));
    } catch (error: any) {
      setTestResults(prev => ({
        ...prev,
        coursesEndpoint: {
          status: '❌ Failed',
          statusCode: error.response?.status,
          error: error.message
        }
      }));
    }

    // Test video quizzes endpoint
    try {
      const response = await axios.get('/vq');
      setTestResults(prev => ({
        ...prev,
        videoQuizzesEndpoint: {
          status: '✅ Success',
          statusCode: response.status,
          hasData: !!response.data
        }
      }));
    } catch (error: any) {
      setTestResults(prev => ({
        ...prev,
        videoQuizzesEndpoint: {
          status: '❌ Failed',
          statusCode: error.response?.status,
          error: error.message
        }
      }));
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">API Configuration Test</h2>
      
      <div className="mb-4">
        <strong>Base URL:</strong> {apiUrl}
      </div>
      
      <div className="mb-4">
        <strong>Status:</strong> {status}
      </div>

      <button
        onClick={testApiConnection}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-4"
      >
        Test API Connection
      </button>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Test Results:</h3>
        
        {Object.entries(testResults).map(([key, result]: [string, any]) => (
          <div key={key} className="p-3 bg-gray-50 rounded">
            <strong>{key}:</strong> {result.status}
            {result.statusCode && <span className="ml-2 text-sm text-gray-600">(Status: {result.statusCode})</span>}
            {result.error && <div className="text-sm text-red-600 mt-1">Error: {result.error}</div>}
            {result.data && <div className="text-sm text-gray-600 mt-1">Data: {JSON.stringify(result.data).substring(0, 100)}...</div>}
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded">
        <h4 className="font-semibold mb-2">Configuration Summary:</h4>
        <ul className="text-sm space-y-1">
          <li>• Proxy: <span className="text-red-600">Disabled</span></li>
          <li>• Direct API calls: <span className="text-green-600">Enabled</span></li>
          <li>• Base URL: {API_CONFIG.BASE_URL}</li>
          <li>• Timeout: {API_CONFIG.REQUEST_CONFIG.TIMEOUT}ms</li>
          <li>• CORS: Configured for localhost ports</li>
        </ul>
      </div>
    </div>
  );
};

export default ApiTest;
