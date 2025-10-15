'use client';

import { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, Search } from 'lucide-react';
import { useAlert } from '../../components/ui/AlertProvider';

interface TagSelectorProps {
  tags: string[];
  setTags: (tags: string[]) => void;
}

const MAX_TAGS = 30;
const MAX_CUSTOM_LEN = 30;

const AVAILABLE_TAGS = [
  'Technology','Science','Business','Engineering','Arts','Sports',
  'Workshop','Conference','Seminar','Networking','Hackathon',
  'Career','Education','Research','Innovation','Startup',
  'AI/ML','Web Development','Mobile','Data Science','Design',
  'Marketing','Finance','Health','Environment','Social Impact',
  'Year 1','Year 2','Year 3','Year 4',
  'Custom'
];

export default function TagSelector({ tags, setTags }: TagSelectorProps) {
  const toast = useAlert(); // ✅

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowCustomInput(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addTag = (tag: string) => {
    if (tag === 'Custom') {
      setShowCustomInput(true);
      setIsOpen(false);
      return;
    }

    if (tags.length >= MAX_TAGS) {
      toast({ text: `You can only add up to ${MAX_TAGS} tags.`, variant: 'error' }); // ✅
      return;
    }

    if (!tags.includes(tag)) setTags([...tags, tag]);
    setSearch('');
    setIsOpen(false);
  };

  const addCustomTag = () => {
    const custom = customInput.trim();
    if (!custom) return;

    if (custom.length > MAX_CUSTOM_LEN) {
      toast({ text: `Custom tag is too long (max ${MAX_CUSTOM_LEN} characters).`, variant: 'warning' }); // ✅
      return;
    }
    if (tags.length >= MAX_TAGS) {
      toast({ text: `You can only add up to ${MAX_TAGS} tags.`, variant: 'error' }); // ✅
      return;
    }
    if (!tags.includes(custom)) setTags([...tags, custom]);
    setCustomInput('');
    setShowCustomInput(false);
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const filteredTags = AVAILABLE_TAGS.filter(
    (tag) =>
      tag.toLowerCase().includes(search.toLowerCase()) &&
      (tag === 'Custom' || !tags.includes(tag))
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-semibold text-black mb-2">Tags</label>

      {/* Selected */}
      <div className="mb-2 min-h-[42px] p-2 border-2 border-gray-200 rounded-xl bg-white flex flex-wrap gap-2">
        {tags.length === 0 ? (
          <span className="text-gray-400 text-sm py-1">No tags selected...</span>
        ) : (
          tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 bg-indigo-500 text-white px-3 py-1 rounded-full text-sm font-medium"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:bg-indigo-600 rounded-full p-0.5 transition-colors"
                aria-label={`Remove ${tag} tag`}
              >
                <X size={14} />
              </button>
            </span>
          ))
        )}
      </div>

      {/* Toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white text-left flex items-center justify-between hover:border-indigo-300 transition-colors focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
      >
        <span className="text-gray-700">
          {isOpen ? 'Select tags...' : 'Click to add tags'}
        </span>
        <ChevronDown size={20} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-2xl max-h-80 overflow-hidden">
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tags..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-black"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {filteredTags.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">No tags found</div>
            ) : (
              filteredTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => addTag(tag)}
                  className={`w-full px-4 py-2.5 text-left hover:bg-indigo-50 transition-colors text-gray-700 text-sm border-b border-gray-100 last:border-b-0 ${
                    tag === 'Custom' ? 'font-semibold text-indigo-600' : ''
                  }`}
                >
                  {tag === 'Custom' ? '✏️ Add Custom Tag...' : tag}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Custom input */}
      {showCustomInput && (
        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-indigo-300 rounded-xl shadow-2xl p-4">
          <label className="block text-sm font-semibold text-black mb-2">Enter Custom Tag</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomTag();
                }
              }}
              placeholder={`Max ${MAX_CUSTOM_LEN} characters`}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-black"
              autoFocus
              maxLength={MAX_CUSTOM_LEN}
            />
            <button
              type="button"
              onClick={addCustomTag}
              className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors font-semibold"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCustomInput(false);
                setCustomInput('');
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-500">{tags.length}/{MAX_TAGS} tags used</div>
        </div>
      )}

      <p className="text-sm text-gray-500 mt-2">
        Click the button above to select tags or add a custom one
      </p>
    </div>
  );
}
