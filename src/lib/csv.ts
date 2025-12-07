import { ClassPlan } from './types';

export const parseCsv = async (file: File): Promise<{ rows: Record<string, string>[]; headers: string[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) {
        resolve({ rows: [], headers: [] });
        return;
      }

      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      if (lines.length === 0) {
        resolve({ rows: [], headers: [] });
        return;
      }

      const parseLine = (line: string) => {
        const result: string[] = [];
        let current = '';
        let inQuote = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuote = !inQuote;
          } else if (char === ',' && !inQuote) {
            result.push(current.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
            current = '';
            continue;
          }
          current += char;
        }
        result.push(current.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
        return result;
      };

      const rows: Record<string, string>[] = [];
      const rawText = text.trim();
      
      const rowMatches = rawText.match(/(?:^|\n)(?:"(?:[^"]|"")*"|[^,\n]*)(?:,(?:"(?:[^"]|"")*"|[^,\n]*))*/g);
      
      if (!rowMatches) {
        resolve({ rows: [], headers: [] });
        return;
      }

      const headers = parseLine(rowMatches[0].trim());
      
      for (let i = 1; i < rowMatches.length; i++) {
        const values = parseLine(rowMatches[i].trim());
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] || '';
        });
        rows.push(row);
      }
      
      resolve({ rows, headers });
    };
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
};

export const applyHeaderMapping = (rows: Record<string, string>[], mapping: Record<string, string>): ClassPlan[] => {
  return rows.map((row) => {
    const getVal = (key: string) => row[mapping[key]] || '';

    const planRaw = getVal('weeklyPlanRaw');
    const weeklyPlan = [];
    
    if (planRaw) {
      const lines = planRaw.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        
        const parts = trimmed.split(/[-:]/);
        if (parts.length > 1) {
          weeklyPlan.push({
            weekLabel: parts[0].trim(),
            topic: parts.slice(1).join(' ').trim()
          });
        } else {
          weeklyPlan.push({
            weekLabel: '',
            topic: trimmed
          });
        }
      }
    }

    return {
      id: crypto.randomUUID(),
      title: getVal('title') || '제목 없음',
      subject: getVal('title'), 
      targetStudent: getVal('targetStudent'),
      targetStudentDetail: getVal('targetStudentDetail'),
      teacherName: getVal('teacherName'),
      classDay: getVal('day'),
      classTime: getVal('time'),
      schedule: (getVal('day') + ' ' + getVal('time')).trim(),
      
      course1: getVal('course1'),
      material1: getVal('material1'),
      course2: getVal('course2'),
      material2: getVal('material2'),
      
      learningGoal: getVal('learningGoal'),
      management: getVal('management'),
      parentIntro: '',
      keywords: '',
      etc: getVal('etc'),
      
      weeklyPlan: weeklyPlan.length > 0 ? weeklyPlan : [],
      templateId: 'style1-blue',
      sizePreset: 'A4'
    };
  });
};

