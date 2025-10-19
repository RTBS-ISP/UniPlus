'use client';
import { useState, useEffect, useRef } from 'react';

const TabsComponent = ({ items }) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const firstBtnRef = useRef();

  useEffect(() => {
    firstBtnRef.current?.focus();
  }, []);

  return (
    <div className="flex flex-col w-full mx-5">
      {/* Tab Header */}
      <div className="flex space-x-2 bg-white rounded-lg p-1 w-fit shadow-sm mb-3">
        {items.map((item, index) => (
          <button
            ref={index === 0 ? firstBtnRef : null}
            key={index}
            onClick={() => setSelectedTab(index)}
            className={`px-4 py-1.5 rounded-md text-base font-semibold transition-all duration-150
              ${
                selectedTab === index
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'text-gray-800 hover:bg-indigo-100'
              }`}
          >
            {item.title}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="w-full">
        {items.map((item, index) => (
          <div
            key={index}
            className={`transition-all duration-300 ${
              selectedTab === index ? 'block opacity-100' : 'hidden opacity-0'
            }`}
          >
            {item.content}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TabsComponent;
