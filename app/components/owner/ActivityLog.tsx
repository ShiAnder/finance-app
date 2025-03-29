import React, { useState, useEffect } from "react";
import { AlertCircle, Clock, RefreshCw, User } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ActivityChangeDetail {
  before: Record<string, unknown>;
  after: Record<string, unknown>;
}

interface ActivityLog {
  id: number;
  userId: number;
  userName: string;
  action: string;
  createdAt: string;
  description?: string;
  details?: ActivityChangeDetail;
}

export default function ActivityLog() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  useEffect(() => {
    fetchActivityLogs();
  }, []);

  const fetchActivityLogs = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/activity-logs");
      if (!res.ok) throw new Error("Failed to fetch logs");
      const data: ActivityLog[] = await res.json();
      setLogs(data);
      setIsLoading(false);
    } catch (error: unknown) {
      setIsLoading(false);
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("An unknown error occurred");
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getActionColor = (action: string) => {
    switch(action.toLowerCase()) {
      case 'created': 
        return 'bg-green-50 text-green-700 border border-green-200';
      case 'updated': 
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'deleted': 
        return 'bg-red-50 text-red-700 border border-red-200';
      default: 
        return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  const renderLoadingState = () => (
    <div className="flex justify-center items-center py-10">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const ChangeDetailsModal = () => {
    if (!selectedLog) return null;
  
    const renderChanges = () => {
      if (!selectedLog.details) return null;
  
      const { before, after } = selectedLog.details;
      const changes: { field: string; before: unknown; after: unknown }[] = [];
  
      // Compare before and after objects to find changes
      Object.keys(before).forEach(key => {
        if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
          changes.push({
            field: key,
            before: before[key],
            after: after[key]
          });
        }
      });
  
      if (changes.length === 0) {
        return (
          <div className="text-center text-gray-500 py-4">
            No specific changes recorded
          </div>
        );
      }
  
      return (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800">Changes</h3>
          {changes.map((change, index) => (
            <div 
              key={index} 
              className="bg-white border border-gray-100 rounded-lg p-3 shadow-sm"
            >
              <div className="font-medium text-gray-700 mb-2">
                {change.field}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-gray-500">Before</span>
                  <div className="bg-red-50 text-red-700 p-2 rounded border border-red-100">
                    {JSON.stringify(change.before, null, 2) || <span className="text-gray-400">No previous value</span>}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-gray-500">After</span>
                  <div className="bg-green-50 text-green-700 p-2 rounded border border-green-100">
                    {JSON.stringify(change.after, null, 2) || <span className="text-gray-400">No new value</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    };
  
    const renderDeletedTransactionDetails = () => {
      if (selectedLog.action.toLowerCase() !== 'deleted') return null;
  
      const deletedTransaction = selectedLog.details?.before?.deletedTransaction;
  
      if (!deletedTransaction) return null;
  
      return (
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Deleted Transaction</h3>
          <div className="overflow-x-auto">
            <pre className="text-sm text-gray-600 bg-gray-800 p-4 rounded-lg whitespace-pre-wrap break-all">
              {JSON.stringify(deletedTransaction, null, 2)}
            </pre>
          </div>
        </div>
      );
    };
  
    return (
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent 
          aria-describedby="activity-log-changes-description"
          className="sm:max-w-2xl w-full max-w-lg px-4 py-6 sm:px-6 sm:py-8 overflow-auto"
        >
          <DialogHeader>
            <DialogTitle>Change Details</DialogTitle>
            <DialogDescription id="activity-log-changes-description">
              Details of the activity log changes
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <User className="w-6 h-6 text-blue-500" />
              <div>
                <span className="font-semibold">{selectedLog.userName}</span>
                <span 
                  className={`
                    ml-2 text-xs px-2 py-1 rounded-full
                    ${getActionColor(selectedLog.action)} 
                    font-medium
                  `}
                >
                  {selectedLog.action}
                </span>
                <span className="ml-2 text-sm text-gray-500">
                  {formatDate(selectedLog.createdAt)}
                </span>
              </div>
            </div>
  
            {selectedLog.description && (
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mb-4">
                <p className="text-sm text-gray-600">{selectedLog.description}</p>
              </div>
            )}
  
            {/* Render Deleted Transaction Details */}
            {renderDeletedTransactionDetails()}
  
            {/* Render Other Changes */}
            {renderChanges()}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-5 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Clock className="w-6 h-6" />
          <h2 className="text-xl font-bold tracking-wide">Activity Log</h2>
        </div>
        <button 
          onClick={fetchActivityLogs} 
          className="bg-white/20 hover:bg-white/30 transition-all p-2 rounded-full"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {errorMessage ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <span className="text-sm">{errorMessage}</span>
          </div>
        ) : isLoading ? (
          renderLoadingState()
        ) : logs.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>No recent activities</p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div 
                key={log.id} 
                onClick={() => setSelectedLog(log)}
                className="bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 flex items-start space-x-4 cursor-pointer"
              >
                <div className="bg-blue-100 text-blue-600 rounded-full p-2 mt-1">
                  <User className="w-5 h-5" />
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className="font-semibold text-gray-800">{log.userName}</span>
                      <span 
                        className={`
                          ml-2 text-xs px-2 py-1 rounded-full
                          ${getActionColor(log.action)} 
                          font-medium
                        `}
                      >
                        {log.action}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDate(log.createdAt)}
                    </span>
                  </div>            
                  {log.description && (
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <span className="text-sm font-medium text-gray-700 mb-2 block">Description</span>
                      <div className="overflow-x-auto">
                        <pre className="text-sm text-gray-600 p-4 rounded-lg whitespace-pre-wrap break-all">
                          {typeof log.description === 'string' ? 
                            JSON.stringify(JSON.parse(log.description), null, 2) : 
                            JSON.stringify(log.description, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Change Details Modal */}
      <ChangeDetailsModal />
    </div>
  );
}
