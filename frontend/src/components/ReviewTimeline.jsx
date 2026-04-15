import React from 'react';

const ReviewTimeline = ({ timeline }) => {
  if (!timeline || timeline.length === 0) return null;

  return (
    <div className="mt-4 border-l-2 border-gray-200 ml-2 pl-4 space-y-4">
      {timeline.map((event, index) => (
        <div key={index} className="relative">
          <div className="absolute -left-[25px] mt-1.5 w-4 h-4 rounded-full bg-white border-2 border-indigo-500"></div>
          <div>
            <div className="flex items-center space-x-2">
              <span className={`text-xs font-bold uppercase py-0.5 px-1.5 rounded ${
                event.status === 'Approved' ? 'bg-green-100 text-green-700' :
                event.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {event.status}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(event.timestamp).toLocaleString()}
              </span>
            </div>
            {event.message && (
              <p className="text-sm text-gray-600 mt-1">{event.message}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReviewTimeline;
