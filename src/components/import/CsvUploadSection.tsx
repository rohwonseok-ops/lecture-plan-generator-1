'use client';

import React, { useRef } from 'react';
import { UploadCloud } from 'lucide-react';
import { parseCsv } from '@/lib/csv';

interface Props {
  onFileParsed: (rows: Record<string, string>[], headers: string[]) => void;
}

const CsvUploadSection: React.FC<Props> = ({ onFileParsed }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const { rows, headers } = await parseCsv(file);
      onFileParsed(rows, headers);
    }
  };

  return (
    <div 
      className="border-2 border-dashed border-zinc-300 rounded-3xl p-20 flex flex-col items-center justify-center text-center hover:border-blue-500 hover:bg-blue-50/30 transition-all duration-300 cursor-pointer group bg-white"
      onClick={() => fileInputRef.current?.click()}
    >
      <input 
        type="file" 
        accept=".csv" 
        className="hidden" 
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <div className="bg-blue-50 p-6 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300 group-hover:bg-blue-100">
        <UploadCloud className="w-12 h-12 text-blue-600" />
      </div>
      <h3 className="text-2xl font-bold text-zinc-800 mb-3">CSV 파일 업로드</h3>
      <p className="text-zinc-500 font-medium text-base max-w-md leading-relaxed">
        이곳을 클릭하거나 파일을 드래그하여 업로드하세요.<br/>
        <span className="text-sm text-zinc-400 mt-2 block font-normal">지원 형식: .csv (쉼표로 구분된 값)</span>
      </p>
    </div>
  );
};

export default CsvUploadSection;

