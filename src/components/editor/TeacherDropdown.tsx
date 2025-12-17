'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ClassPlan } from '@/lib/types';
import { ChevronDown } from 'lucide-react';

interface Props {
  plans: ClassPlan[];
  selectedTeacher: string | null;
  onSelect: (teacher: string | null) => void;
}

const TeacherDropdown: React.FC<Props> = ({ plans, selectedTeacher, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const allTeachers = Array.from(new Set(plans.map(p => p.teacherName).filter(Boolean)));

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 text-xs px-2.5 py-1 rounded-md transition font-medium bg-zinc-900 text-white hover:bg-black"
        aria-label="담당강사 필터"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span>담당강사</span>
        {selectedTeacher ? (
          <span className="text-zinc-300">· {selectedTeacher}</span>
        ) : (
          <span className="text-zinc-300">· 전체</span>
        )}
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-zinc-200 rounded-lg shadow-lg z-50 py-1">
          <button
            onClick={() => {
              onSelect(null);
              setIsOpen(false);
            }}
            className={`w-full px-3 py-2 text-left text-xs hover:bg-zinc-50 transition ${
              selectedTeacher === null ? 'bg-blue-50 text-blue-600 font-medium' : 'text-zinc-800'
            }`}
          >
            전체
          </button>
          {allTeachers.map((teacher) => (
            <button
              key={teacher}
              onClick={() => {
                onSelect(teacher);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 text-left text-xs hover:bg-zinc-50 transition ${
                selectedTeacher === teacher ? 'bg-blue-50 text-blue-600 font-medium' : 'text-zinc-800'
              }`}
            >
              {teacher}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherDropdown;




